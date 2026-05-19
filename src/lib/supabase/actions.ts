'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  DataType,
  SPCampaignRow, SBCampaignRow, SDCampaignRow,
  OrderRow, ListingRow, InventoryRow, TrafficRow, AttributionRow,
} from '@/types/data'
import { toDbRows, fromDbRows } from './mappers'

const TYPE_TO_TABLE: Record<DataType, string> = {
  sp_campaigns: 'sp_campaigns',
  sb_campaigns: 'sb_campaigns',
  sd_campaigns: 'sd_campaigns',
  orders: 'orders',
  listing: 'listing',
  inventory: 'inventory',
  traffic: 'traffic',
  attribution: 'attribution',
}

export async function upsertData(type: DataType, rows: unknown[]): Promise<void> {
  if (rows.length === 0) return
  const supabase = await createClient()
  const table = TYPE_TO_TABLE[type]
  const dbRows = toDbRows(type, rows)

  // Supabase upsert in batches of 500 to avoid request size limits
  const BATCH = 500
  for (let i = 0; i < dbRows.length; i += BATCH) {
    const batch = dbRows.slice(i, i + BATCH)
    const { error } = await supabase.from(table).upsert(batch)
    if (error) throw new Error(`[${table}] upsert failed: ${error.message}`)
  }
}

export async function fetchAllData() {
  const supabase = await createClient()

  const [sp, sb, sd, orders, listing, inventory, traffic, attribution] = await Promise.all([
    supabase.from('sp_campaigns').select('*'),
    supabase.from('sb_campaigns').select('*'),
    supabase.from('sd_campaigns').select('*'),
    supabase.from('orders').select('*'),
    supabase.from('listing').select('*'),
    supabase.from('inventory').select('*'),
    supabase.from('traffic').select('*'),
    supabase.from('attribution').select('*'),
  ])

  return {
    spCampaigns: fromDbRows<SPCampaignRow>('sp_campaigns', sp.data ?? []),
    sbCampaigns: fromDbRows<SBCampaignRow>('sb_campaigns', sb.data ?? []),
    sdCampaigns: fromDbRows<SDCampaignRow>('sd_campaigns', sd.data ?? []),
    orders: fromDbRows<OrderRow>('orders', orders.data ?? []),
    listing: fromDbRows<ListingRow>('listing', listing.data ?? []),
    inventory: fromDbRows<InventoryRow>('inventory', inventory.data ?? []),
    traffic: fromDbRows<TrafficRow>('traffic', traffic.data ?? []),
    attribution: fromDbRows<AttributionRow>('attribution', attribution.data ?? []),
  }
}
