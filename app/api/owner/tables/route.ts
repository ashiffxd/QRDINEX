import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { authErrorToHttpStatus } from '@/lib/auth/errors'
import { TableQuerySchema } from '@/schemas/owner/table-query'
import { CreateTableSchema } from '@/schemas/owner/table'
import { getPaginatedTables, createTable } from '@/services/owner/table.service'

export async function GET(request: NextRequest) {
  const sessionResult = await requireRole(['OWNER'])
  if (!sessionResult.success || !sessionResult.data.restaurantId) {
    return NextResponse.json(
      { success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { searchParams } = request.nextUrl
  const rawQuery = Object.fromEntries(searchParams.entries())

  const parsed = TableQuerySchema.safeParse(rawQuery)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, code: 'VALIDATION_ERROR', message: 'Invalid query parameters.', errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const result = await getPaginatedTables(sessionResult.data.restaurantId, parsed.data)
    return NextResponse.json({ success: true, data: result.data, metadata: result.metadata })
  } catch (error) {
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to fetch tables.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const sessionResult = await requireRole(['OWNER'])
  if (!sessionResult.success || !sessionResult.data.restaurantId) {
    return NextResponse.json(
      { success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' },
      { status: 401 }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, code: 'INVALID_REQUEST', message: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = CreateTableSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, code: 'VALIDATION_ERROR', message: 'Invalid data.', errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  try {
    const result = await createTable(sessionResult.data.restaurantId, parsed.data)
    if (!result.success) {
      return NextResponse.json({ success: false, code: result.code, message: result.message }, { status: 400 })
    }
    return NextResponse.json({ success: true, data: result.data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to create table.' }, { status: 500 })
  }
}
