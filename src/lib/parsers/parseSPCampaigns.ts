import Papa from 'papaparse'
import { SPCampaignRow } from '@/types/data'
import { toNum } from './parseUtils'
import { normalizeDate } from '@/lib/utils/normalizeDate'

export function parseSPCampaigns(csvText: string): SPCampaignRow[] {
  const { data } = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true })
  return data.map((row): SPCampaignRow => ({
    date: normalizeDate(row.date), campaignId: row.campaignId ?? '',
    campaignName: row.campaignName ?? '',
    impressions: toNum(row.impressions), clicks: toNum(row.clicks),
    spend: toNum(row.spend), cost: toNum(row.cost),
    sales14d: toNum(row.sales14d), purchases14d: toNum(row.purchases14d),
    sales7d: toNum(row.sales7d), sales1d: toNum(row.sales1d), sales30d: toNum(row.sales30d),
    campaignBudgetAmount: toNum(row.campaignBudgetAmount),
    campaignBudgetType: row.campaignBudgetType ?? '',
    campaignBudgetCurrencyCode: row.campaignBudgetCurrencyCode ?? '',
    campaignStatus: row.campaignStatus ?? '',
    costPerClick: toNum(row.costPerClick), clickThroughRate: toNum(row.clickThroughRate),
    unitsSoldClicks14d: toNum(row.unitsSoldClicks14d),
    topOfSearchImpressionShare: toNum(row.topOfSearchImpressionShare),
    campaignBiddingStrategy: row.campaignBiddingStrategy ?? '',
    campaignRuleBasedBudgetAmount: toNum(row.campaignRuleBasedBudgetAmount),
    ...row,
  }))
}
