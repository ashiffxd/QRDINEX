import { ReactNode } from 'react'

import { CartProvider } from '@/components/customer/cart/CartProvider'
import { SessionStatusGuard } from '@/components/customer/SessionStatusGuard'

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CartProvider>
        <SessionStatusGuard>
          <main className="flex-1">
            {children}
          </main>
        </SessionStatusGuard>
      </CartProvider>
    </div>
  )
}
