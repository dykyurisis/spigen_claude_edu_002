import Papa from 'papaparse'
import { AttributionRow } from '@/types/data'
import { toNum } from './parseUtils'
import { normalizeDate } from '@/lib/utils/normalizeDate'

export function parseAttribution(csvText: string): AttributionRow[] {
  const { data } = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true })
  return data.map((row): AttributionRow => ({
    date: normalizeDate(row['date']),
    campaignId: row['campaignId'] ?? '', adGroupId: row['adGroupId'] ?? '',
    productAsin: row['productAsin'] ?? '', productName: row['productName'] ?? '',
    publisher: row['publisher'] ?? '',
    productConversionType: row['productConversionType'] ?? '',
    attributedSales14d: toNum(row['attributedSales14d']),
    attributedPurchases14d: toNum(row['attributedPurchases14d']),
    attributedNewToBrandSales14d: toNum(row['attributedNewToBrandSales14d']),
    attributedNewToBrandPurchases14d: toNum(row['attributedNewToBrandPurchases14d']),
    brandHaloAttributedSales14d: toNum(row['brandHaloAttributedSales14d']),
    brandHaloAttributedPurchases14d: toNum(row['brandHaloAttributedPurchases14d']),
    brandHaloNewToBrandSales14d: toNum(row['brandHaloNewToBrandSales14d']),
    unitsSold14d: toNum(row['unitsSold14d']),
    attributedDetailPageViewsClicks14d: toNum(row['attributedDetailPageViewsClicks14d']),
    attributedAddToCartClicks14d: toNum(row['attributedAddToCartClicks14d']),
    advertiserName: row['advertiserName'] ?? '',
    productCategory: row['productCategory'] ?? '',
    productSubcategory: row['productSubcategory'] ?? '',
    brandName: row['brandName'] ?? '', marketplace: row['marketplace'] ?? '',
    brandHaloUnitsSold14d: toNum(row['brandHaloUnitsSold14d']),
    brandHaloNewToBrandPurchases14d: toNum(row['brandHaloNewToBrandPurchases14d']),
    brandHaloNewToBrandUnitsSold14d: toNum(row['brandHaloNewToBrandUnitsSold14d']),
    brandHaloAttributedAddToCartClicks14d: toNum(row['brandHaloAttributedAddToCartClicks14d']),
    brandHaloDetailPageViewsClicks14d: toNum(row['brandHaloDetailPageViewsClicks14d']),
    attributedNewToBrandUnitsSold14d: toNum(row['attributedNewToBrandUnitsSold14d']),
  }))
}
