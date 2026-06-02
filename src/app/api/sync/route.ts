import { NextRequest, NextResponse } from 'next/server'
import { syncSheetToSupabase } from '@/lib/sync/sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Sheet → Supabase sync endpoint, called hourly by Cloud Scheduler.
 * Protected by the x-sync-token header (SYNC_SECRET env var).
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get('x-sync-token')
  if (!process.env.SYNC_SECRET || token !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const result = await syncSheetToSupabase()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[api/sync] sync failed:', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
