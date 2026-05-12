import { AttributionRow } from '@/types/data'

export function buildCampaignToProductMap(rows: AttributionRow[]): Map<string, AttributionRow[]> {
  const map = new Map<string, AttributionRow[]>()
  for (const row of rows) {
    if (!row.campaignId) continue
    const arr = map.get(row.campaignId) ?? []
    arr.push(row)
    map.set(row.campaignId, arr)
  }
  return map
}

export function buildProductToCampaignMap(rows: AttributionRow[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const row of rows) {
    if (!row.productAsin) continue
    const set = map.get(row.productAsin) ?? new Set<string>()
    set.add(row.campaignId)
    map.set(row.productAsin, set)
  }
  return map
}
