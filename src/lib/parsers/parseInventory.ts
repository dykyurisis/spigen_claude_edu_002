import Papa from 'papaparse'
import { InventoryRow } from '@/types/data'
import { toNum } from './parseUtils'
import { normalizeDate } from '@/lib/utils/normalizeDate'

export function parseInventory(csvText: string): InventoryRow[] {
  const { data } = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true })
  return data.map((row): InventoryRow => ({
    sku: row['sku'] ?? '', fnsku: row['fnsku'] ?? '',
    asin: row['asin'] ?? '', productName: row['product-name'] ?? '',
    condition: row['condition'] ?? '', yourPrice: toNum(row['your-price']),
    afnFulfillableQuantity: toNum(row['afn-fulfillable-quantity']),
    afnUnsellableQuantity: toNum(row['afn-unsellable-quantity']),
    afnReservedQuantity: toNum(row['afn-reserved-quantity']),
    afnTotalQuantity: toNum(row['afn-total-quantity']),
    afnInboundWorkingQuantity: toNum(row['afn-inbound-working-quantity']),
    afnInboundShippedQuantity: toNum(row['afn-inbound-shipped-quantity']),
    afnInboundReceivingQuantity: toNum(row['afn-inbound-receiving-quantity']),
    reportDate: normalizeDate(row['report_date']),
    afnWarehouseQuantity: toNum(row['afn-warehouse-quantity']),
    afnResearchingQuantity: toNum(row['afn-researching-quantity']),
    afnReservedFutureSupply: toNum(row['afn-reserved-future-supply']),
    afnFutureSupplyBuyable: toNum(row['afn-future-supply-buyable']),
    store: row['store'] ?? '',
  }))
}
