'use client'

import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useCart } from './CartProvider'

export function FloatingCartButton() {
  const { cart, isLoading } = useCart()

  if (isLoading || !cart || cart.totalItems === 0) {
    return null
  }

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 mx-auto flex w-full max-w-md justify-center px-4">
      <Link
        href="/cart"
        className="flex w-full items-center justify-between rounded-full bg-primary px-6 py-3 text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary">
              {cart.totalItems}
            </span>
          </div>
          <span className="font-semibold">View Cart</span>
        </div>
        <span className="font-bold tracking-tight">
          ${cart.subtotal.toFixed(2)}
        </span>
      </Link>
    </div>
  )
}
