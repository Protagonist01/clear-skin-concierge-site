import { NextRequest, NextResponse } from 'next/server'
import { listScheduleAvailability } from '@/lib/schedule-store'

export async function GET(req: NextRequest) {
  const locationId = req.nextUrl.searchParams.get('locationId') || 'london'
  const selectedDate = req.nextUrl.searchParams.get('date') || undefined

  return NextResponse.json(
    listScheduleAvailability({
      locationId,
      selectedDate,
    }),
  )
}
