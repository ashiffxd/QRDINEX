import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { getOrders, GetOrdersOptions } from '@/services/owner/order.service'
import { OrderStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole('OWNER')
    if (!session.success || !session.data.restaurantId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const statusParam = searchParams.get('status')
    const search = searchParams.get('search')
    const sortByParam = searchParams.get('sortBy')
    const sortOrderParam = searchParams.get('sortOrder')

    const options: GetOrdersOptions = {
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 20 : limit,
    }

    if (statusParam && statusParam !== 'ALL') {
      options.status = statusParam as OrderStatus
    }

    if (search) {
      const tableNumber = parseInt(search)
      if (!isNaN(tableNumber)) {
        options.tableNumber = tableNumber
      }
    }

    if (sortByParam === 'createdAt' || sortByParam === 'tableNumber' || sortByParam === 'totalAmount') {
      options.sortBy = sortByParam
    }

    if (sortOrderParam === 'asc' || sortOrderParam === 'desc') {
      options.sortOrder = sortOrderParam
    }

    const result = await getOrders(session.data.restaurantId, options)

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[Owner Orders API] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
