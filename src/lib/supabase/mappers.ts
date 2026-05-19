import type {
  DataType, OrderRow, InventoryRow, ListingRow, TrafficRow,
  AttributionRow, SPCampaignRow, SBCampaignRow, SDCampaignRow,
} from '@/types/data'

// ─── Orders ────────────────────────────────────────────────────────────────

function orderToDb(r: OrderRow) {
  return {
    amazon_order_id: r.amazonOrderId,
    merchant_order_id: r.merchantOrderId,
    purchase_date: r.purchaseDate,
    last_updated_date: r.lastUpdatedDate,
    order_status: r.orderStatus,
    fulfillment_channel: r.fulfillmentChannel,
    sales_channel: r.salesChannel,
    sku: r.sku ?? '',
    asin: r.asin,
    quantity: r.quantity,
    currency: r.currency,
    item_price: r.itemPrice,
    item_tax: r.itemTax,
    ship_country: r.shipCountry,
    ship_city: r.shipCity,
    ship_state: r.shipState,
    ship_postal_code: r.shipPostalCode,
    is_business_order: r.isBusinessOrder,
  }
}

function orderFromDb(r: Record<string, unknown>): OrderRow {
  return {
    amazonOrderId: String(r.amazon_order_id ?? ''),
    merchantOrderId: String(r.merchant_order_id ?? ''),
    purchaseDate: String(r.purchase_date ?? ''),
    lastUpdatedDate: String(r.last_updated_date ?? ''),
    orderStatus: String(r.order_status ?? ''),
    fulfillmentChannel: String(r.fulfillment_channel ?? ''),
    salesChannel: String(r.sales_channel ?? ''),
    sku: String(r.sku ?? ''),
    asin: String(r.asin ?? ''),
    quantity: Number(r.quantity ?? 0),
    currency: String(r.currency ?? ''),
    itemPrice: Number(r.item_price ?? 0),
    itemTax: Number(r.item_tax ?? 0),
    shipCountry: String(r.ship_country ?? ''),
    shipCity: String(r.ship_city ?? ''),
    shipState: String(r.ship_state ?? ''),
    shipPostalCode: String(r.ship_postal_code ?? ''),
    isBusinessOrder: r.is_business_order === true || r.is_business_order === 'true' || r.is_business_order === 1,
  }
}

// ─── Inventory ─────────────────────────────────────────────────────────────

function inventoryToDb(r: InventoryRow) {
  return {
    sku: r.sku,
    fnsku: r.fnsku,
    asin: r.asin,
    product_name: r.productName,
    condition: r.condition,
    your_price: r.yourPrice,
    afn_fulfillable_quantity: r.afnFulfillableQuantity,
    afn_unsellable_quantity: r.afnUnsellableQuantity,
    afn_reserved_quantity: r.afnReservedQuantity,
    afn_total_quantity: r.afnTotalQuantity,
    afn_inbound_working_quantity: r.afnInboundWorkingQuantity,
    afn_inbound_shipped_quantity: r.afnInboundShippedQuantity,
    afn_inbound_receiving_quantity: r.afnInboundReceivingQuantity,
    afn_warehouse_quantity: r.afnWarehouseQuantity,
    afn_researching_quantity: r.afnResearchingQuantity,
    afn_reserved_future_supply: r.afnReservedFutureSupply,
    afn_future_supply_buyable: r.afnFutureSupplyBuyable,
    store: r.store,
    report_date: r.reportDate,
  }
}

function inventoryFromDb(r: Record<string, unknown>): InventoryRow {
  return {
    sku: String(r.sku ?? ''),
    fnsku: String(r.fnsku ?? ''),
    asin: String(r.asin ?? ''),
    productName: String(r.product_name ?? ''),
    condition: String(r.condition ?? ''),
    yourPrice: Number(r.your_price ?? 0),
    afnFulfillableQuantity: Number(r.afn_fulfillable_quantity ?? 0),
    afnUnsellableQuantity: Number(r.afn_unsellable_quantity ?? 0),
    afnReservedQuantity: Number(r.afn_reserved_quantity ?? 0),
    afnTotalQuantity: Number(r.afn_total_quantity ?? 0),
    afnInboundWorkingQuantity: Number(r.afn_inbound_working_quantity ?? 0),
    afnInboundShippedQuantity: Number(r.afn_inbound_shipped_quantity ?? 0),
    afnInboundReceivingQuantity: Number(r.afn_inbound_receiving_quantity ?? 0),
    afnWarehouseQuantity: Number(r.afn_warehouse_quantity ?? 0),
    afnResearchingQuantity: Number(r.afn_researching_quantity ?? 0),
    afnReservedFutureSupply: Number(r.afn_reserved_future_supply ?? 0),
    afnFutureSupplyBuyable: Number(r.afn_future_supply_buyable ?? 0),
    store: String(r.store ?? ''),
    reportDate: String(r.report_date ?? ''),
  }
}

// ─── Listing ───────────────────────────────────────────────────────────────

function listingToDb(r: ListingRow) {
  return {
    seller_sku: r.sellerSku,
    item_name: r.itemName,
    asin1: r.asin1,
    asin2: r.asin2,
    asin3: r.asin3,
    price: r.price,
    status: r.status,
    fulfillment_channel: r.fulfillmentChannel,
    open_date: r.openDate,
    quantity: r.quantity,
    pending_quantity: r.pendingQuantity,
  }
}

function listingFromDb(r: Record<string, unknown>): ListingRow {
  return {
    sellerSku: String(r.seller_sku ?? ''),
    itemName: String(r.item_name ?? ''),
    asin1: String(r.asin1 ?? ''),
    asin2: String(r.asin2 ?? ''),
    asin3: String(r.asin3 ?? ''),
    price: Number(r.price ?? 0),
    status: String(r.status ?? ''),
    fulfillmentChannel: String(r.fulfillment_channel ?? ''),
    openDate: String(r.open_date ?? ''),
    quantity: Number(r.quantity ?? 0),
    pendingQuantity: Number(r.pending_quantity ?? 0),
  }
}

// ─── Traffic ───────────────────────────────────────────────────────────────

function trafficToDb(r: TrafficRow) {
  return {
    child_asin: r.childAsin,
    parent_asin: r.parentAsin,
    title: r.title,
    sessions_total: r.sessionsTotal,
    sessions_total_b2b: r.sessionsTotalB2B,
    page_views_total: r.pageViewsTotal,
    page_views_total_b2b: r.pageViewsTotalB2B,
    buy_box_percentage: r.buyBoxPercentage,
    buy_box_percentage_b2b: r.buyBoxPercentageB2B,
    units_ordered: r.unitsOrdered,
    units_ordered_b2b: r.unitsOrderedB2B,
    unit_session_percentage: r.unitSessionPercentage,
    unit_session_percentage_b2b: r.unitSessionPercentageB2B,
    ordered_product_sales: r.orderedProductSales,
    ordered_product_sales_b2b: r.orderedProductSalesB2B,
    total_order_items: r.totalOrderItems,
    report_date: r.reportDate,
  }
}

function trafficFromDb(r: Record<string, unknown>): TrafficRow {
  return {
    childAsin: String(r.child_asin ?? ''),
    parentAsin: String(r.parent_asin ?? ''),
    title: String(r.title ?? ''),
    sessionsTotal: Number(r.sessions_total ?? 0),
    sessionsTotalB2B: Number(r.sessions_total_b2b ?? 0),
    pageViewsTotal: Number(r.page_views_total ?? 0),
    pageViewsTotalB2B: Number(r.page_views_total_b2b ?? 0),
    buyBoxPercentage: Number(r.buy_box_percentage ?? 0),
    buyBoxPercentageB2B: Number(r.buy_box_percentage_b2b ?? 0),
    unitsOrdered: Number(r.units_ordered ?? 0),
    unitsOrderedB2B: Number(r.units_ordered_b2b ?? 0),
    unitSessionPercentage: Number(r.unit_session_percentage ?? 0),
    unitSessionPercentageB2B: Number(r.unit_session_percentage_b2b ?? 0),
    orderedProductSales: Number(r.ordered_product_sales ?? 0),
    orderedProductSalesB2B: Number(r.ordered_product_sales_b2b ?? 0),
    totalOrderItems: Number(r.total_order_items ?? 0),
    reportDate: String(r.report_date ?? ''),
  }
}

// ─── Attribution ───────────────────────────────────────────────────────────

function attributionToDb(r: AttributionRow) {
  return {
    date: r.date,
    campaign_id: r.campaignId,
    ad_group_id: r.adGroupId,
    product_asin: r.productAsin,
    publisher: r.publisher,
    product_name: r.productName,
    product_conversion_type: r.productConversionType,
    attributed_sales_14d: r.attributedSales14d,
    attributed_purchases_14d: r.attributedPurchases14d,
    attributed_new_to_brand_sales_14d: r.attributedNewToBrandSales14d,
    attributed_new_to_brand_purchases_14d: r.attributedNewToBrandPurchases14d,
    brand_halo_attributed_sales_14d: r.brandHaloAttributedSales14d,
    brand_halo_attributed_purchases_14d: r.brandHaloAttributedPurchases14d,
    brand_halo_new_to_brand_sales_14d: r.brandHaloNewToBrandSales14d,
    units_sold_14d: r.unitsSold14d,
    attributed_detail_page_views_clicks_14d: r.attributedDetailPageViewsClicks14d,
    attributed_add_to_cart_clicks_14d: r.attributedAddToCartClicks14d,
    advertiser_name: r.advertiserName,
    product_category: r.productCategory,
    product_subcat: r.productSubcategory,
    brand_name: r.brandName,
    marketplace: r.marketplace,
    brand_halo_units_sold_14d: r.brandHaloUnitsSold14d,
    brand_halo_new_to_brand_purchases_14d: r.brandHaloNewToBrandPurchases14d,
    brand_halo_new_to_brand_units_sold_14d: r.brandHaloNewToBrandUnitsSold14d,
    brand_halo_attributed_add_to_cart_clicks_14d: r.brandHaloAttributedAddToCartClicks14d,
    brand_halo_detail_page_views_clicks_14d: r.brandHaloDetailPageViewsClicks14d,
    attributed_new_to_brand_units_sold_14d: r.attributedNewToBrandUnitsSold14d,
  }
}

function attributionFromDb(r: Record<string, unknown>): AttributionRow {
  return {
    date: String(r.date ?? ''),
    campaignId: String(r.campaign_id ?? ''),
    adGroupId: String(r.ad_group_id ?? ''),
    productAsin: String(r.product_asin ?? ''),
    publisher: String(r.publisher ?? ''),
    productName: String(r.product_name ?? ''),
    productConversionType: String(r.product_conversion_type ?? ''),
    attributedSales14d: Number(r.attributed_sales_14d ?? 0),
    attributedPurchases14d: Number(r.attributed_purchases_14d ?? 0),
    attributedNewToBrandSales14d: Number(r.attributed_new_to_brand_sales_14d ?? 0),
    attributedNewToBrandPurchases14d: Number(r.attributed_new_to_brand_purchases_14d ?? 0),
    brandHaloAttributedSales14d: Number(r.brand_halo_attributed_sales_14d ?? 0),
    brandHaloAttributedPurchases14d: Number(r.brand_halo_attributed_purchases_14d ?? 0),
    brandHaloNewToBrandSales14d: Number(r.brand_halo_new_to_brand_sales_14d ?? 0),
    unitsSold14d: Number(r.units_sold_14d ?? 0),
    attributedDetailPageViewsClicks14d: Number(r.attributed_detail_page_views_clicks_14d ?? 0),
    attributedAddToCartClicks14d: Number(r.attributed_add_to_cart_clicks_14d ?? 0),
    advertiserName: String(r.advertiser_name ?? ''),
    productCategory: String(r.product_category ?? ''),
    productSubcategory: String(r.product_subcat ?? ''),
    brandName: String(r.brand_name ?? ''),
    marketplace: String(r.marketplace ?? ''),
    brandHaloUnitsSold14d: Number(r.brand_halo_units_sold_14d ?? 0),
    brandHaloNewToBrandPurchases14d: Number(r.brand_halo_new_to_brand_purchases_14d ?? 0),
    brandHaloNewToBrandUnitsSold14d: Number(r.brand_halo_new_to_brand_units_sold_14d ?? 0),
    brandHaloAttributedAddToCartClicks14d: Number(r.brand_halo_attributed_add_to_cart_clicks_14d ?? 0),
    brandHaloDetailPageViewsClicks14d: Number(r.brand_halo_detail_page_views_clicks_14d ?? 0),
    attributedNewToBrandUnitsSold14d: Number(r.attributed_new_to_brand_units_sold_14d ?? 0),
  }
}

// ─── SP Campaigns ──────────────────────────────────────────────────────────

function spToDb(r: SPCampaignRow) {
  return {
    date: r.date,
    campaign_id: r.campaignId,
    campaign_name: r.campaignName,
    impressions: r.impressions,
    clicks: r.clicks,
    spend: r.spend,
    cost: r.cost,
    sales_14d: r.sales14d,
    purchases_14d: r.purchases14d,
    sales_7d: r.sales7d,
    sales_1d: r.sales1d,
    sales_30d: r.sales30d,
    campaign_budget_amount: r.campaignBudgetAmount,
    campaign_budget_type: r.campaignBudgetType,
    campaign_budget_currency_code: r.campaignBudgetCurrencyCode,
    campaign_status: r.campaignStatus,
    cost_per_click: r.costPerClick,
    click_through_rate: r.clickThroughRate,
    units_sold_clicks_14d: r.unitsSoldClicks14d,
    top_of_search_impression_share: r.topOfSearchImpressionShare,
    campaign_bidding_strategy: r.campaignBiddingStrategy,
    campaign_rule_based_budget_amount: r.campaignRuleBasedBudgetAmount,
  }
}

function spFromDb(r: Record<string, unknown>): SPCampaignRow {
  return {
    date: String(r.date ?? ''),
    campaignId: String(r.campaign_id ?? ''),
    campaignName: String(r.campaign_name ?? ''),
    impressions: Number(r.impressions ?? 0),
    clicks: Number(r.clicks ?? 0),
    spend: Number(r.spend ?? 0),
    cost: Number(r.cost ?? 0),
    sales14d: Number(r.sales_14d ?? 0),
    purchases14d: Number(r.purchases_14d ?? 0),
    sales7d: Number(r.sales_7d ?? 0),
    sales1d: Number(r.sales_1d ?? 0),
    sales30d: Number(r.sales_30d ?? 0),
    campaignBudgetAmount: Number(r.campaign_budget_amount ?? 0),
    campaignBudgetType: String(r.campaign_budget_type ?? ''),
    campaignBudgetCurrencyCode: String(r.campaign_budget_currency_code ?? ''),
    campaignStatus: String(r.campaign_status ?? ''),
    costPerClick: Number(r.cost_per_click ?? 0),
    clickThroughRate: Number(r.click_through_rate ?? 0),
    unitsSoldClicks14d: Number(r.units_sold_clicks_14d ?? 0),
    topOfSearchImpressionShare: Number(r.top_of_search_impression_share ?? 0),
    campaignBiddingStrategy: String(r.campaign_bidding_strategy ?? ''),
    campaignRuleBasedBudgetAmount: Number(r.campaign_rule_based_budget_amount ?? 0),
  }
}

// ─── SB Campaigns ──────────────────────────────────────────────────────────

function sbToDb(r: SBCampaignRow) {
  return {
    date: r.date,
    campaign_id: r.campaignId,
    campaign_name: r.campaignName,
    impressions: r.impressions,
    clicks: r.clicks,
    cost: r.cost,
    sales_clicks: r.salesClicks,
    purchases_clicks: r.purchasesClicks,
    new_to_brand_sales: r.newToBrandSales,
    new_to_brand_purchases: r.newToBrandPurchases,
    new_to_brand_purchases_percentage: r.newToBrandPurchasesPercentage,
    detail_page_views: r.detailPageViews,
    branded_searches: r.brandedSearches,
    campaign_budget_amount: r.campaignBudgetAmount,
    campaign_budget_type: r.campaignBudgetType,
    campaign_budget_currency_code: r.campaignBudgetCurrencyCode,
    campaign_status: r.campaignStatus,
    view_click_through_rate: r.viewClickThroughRate,
    units_sold_clicks: r.unitsSoldClicks,
    top_of_search_impression_share: r.topOfSearchImpressionShare,
    viewable_impressions: r.viewableImpressions,
  }
}

function sbFromDb(r: Record<string, unknown>): SBCampaignRow {
  return {
    date: String(r.date ?? ''),
    campaignId: String(r.campaign_id ?? ''),
    campaignName: String(r.campaign_name ?? ''),
    impressions: Number(r.impressions ?? 0),
    clicks: Number(r.clicks ?? 0),
    cost: Number(r.cost ?? 0),
    salesClicks: Number(r.sales_clicks ?? 0),
    purchasesClicks: Number(r.purchases_clicks ?? 0),
    newToBrandSales: Number(r.new_to_brand_sales ?? 0),
    newToBrandPurchases: Number(r.new_to_brand_purchases ?? 0),
    newToBrandPurchasesPercentage: Number(r.new_to_brand_purchases_percentage ?? 0),
    detailPageViews: Number(r.detail_page_views ?? 0),
    brandedSearches: Number(r.branded_searches ?? 0),
    campaignBudgetAmount: Number(r.campaign_budget_amount ?? 0),
    campaignBudgetType: String(r.campaign_budget_type ?? ''),
    campaignBudgetCurrencyCode: String(r.campaign_budget_currency_code ?? ''),
    campaignStatus: String(r.campaign_status ?? ''),
    viewClickThroughRate: Number(r.view_click_through_rate ?? 0),
    unitsSoldClicks: Number(r.units_sold_clicks ?? 0),
    topOfSearchImpressionShare: Number(r.top_of_search_impression_share ?? 0),
    viewableImpressions: Number(r.viewable_impressions ?? 0),
  }
}

// ─── SD Campaigns ──────────────────────────────────────────────────────────

function sdToDb(r: SDCampaignRow) {
  return {
    date: r.date,
    campaign_id: r.campaignId,
    campaign_name: r.campaignName,
    impressions: r.impressions,
    clicks: r.clicks,
    cost: r.cost,
    sales_clicks: r.salesClicks,
    purchases_clicks: r.purchasesClicks,
    new_to_brand_sales: r.newToBrandSales,
    cumulative_reach: r.cumulativeReach,
    impressions_views: r.impressionsViews,
    campaign_budget_amount: r.campaignBudgetAmount,
    campaign_budget_type: r.campaignBudgetType,
    campaign_budget_currency_code: r.campaignBudgetCurrencyCode,
    campaign_status: r.campaignStatus,
    view_click_through_rate: r.viewClickThroughRate,
    units_sold_clicks: r.unitsSoldClicks,
    detail_page_views: r.detailPageViews,
  }
}

function sdFromDb(r: Record<string, unknown>): SDCampaignRow {
  return {
    date: String(r.date ?? ''),
    campaignId: String(r.campaign_id ?? ''),
    campaignName: String(r.campaign_name ?? ''),
    impressions: Number(r.impressions ?? 0),
    clicks: Number(r.clicks ?? 0),
    cost: Number(r.cost ?? 0),
    salesClicks: Number(r.sales_clicks ?? 0),
    purchasesClicks: Number(r.purchases_clicks ?? 0),
    newToBrandSales: Number(r.new_to_brand_sales ?? 0),
    cumulativeReach: Number(r.cumulative_reach ?? 0),
    impressionsViews: Number(r.impressions_views ?? 0),
    campaignBudgetAmount: Number(r.campaign_budget_amount ?? 0),
    campaignBudgetType: String(r.campaign_budget_type ?? ''),
    campaignBudgetCurrencyCode: String(r.campaign_budget_currency_code ?? ''),
    campaignStatus: String(r.campaign_status ?? ''),
    viewClickThroughRate: Number(r.view_click_through_rate ?? 0),
    unitsSoldClicks: Number(r.units_sold_clicks ?? 0),
    detailPageViews: Number(r.detail_page_views ?? 0),
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TO_DB: Record<DataType, (r: any) => Record<string, unknown>> = {
  orders: orderToDb,
  inventory: inventoryToDb,
  listing: listingToDb,
  traffic: trafficToDb,
  attribution: attributionToDb,
  sp_campaigns: spToDb,
  sb_campaigns: sbToDb,
  sd_campaigns: sdToDb,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FROM_DB: Record<DataType, (r: Record<string, unknown>) => any> = {
  orders: orderFromDb,
  inventory: inventoryFromDb,
  listing: listingFromDb,
  traffic: trafficFromDb,
  attribution: attributionFromDb,
  sp_campaigns: spFromDb,
  sb_campaigns: sbFromDb,
  sd_campaigns: sdFromDb,
}

export function toDbRows(type: DataType, rows: unknown[]): Record<string, unknown>[] {
  const mapper = TO_DB[type]
  return rows.map(r => mapper(r))
}

export function fromDbRows<T>(type: DataType, rows: Record<string, unknown>[]): T[] {
  const mapper = FROM_DB[type]
  return rows.map(r => mapper(r))
}
