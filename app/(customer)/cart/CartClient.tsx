'use client'

import { useCart } from '@/components/customer/cart/CartProvider'
import { CartItemCard } from '@/components/customer/cart/CartItemCard'
import { ArrowLeft, ShoppingBag, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function CartClient() {
  const { cart, isLoading, error, refreshCart } = useCart()
  const router = useRouter()
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [placeError, setPlaceError] = useState<string | null>(null)

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true)
    setPlaceError(null)
    try {
      const res = await fetch('/api/customer/orders', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        await refreshCart()
        router.push('/orders/success')
      } else {
        setPlaceError(data.message || 'Failed to place order.')
      }
    } catch (err) {
      setPlaceError('Network error. Please try again.')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  if (isLoading && !cart) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading your cart...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
        <p className="text-destructive">{error}</p>
        <button onClick={() => router.push('/menu')} className="mt-4 rounded-full bg-primary px-6 py-2 text-primary-foreground">
          Return to Menu
        </button>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <ShoppingBag className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Your cart is empty</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Looks like you haven't added anything to your cart yet.
        </p>
        <Link
          href="/menu"
          className="mt-8 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground transition-transform hover:scale-105"
        >
          Browse Menu
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-32 pt-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/menu"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Your Cart</h1>
      </div>

      {/* Items */}
      <div className="space-y-4">
        {cart.items.map((item) => (
          <CartItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* Sticky Summary / Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 flex items-center justify-between text-base font-medium text-foreground">
            <span>Subtotal ({cart.totalItems} items)</span>
            <span className="font-bold">${cart.subtotal.toFixed(2)}</span>
          </div>

          {placeError && (
            <p className="mb-2 text-center text-sm font-medium text-destructive">
              {placeError}
            </p>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-base font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPlacingOrder ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Place Order'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
