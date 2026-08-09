import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { changePassword } from '@/services/auth/account.service'
import { deleteAuthCookie } from '@/lib/auth/cookie'

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireRole('OWNER')
    if (!auth.success) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body

    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json({ success: false, message: 'Current password is required.' }, { status: 400 })
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ success: false, message: 'New password is required.' }, { status: 400 })
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, message: 'New password and confirmation do not match.' }, { status: 400 })
    }

    const result = await changePassword(auth.data.userId, {
      currentPassword,
      newPassword,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.message },
        { status: 400 }
      )
    }

    // Invalidate existing login session by deleting auth cookie
    await deleteAuthCookie()

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
      loggedOut: true,
    })
  } catch (error: any) {
    console.error('[PATCH /api/owner/account/password] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
