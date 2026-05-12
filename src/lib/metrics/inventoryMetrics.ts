import { OrderRow } from '@/types/data'

export function calcDaysOfStock(fulfillable: number, unitsSold: number, days: number): number {
  if (fulfillable === 0) return 0
  if (days === 0 || unitsSold === 0) return Infinity
  return fulfillable / (unitsSold / days)
}

export type StockStatus = 'critical' | 'warning' | 'ok'

export function getStockStatus(days: number): StockStatus {
  if (days === Infinity) return 'ok'
  if (days < 14) return 'critical'
  if (days < 30) return 'warning'
  return 'ok'
}

export function buildAsinSalesMap(orders: OrderRow[], from: string, to: string): Map<string, number> {
  const map = new Map<string, number>()
  for (const o of orders) {
    if (o.purchaseDate < from || o.purchaseDate > to) continue
    if (o.orderStatus === 'Cancelled') continue
    map.set(o.asin, (map.get(o.asin) ?? 0) + o.quantity)
  }
  return map
}
