'use client'

import { CartItemDetail } from '@/services/customer/cart.service'
import { Minus, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useCart } from './CartProvider'

interface CartItemCardProps {
  item: CartItemDetail
}

export function CartItemCard({ item }: CartItemCardProps) {
  const { updateItemQuantity } = useCart()

  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      {/* Image */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.itemName}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <span className="text-[10px]">No image</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div
                className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-[2px] border ${
                  item.isVeg ? 'border-green-600' : 'border-red-600'
                }`}
              >
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    item.isVeg ? 'bg-green-600' : 'bg-red-600'
                  }`}
                />
              </div>
              <h3 className="font-semibold leading-tight text-foreground line-clamp-2">
                {item.itemName}
              </h3>
            </div>
            <p className="font-bold text-foreground">
              ${item.price.toFixed(2)}
            </p>
          </div>

          <button
            onClick={() => updateItemQuantity(item.menuItemId, -item.quantity)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Quantity Controls */}
        <div className="mt-3 flex items-center gap-3 self-start rounded-full border border-border bg-background p-1 shadow-sm">
          <button
            onClick={() => updateItemQuantity(item.menuItemId, -1)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:bg-muted"
          >
            <Minus className="h-4 w-4" />
          </button>
          
          <span className="w-4 text-center text-sm font-semibold text-foreground">
            {item.quantity}
          </span>
          
          <button
            onClick={() => updateItemQuantity(item.menuItemId, 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
