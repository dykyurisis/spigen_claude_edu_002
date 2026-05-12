import Papa from 'papaparse'
import { SDCampaignRow } from '@/types/data'
import { toNum } from './parseUtils'
import { normalizeDate } from '@/lib/utils/normalizeDate'

export function parseSDCampaigns(csvText: string): SDCampaignRow[] {
  const { data } = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true })
  return data.map((row): SDCampaignRow => ({
    date: normalizeDate(row.date), campaignId: row.campaignId ?? '',
    campaignName: row.campaignName ?? '',
    impressions: toNum(row.impressions), clicks: toNum(row.clicks),
    cost: toNum(row.cost), salesClicks: toNum(row.salesClicks),
    purchasesClicks: toNum(row.purchasesClicks),
    newToBrandSales: toNum(row.newToBrandSales),
    cumulativeReach: toNum(row.cumulativeReach),
    impressionsViews: toNum(row.impressionsViews),
    campaignBudgetAmount: toNum(row.campaignBudgetAmount),
    campaignBudgetType: row.campaignBudgetType ?? '',
    campaignBudgetCurrencyCode: row.campaignBudgetCurrencyCode ?? '',
    campaignStatus: row.campaignStatus ?? '',
    viewClickThroughRate: toNum(row.viewClickThroughRate),
    unitsSoldClicks: toNum(row.unitsSoldClicks),
    detailPageViews: toNum(row.detailPageViews),
    ...row,
  }))
}
