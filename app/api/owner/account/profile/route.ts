import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { updateUserProfile } from '@/services/auth/account.service'

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireRole(['OWNER'])
    if (!auth.success) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fullName, email, phoneNumber } = body

    const result = await updateUserProfile(auth.data.userId, {
      fullName,
      email,
      phoneNumber,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, user: result.data })
  } catch (error: any) {
    console.error('[PATCH /api/owner/account/profile] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
