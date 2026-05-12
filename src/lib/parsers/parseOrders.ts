import Papa from 'papaparse'
import { OrderRow } from '@/types/data'
import { toNum, toBool } from './parseUtils'
import { normalizeDate } from '@/lib/utils/normalizeDate'

export function parseOrders(csvText: string): OrderRow[] {
  const { data } = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true })
  return data.map((row): OrderRow => ({
    amazonOrderId: row['amazon-order-id'] ?? '',
    merchantOrderId: row['merchant-order-id'] ?? '',
    purchaseDate: normalizeDate(row['purchase-date']),
    lastUpdatedDate: row['last-updated-date'] ?? '',
    orderStatus: row['order-status'] ?? '',
    fulfillmentChannel: row['fulfillment-channel'] ?? '',
    salesChannel: row['sales-channel'] ?? '',
    sku: row['sku'] ?? '', asin: row['asin'] ?? '',
    quantity: toNum(row['quantity']), currency: row['currency'] ?? '',
    itemPrice: toNum(row['item-price']), itemTax: toNum(row['item-tax']),
    shipCountry: row['ship-country'] ?? '', shipCity: row['ship-city'] ?? '',
    shipState: row['ship-state'] ?? '', shipPostalCode: row['ship-postal-code'] ?? '',
    isBusinessOrder: toBool(row['is-business-order']),
  }))
}
