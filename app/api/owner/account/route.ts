import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { getProfile } from '@/services/auth/account.service'

export async function GET() {
  try {
    const auth = await requireRole('OWNER')
    if (!auth.success) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const profileResult = await getProfile(auth.data.userId)
    if (!profileResult.success) {
      return NextResponse.json(
        { success: false, message: profileResult.error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, user: profileResult.data })
  } catch (error: any) {
    console.error('[GET /api/owner/account] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
