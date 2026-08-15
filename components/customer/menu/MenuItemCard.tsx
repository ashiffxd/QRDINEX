'use client'

import { CustomerMenuItem } from '@/services/customer/menu.service'
import { Clock } from 'lucide-react'
import Image from 'next/image'
import { useCart } from '../cart/CartProvider'

interface MenuItemCardProps {
  item: CustomerMenuItem
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { updateItemQuantity } = useCart()
  const isOutOfStock = item.status === 'OUT_OF_STOCK'

  return (
    <div className={`flex gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-opacity ${isOutOfStock ? 'opacity-60 grayscale-[0.5]' : ''}`}>
      {/* Text Content */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                  item.isVeg ? 'border-green-600' : 'border-red-600'
                }`}
                title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    item.isVeg ? 'bg-green-600' : 'bg-red-600'
                  }`}
                />
              </div>
              <h3 className="font-semibold text-foreground line-clamp-2">
                {item.itemName}
              </h3>
            </div>
          </div>

          {item.description && (
            <p className="mt-1.5 text-sm leading-snug text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="font-bold text-foreground">
            ₹{item.price.toFixed(2)}
          </span>
          {item.prepTimeMinutes && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{item.prepTimeMinutes}m</span>
            </div>
          )}
        </div>

        {isOutOfStock && (
          <div className="mt-2 inline-flex self-start rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Unavailable
          </div>
        )}
      </div>

      {/* Image & Add Button */}
      <div className="flex flex-col items-end gap-2">
        {item.imageUrl ? (
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image
              src={item.imageUrl}
              alt={item.itemName}
              fill
              className="object-cover"
              sizes="112px"
            />
          </div>
        ) : (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
            <span className="text-xs">No image</span>
          </div>
        )}

        {!isOutOfStock && (
          <button
            onClick={() => updateItemQuantity(item.id, 1)}
            className="flex h-8 w-28 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            Add
          </button>
        )}
      </div>
    </div>
  )
}
