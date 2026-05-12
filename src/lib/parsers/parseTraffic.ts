import Papa from 'papaparse'
import { TrafficRow } from '@/types/data'
import { toNum } from './parseUtils'
import { normalizeDate } from '@/lib/utils/normalizeDate'

function pct(raw: unknown): number { return toNum(String(raw ?? '').replace(/%$/, '')) }

export function parseTraffic(csvText: string): TrafficRow[] {
  const { data } = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true })
  return data.map((row): TrafficRow => ({
    parentAsin: row['(Parent) ASIN'] ?? '',
    childAsin: row['(Child) ASIN'] ?? '',
    title: row['Title'] ?? '',
    sessionsTotal: toNum(row['Sessions - Total']),
    sessionsTotalB2B: toNum(row['Sessions – Total – B2B']),
    pageViewsTotal: toNum(row['Page Views - Total']),
    pageViewsTotalB2B: toNum(row['Page Views – Total – B2B']),
    buyBoxPercentage: pct(row['Featured Offer (Buy Box) Percentage']),
    buyBoxPercentageB2B: pct(row['Featured Offer (Buy Box) Percentage – B2B']),
    unitsOrdered: toNum(row['Units ordered']),
    unitsOrderedB2B: toNum(row['Units ordered - B2B']),
    unitSessionPercentage: pct(row['Unit session percentage']),
    unitSessionPercentageB2B: pct(row['Unit session percentage - B2B']),
    orderedProductSales: toNum(row['Ordered product sales']),
    orderedProductSalesB2B: toNum(row['Ordered product sales - B2B']),
    totalOrderItems: toNum(row['Total order items']),
    reportDate: normalizeDate(row['report_date']),
  }))
}
