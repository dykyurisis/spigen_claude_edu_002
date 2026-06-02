import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { toDbRows } from '@/lib/supabase/mappers'
import { fetchSheetData } from '@/lib/google/sheets-actions'
import type { DataType } from '@/types/data'

/** type → { Supabase table, fetchSheetData payload key, NOT NULL column used for delete-all } */
const SYNC_TARGETS: ReadonlyArray<{
  type: DataType
  table: string
  payloadKey:
    | 'orders' | 'inventory' | 'listing' | 'traffic' | 'attribution'
    | 'spCampaigns' | 'sbCampaigns' | 'sdCampaigns'
  deleteKey: string
}> = [
  { type: 'orders', table: 'orders', payloadKey: 'orders', deleteKey: 'amazon_order_id' },
  { type: 'inventory', table: 'inventory', payloadKey: 'inventory', deleteKey: 'sku' },
  { type: 'listing', table: 'listing', payloadKey: 'listing', deleteKey: 'seller_sku' },
  { type: 'traffic', table: 'traffic', payloadKey: 'traffic', deleteKey: 'child_asin' },
  { type: 'attribution', table: 'attribution', payloadKey: 'attribution', deleteKey: 'campaign_id' },
  { type: 'sp_campaigns', table: 'sp_campaigns', payloadKey: 'spCampaigns', deleteKey: 'campaign_id' },
  { type: 'sb_campaigns', table: 'sb_campaigns', payloadKey: 'sbCampaigns', deleteKey: 'campaign_id' },
  { type: 'sd_campaigns', table: 'sd_campaigns', payloadKey: 'sdCampaigns', deleteKey: 'campaign_id' },
]

const BATCH = 500

export interface SyncResult {
  perType: Record<string, number>
  totalRows: number
  durationMs: number
}

/**
 * Sheet → Supabase full sync. The sheet is the source of truth:
 * each table is cleared then refilled (per-table, sequential, so the
 * empty-data window is bounded to one table at a time).
 */
export async function syncSheetToSupabase(): Promise<SyncResult> {
  const started = Date.now()
  const data = await fetchSheetData()
  const supabase = await createClient()

  const perType: Record<string, number> = {}

  for (const { type, table, payloadKey, deleteKey } of SYNC_TARGETS) {
    const rows = data[payloadKey] as unknown[]

    // delete-all: PostgREST requires a filter — neq against an impossible
    // sentinel matches every row (deleteKey columns are all NOT NULL).
    const { error: delError } = await supabase
      .from(table)
      .delete()
      .neq(deleteKey, '___none___')
    if (delError) throw new Error(`[${table}] delete failed: ${delError.message}`)

    const dbRows = toDbRows(type, rows)
    for (let i = 0; i < dbRows.length; i += BATCH) {
      const batch = dbRows.slice(i, i + BATCH)
      const { error: insError } = await supabase.from(table).insert(batch)
      if (insError) throw new Error(`[${table}] insert failed: ${insError.message}`)
    }
    perType[type] = dbRows.length
  }

  return {
    perType,
    totalRows: Object.values(perType).reduce((a, b) => a + b, 0),
    durationMs: Date.now() - started,
  }
}
