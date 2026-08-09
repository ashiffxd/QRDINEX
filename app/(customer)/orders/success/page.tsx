import { Metadata } from 'next'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Order Success — QRDineX',
  description: 'Your order has been placed successfully.',
  robots: { index: false, follow: false },
}

export default function OrderSuccessPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-50 dark:bg-green-500/10">
        <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500" />
      </div>
      
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
        Order Placed!
      </h1>
      
      <p className="mx-auto mb-8 max-w-sm text-base text-muted-foreground">
        Your order has been successfully sent to the kitchen. It will be prepared shortly!
      </p>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link
          href="/orders"
          className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3.5 text-base font-bold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
        >
          View Order Status
        </Link>
        <Link
          href="/menu"
          className="flex w-full items-center justify-center rounded-xl bg-muted px-4 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-muted/80"
        >
          Back to Menu
        </Link>
      </div>
    </div>
  )
}
