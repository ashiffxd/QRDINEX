import { NextResponse } from 'next/server'

// Forces this route to be evaluated on every request (prevents static compilation caching)
export const dynamic = 'force-dynamic'

export async function GET() {
  return new NextResponse('OK', { status: 200 })
}
