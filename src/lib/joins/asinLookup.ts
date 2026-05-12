import { ListingRow } from '@/types/data'

export function buildAsinLookup(listings: ListingRow[]): Map<string, ListingRow> {
  const map = new Map<string, ListingRow>()
  for (const row of listings) {
    if (row.asin1 && !map.has(row.asin1)) map.set(row.asin1, row)
    if (row.asin2 && !map.has(row.asin2)) map.set(row.asin2, row)
    if (row.asin3 && !map.has(row.asin3)) map.set(row.asin3, row)
  }
  return map
}
