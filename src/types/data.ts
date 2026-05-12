export type ISODateString = string

export type DataType =
  | 'sp_campaigns' | 'sb_campaigns' | 'sd_campaigns'
  | 'orders' | 'listing' | 'inventory' | 'traffic' | 'attribution'

export interface SPCampaignRow {
  date: ISODateString; campaignId: string; campaignName: string
  impressions: number; clicks: number; spend: number; cost: number
  sales14d: number; purchases14d: number; sales7d: number; sales1d: number; sales30d: number
  campaignBudgetAmount: number; campaignBudgetType: string
  campaignBudgetCurrencyCode: string; campaignStatus: string
  costPerClick: number; clickThroughRate: number
  unitsSoldClicks14d: number; topOfSearchImpressionShare: number
  campaignBiddingStrategy: string; campaignRuleBasedBudgetAmount: number
  [key: string]: unknown
}

export interface SBCampaignRow {
  date: ISODateString; campaignId: string; campaignName: string
  impressions: number; clicks: number; cost: number
  salesClicks: number; purchasesClicks: number
  newToBrandSales: number; newToBrandPurchases: number; newToBrandPurchasesPercentage: number
  detailPageViews: number; brandedSearches: number
  campaignBudgetAmount: number; campaignBudgetType: string
  campaignBudgetCurrencyCode: string; campaignStatus: string
  viewClickThroughRate: number; unitsSoldClicks: number
  topOfSearchImpressionShare: number; viewableImpressions: number
  [key: string]: unknown
}

export interface SDCampaignRow {
  date: ISODateString; campaignId: string; campaignName: string
  impressions: number; clicks: number; cost: number
  salesClicks: number; purchasesClicks: number
  newToBrandSales: number; cumulativeReach: number; impressionsViews: number
  campaignBudgetAmount: number; campaignBudgetType: string
  campaignBudgetCurrencyCode: string; campaignStatus: string
  viewClickThroughRate: number; unitsSoldClicks: number; detailPageViews: number
  [key: string]: unknown
}

export interface OrderRow {
  amazonOrderId: string; merchantOrderId: string
  purchaseDate: ISODateString; lastUpdatedDate: string
  orderStatus: string; fulfillmentChannel: string; salesChannel: string
  sku: string; asin: string; quantity: number; currency: string
  itemPrice: number; itemTax: number
  shipCountry: string; shipCity: string; shipState: string; shipPostalCode: string
  isBusinessOrder: boolean
}

export interface ListingRow {
  itemName: string; sellerSku: string
  asin1: string; asin2: string; asin3: string
  price: number; status: string; fulfillmentChannel: string
  openDate: string; quantity: number; pendingQuantity: number
}

export interface InventoryRow {
  sku: string; fnsku: string; asin: string; productName: string; condition: string
  yourPrice: number
  afnFulfillableQuantity: number; afnUnsellableQuantity: number
  afnReservedQuantity: number; afnTotalQuantity: number
  afnInboundWorkingQuantity: number; afnInboundShippedQuantity: number
  afnInboundReceivingQuantity: number; reportDate: ISODateString
  afnWarehouseQuantity: number; afnResearchingQuantity: number
  afnReservedFutureSupply: number; afnFutureSupplyBuyable: number; store: string
}

export interface TrafficRow {
  parentAsin: string; childAsin: string; title: string
  sessionsTotal: number; sessionsTotalB2B: number
  pageViewsTotal: number; pageViewsTotalB2B: number
  buyBoxPercentage: number; buyBoxPercentageB2B: number
  unitsOrdered: number; unitsOrderedB2B: number
  unitSessionPercentage: number; unitSessionPercentageB2B: number
  orderedProductSales: number; orderedProductSalesB2B: number
  totalOrderItems: number; reportDate: ISODateString
}

export interface AttributionRow {
  date: ISODateString; campaignId: string; adGroupId: string
  productAsin: string; productName: string
  publisher: string; productConversionType: string
  attributedSales14d: number; attributedPurchases14d: number
  attributedNewToBrandSales14d: number; attributedNewToBrandPurchases14d: number
  brandHaloAttributedSales14d: number; brandHaloAttributedPurchases14d: number
  brandHaloNewToBrandSales14d: number; unitsSold14d: number
  attributedDetailPageViewsClicks14d: number; attributedAddToCartClicks14d: number
  advertiserName: string; productCategory: string; productSubcategory: string
  brandName: string; marketplace: string
  brandHaloUnitsSold14d: number; brandHaloNewToBrandPurchases14d: number
  brandHaloNewToBrandUnitsSold14d: number
  brandHaloAttributedAddToCartClicks14d: number; brandHaloDetailPageViewsClicks14d: number
  attributedNewToBrandUnitsSold14d: number
}

export interface StorageSchema {
  spCampaigns: SPCampaignRow[]; sbCampaigns: SBCampaignRow[]
  sdCampaigns: SDCampaignRow[]; orders: OrderRow[]
  listing: ListingRow[]; inventory: InventoryRow[]
  traffic: TrafficRow[]; attribution: AttributionRow[]
  uploadedAt: Partial<Record<DataType, string>>
  dateRange: { from: ISODateString; to: ISODateString } | null
}
