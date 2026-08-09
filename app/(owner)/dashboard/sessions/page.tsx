import { Metadata } from 'next'
import { SessionsDashboardClient } from '@/components/owner/sessions/SessionsDashboardClient'

export const metadata: Metadata = {
  title: 'Dining Sessions — QRDineX',
  description: 'Manage active and completed dining sessions for your restaurant.',
}

export default function SessionsDashboardPage() {
  return (
    <div className="p-6">
      <SessionsDashboardClient />
    </div>
  )
}
