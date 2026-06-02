'use server'

import Papa from 'papaparse'
import { parseCSV } from '@/lib/parsers'
import type { DataType, StorageSchema } from '@/types/data'
import { batchGetTabs } from './sheetsClient'

/** Korean tab title → DataType. Tab names must match the spreadsheet exactly. */
const TAB_TO_TYPE: ReadonlyArray<readonly [string, DataType]> = [
  ['주문', 'orders'],
  ['재고', 'inventory'],
  ['리스팅', 'listing'],
  ['트래픽', 'traffic'],
  ['어트리뷰션', 'attribution'],
  ['SP광고', 'sp_campaigns'],
  ['SB광고', 'sb_campaigns'],
  ['SD광고', 'sd_campaigns'],
] as const

type HydratePayload = Omit<StorageSchema, 'uploadedAt' | 'dateRange'>

const KEY_OF: Record<DataType, keyof HydratePayload> = {
  orders: 'orders',
  inventory: 'inventory',
  listing: 'listing',
  traffic: 'traffic',
  attribution: 'attribution',
  sp_campaigns: 'spCampaigns',
  sb_campaigns: 'sbCampaigns',
  sd_campaigns: 'sdCampaigns',
}

/**
 * Read all 8 tabs of the Google Sheet in one batchGet call and parse each tab
 * through the existing CSV parsers (headers match the original CSV exports).
 * Always fetches fresh data — server actions are never cached, so sheet edits
 * appear on the next page refresh.
 */
export async function fetchSheetData(): Promise<HydratePayload> {
  const valueRanges = await batchGetTabs(TAB_TO_TYPE.map(([tab]) => tab))

  const result: HydratePayload = {
    spCampaigns: [],
    sbCampaigns: [],
    sdCampaigns: [],
    orders: [],
    listing: [],
    inventory: [],
    traffic: [],
    attribution: [],
  }

  // valueRanges come back in the same order as the requested ranges —
  // align by index (the API re-quotes range strings, so don't match on vr.range).
  valueRanges.forEach((vr, i) => {
    const [, type] = TAB_TO_TYPE[i]
    const values = vr.values
    if (!values || values.length < 2) return // empty or header-only tab
    const csvText = Papa.unparse(values as string[][])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result[KEY_OF[type]] = parseCSV(type, csvText) as any
  })

  return result
}
