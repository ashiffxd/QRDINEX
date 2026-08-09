'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { CartPayload } from '@/services/customer/cart.service'
import { useCustomerSocket } from '@/hooks/useCustomerSocket'
import { CART_EVENTS } from '@/lib/socket/events'

interface CartContextType {
  cart: CartPayload | null
  isLoading: boolean
  error: string | null
  refreshCart: () => Promise<void>
  updateItemQuantity: (menuItemId: string, quantityChange: number) => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { on } = useCustomerSocket()

  const refreshCart = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/customer/cart')
      const data = await res.json()
      if (data.success) {
        setCart(data.cart)
        setError(null)
      } else {
        setError(data.message)
      }
    } catch (e) {
      setError('Failed to load cart')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  // Real-time shared cart synchronization
  useEffect(() => {
    const unsubCart = on(CART_EVENTS.UPDATED, () => {
      refreshCart()
    })
    return () => unsubCart()
  }, [on, refreshCart])

  const updateItemQuantity = async (menuItemId: string, quantityChange: number) => {
    try {
      // Optimistic update could go here, but for now we wait for server to ensure consistency
      const res = await fetch('/api/customer/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId, quantityChange }),
      })
      
      const data = await res.json()
      if (data.success) {
        await refreshCart()
      } else {
        alert(data.message || 'Failed to update cart')
      }
    } catch (e) {
      alert('Network error while updating cart')
    }
  }

  return (
    <CartContext.Provider value={{ cart, isLoading, error, refreshCart, updateItemQuantity }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
