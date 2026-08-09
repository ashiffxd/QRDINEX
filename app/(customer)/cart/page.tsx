import { Metadata } from 'next'
import { CartClient } from './CartClient'

export const metadata: Metadata = {
  title: 'Cart — QRDineX',
  description: 'View your shared dining cart.',
  robots: { index: false, follow: false },
}

export default function CartPage() {
  return <CartClient />
}
