import Papa from 'papaparse'
import { SBCampaignRow } from '@/types/data'
import { toNum } from './parseUtils'
import { normalizeDate } from '@/lib/utils/normalizeDate'

export function parseSBCampaigns(csvText: string): SBCampaignRow[] {
  const { data } = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true })
  return data.map((row): SBCampaignRow => ({
    ...row,
    date: normalizeDate(row.date), campaignId: row.campaignId ?? '',
    campaignName: row.campaignName ?? '',
    impressions: toNum(row.impressions), clicks: toNum(row.clicks),
    cost: toNum(row.cost), salesClicks: toNum(row.salesClicks),
    purchasesClicks: toNum(row.purchasesClicks),
    newToBrandSales: toNum(row.newToBrandSales),
    newToBrandPurchases: toNum(row.newToBrandPurchases),
    newToBrandPurchasesPercentage: toNum(row.newToBrandPurchasesPercentage),
    detailPageViews: toNum(row.detailPageViews),
    brandedSearches: toNum(row.brandedSearches),
    campaignBudgetAmount: toNum(row.campaignBudgetAmount),
    campaignBudgetType: row.campaignBudgetType ?? '',
    campaignBudgetCurrencyCode: row.campaignBudgetCurrencyCode ?? '',
    campaignStatus: row.campaignStatus ?? '',
    viewClickThroughRate: toNum(row.viewClickThroughRate),
    unitsSoldClicks: toNum(row.unitsSoldClicks),
    topOfSearchImpressionShare: toNum(row.topOfSearchImpressionShare),
    viewableImpressions: toNum(row.viewableImpressions),
  }))
}
