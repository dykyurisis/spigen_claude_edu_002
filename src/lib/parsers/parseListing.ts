import Papa from 'papaparse'
import { ListingRow } from '@/types/data'
import { toNum } from './parseUtils'

export function parseListing(csvText: string): ListingRow[] {
  const { data } = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true })
  return data.map((row): ListingRow => ({
    itemName: row['item-name'] ?? '', sellerSku: row['seller-sku'] ?? '',
    asin1: row['asin1'] ?? '', asin2: row['asin2'] ?? '', asin3: row['asin3'] ?? '',
    price: toNum(row['price']), status: row['status'] ?? '',
    fulfillmentChannel: row['fulfillment-channel'] ?? '',
    openDate: row['open-date'] ?? '',
    quantity: toNum(row['quantity']), pendingQuantity: toNum(row['pending-quantity']),
  }))
}
