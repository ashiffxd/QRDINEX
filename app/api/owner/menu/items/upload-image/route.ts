import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { uploadImageBuffer } from '@/services/owner/cloudinary.service'

export async function POST(request: NextRequest) {
  const sessionResult = await requireRole(['OWNER'])
  if (!sessionResult.success || !sessionResult.data.restaurantId) {
    return NextResponse.json({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ success: false, code: 'BAD_REQUEST', message: 'No image file provided.' }, { status: 400 })
    }

    // Validate size (e.g. max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, code: 'PAYLOAD_TOO_LARGE', message: 'Image size must be less than 5MB.' }, { status: 413 })
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, code: 'UNSUPPORTED_MEDIA_TYPE', message: 'File must be an image.' }, { status: 415 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const secureUrl = await uploadImageBuffer(buffer)

    return NextResponse.json({ success: true, data: { url: secureUrl } }, { status: 200 })
  } catch (error) {
    console.error('[Cloudinary Upload Error]', error)
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to upload image.' }, { status: 500 })
  }
}
