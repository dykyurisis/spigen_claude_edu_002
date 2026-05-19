# Supabase Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace IndexedDB with Supabase as single source of truth; Zustand stays as in-memory UI cache; all dashboard features connect automatically via store hydration.

**Architecture:** CSV upload → parse (client) → `upsertData()` Server Action → Supabase. On app mount, `providers.tsx` calls `fetchAllData()` → hydrates Zustand. Dashboard pages read from `useDashboardStore()` unchanged.

**Tech Stack:** Next.js 16 App Router, @supabase/ssr, @supabase/supabase-js, Zustand 5, TypeScript

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/supabase/mappers.ts` | camelCase ↔ snake_case row conversion for all 8 types |
| Create | `src/lib/supabase/actions.ts` | Server Actions: `upsertData()`, `fetchAllData()` |
| Modify | `src/components/upload/FileDropzone.tsx` | Call `upsertData()` after successful parse |
| Modify | `src/lib/store/dashboardStore.ts` | Remove IndexedDB persist; plain Zustand in-memory store |
| Modify | `src/app/providers.tsx` | Fetch from Supabase on mount → hydrate Zustand |

---

## Task 1: Apply Database Migrations (8 tables)

**Files:**
- Tool: Supabase MCP `apply_migration`

- [ ] **Step 1: Apply all 8 table migrations in one call**

Call `apply_migration` with `name: "create_dashboard_tables"` and the following SQL:

```sql
-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  amazon_order_id      text NOT NULL,
  merchant_order_id    text,
  purchase_date        text NOT NULL,
  last_updated_date    text,
  order_status         text,
  fulfillment_channel  text,
  sales_channel        text,
  sku                  text NOT NULL DEFAULT '',
  asin                 text,
  quantity             integer DEFAULT 0,
  currency             text,
  item_price           numeric DEFAULT 0,
  item_tax             numeric DEFAULT 0,
  ship_country         text,
  ship_city            text,
  ship_state           text,
  ship_postal_code     text,
  is_business_order    boolean DEFAULT false,
  PRIMARY KEY (amazon_order_id, sku)
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_orders" ON orders FOR ALL USING (true) WITH CHECK (true);

-- INVENTORY
CREATE TABLE IF NOT EXISTS inventory (
  sku                           text NOT NULL,
  fnsku                         text,
  asin                          text,
  product_name                  text,
  condition                     text,
  your_price                    numeric DEFAULT 0,
  afn_fulfillable_quantity      integer DEFAULT 0,
  afn_unsellable_quantity       integer DEFAULT 0,
  afn_reserved_quantity         integer DEFAULT 0,
  afn_total_quantity            integer DEFAULT 0,
  afn_inbound_working_quantity  integer DEFAULT 0,
  afn_inbound_shipped_quantity  integer DEFAULT 0,
  afn_inbound_receiving_quantity integer DEFAULT 0,
  afn_warehouse_quantity        integer DEFAULT 0,
  afn_researching_quantity      integer DEFAULT 0,
  afn_reserved_future_supply    integer DEFAULT 0,
  afn_future_supply_buyable     integer DEFAULT 0,
  store                         text,
  report_date                   text NOT NULL,
  PRIMARY KEY (sku, report_date)
);
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);

-- LISTING
CREATE TABLE IF NOT EXISTS listing (
  seller_sku          text PRIMARY KEY,
  item_name           text,
  asin1               text,
  asin2               text,
  asin3               text,
  price               numeric DEFAULT 0,
  status              text,
  fulfillment_channel text,
  open_date           text,
  quantity            integer DEFAULT 0,
  pending_quantity    integer DEFAULT 0
);
ALTER TABLE listing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_listing" ON listing FOR ALL USING (true) WITH CHECK (true);

-- TRAFFIC
CREATE TABLE IF NOT EXISTS traffic (
  child_asin                    text NOT NULL,
  parent_asin                   text,
  title                         text,
  sessions_total                integer DEFAULT 0,
  sessions_total_b2b            integer DEFAULT 0,
  page_views_total              integer DEFAULT 0,
  page_views_total_b2b          integer DEFAULT 0,
  buy_box_percentage            numeric DEFAULT 0,
  buy_box_percentage_b2b        numeric DEFAULT 0,
  units_ordered                 integer DEFAULT 0,
  units_ordered_b2b             integer DEFAULT 0,
  unit_session_percentage       numeric DEFAULT 0,
  unit_session_percentage_b2b   numeric DEFAULT 0,
  ordered_product_sales         numeric DEFAULT 0,
  ordered_product_sales_b2b     numeric DEFAULT 0,
  total_order_items             integer DEFAULT 0,
  report_date                   text NOT NULL,
  PRIMARY KEY (child_asin, report_date)
);
ALTER TABLE traffic ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_traffic" ON traffic FOR ALL USING (true) WITH CHECK (true);

-- ATTRIBUTION
CREATE TABLE IF NOT EXISTS attribution (
  date                                        text NOT NULL,
  campaign_id                                 text NOT NULL,
  ad_group_id                                 text NOT NULL,
  product_asin                                text NOT NULL,
  publisher                                   text NOT NULL,
  product_name                                text,
  product_conversion_type                     text,
  attributed_sales_14d                        numeric DEFAULT 0,
  attributed_purchases_14d                    integer DEFAULT 0,
  attributed_new_to_brand_sales_14d           numeric DEFAULT 0,
  attributed_new_to_brand_purchases_14d       integer DEFAULT 0,
  brand_halo_attributed_sales_14d             numeric DEFAULT 0,
  brand_halo_attributed_purchases_14d         integer DEFAULT 0,
  brand_halo_new_to_brand_sales_14d           numeric DEFAULT 0,
  units_sold_14d                              integer DEFAULT 0,
  attributed_detail_page_views_clicks_14d     integer DEFAULT 0,
  attributed_add_to_cart_clicks_14d           integer DEFAULT 0,
  advertiser_name                             text,
  product_category                            text,
  product_subcat                              text,
  brand_name                                  text,
  marketplace                                 text,
  brand_halo_units_sold_14d                   integer DEFAULT 0,
  brand_halo_new_to_brand_purchases_14d       integer DEFAULT 0,
  brand_halo_new_to_brand_units_sold_14d      integer DEFAULT 0,
  brand_halo_attributed_add_to_cart_clicks_14d integer DEFAULT 0,
  brand_halo_detail_page_views_clicks_14d     integer DEFAULT 0,
  attributed_new_to_brand_units_sold_14d      integer DEFAULT 0,
  PRIMARY KEY (date, campaign_id, ad_group_id, product_asin, publisher)
);
ALTER TABLE attribution ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_attribution" ON attribution FOR ALL USING (true) WITH CHECK (true);

-- SP CAMPAIGNS
CREATE TABLE IF NOT EXISTS sp_campaigns (
  date                              text NOT NULL,
  campaign_id                       text NOT NULL,
  campaign_name                     text,
  impressions                       integer DEFAULT 0,
  clicks                            integer DEFAULT 0,
  spend                             numeric DEFAULT 0,
  cost                              numeric DEFAULT 0,
  sales_14d                         numeric DEFAULT 0,
  purchases_14d                     integer DEFAULT 0,
  sales_7d                          numeric DEFAULT 0,
  sales_1d                          numeric DEFAULT 0,
  sales_30d                         numeric DEFAULT 0,
  campaign_budget_amount            numeric DEFAULT 0,
  campaign_budget_type              text,
  campaign_budget_currency_code     text,
  campaign_status                   text,
  cost_per_click                    numeric DEFAULT 0,
  click_through_rate                numeric DEFAULT 0,
  units_sold_clicks_14d             integer DEFAULT 0,
  top_of_search_impression_share    numeric DEFAULT 0,
  campaign_bidding_strategy         text,
  campaign_rule_based_budget_amount numeric DEFAULT 0,
  PRIMARY KEY (date, campaign_id)
);
ALTER TABLE sp_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_sp" ON sp_campaigns FOR ALL USING (true) WITH CHECK (true);

-- SB CAMPAIGNS
CREATE TABLE IF NOT EXISTS sb_campaigns (
  date                              text NOT NULL,
  campaign_id                       text NOT NULL,
  campaign_name                     text,
  impressions                       integer DEFAULT 0,
  clicks                            integer DEFAULT 0,
  cost                              numeric DEFAULT 0,
  sales_clicks                      numeric DEFAULT 0,
  purchases_clicks                  integer DEFAULT 0,
  new_to_brand_sales                numeric DEFAULT 0,
  new_to_brand_purchases            integer DEFAULT 0,
  new_to_brand_purchases_percentage numeric DEFAULT 0,
  detail_page_views                 integer DEFAULT 0,
  branded_searches                  integer DEFAULT 0,
  campaign_budget_amount            numeric DEFAULT 0,
  campaign_budget_type              text,
  campaign_budget_currency_code     text,
  campaign_status                   text,
  view_click_through_rate           numeric DEFAULT 0,
  units_sold_clicks                 integer DEFAULT 0,
  top_of_search_impression_share    numeric DEFAULT 0,
  viewable_impressions              integer DEFAULT 0,
  PRIMARY KEY (date, campaign_id)
);
ALTER TABLE sb_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_sb" ON sb_campaigns FOR ALL USING (true) WITH CHECK (true);

-- SD CAMPAIGNS
CREATE TABLE IF NOT EXISTS sd_campaigns (
  date                           text NOT NULL,
  campaign_id                    text NOT NULL,
  campaign_name                  text,
  impressions                    integer DEFAULT 0,
  clicks                         integer DEFAULT 0,
  cost                           numeric DEFAULT 0,
  sales_clicks                   numeric DEFAULT 0,
  purchases_clicks               integer DEFAULT 0,
  new_to_brand_sales             numeric DEFAULT 0,
  cumulative_reach               integer DEFAULT 0,
  impressions_views              integer DEFAULT 0,
  campaign_budget_amount         numeric DEFAULT 0,
  campaign_budget_type           text,
  campaign_budget_currency_code  text,
  campaign_status                text,
  view_click_through_rate        numeric DEFAULT 0,
  units_sold_clicks              integer DEFAULT 0,
  detail_page_views              integer DEFAULT 0,
  PRIMARY KEY (date, campaign_id)
);
ALTER TABLE sd_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_sd" ON sd_campaigns FOR ALL USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Verify tables exist**

Call `list_tables` with `schemas: ["public"]`. Expected: 8 tables listed (orders, inventory, listing, traffic, attribution, sp_campaigns, sb_campaigns, sd_campaigns).

- [ ] **Step 3: Commit**

```bash
git add docs/
git commit -m "feat: add Supabase DB schema for 8 dashboard tables"
```

---

## Task 2: Create Row Mappers

**Files:**
- Create: `src/lib/supabase/mappers.ts`

- [ ] **Step 1: Create `src/lib/supabase/mappers.ts`**

```typescript
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
    isBusinessOrder: Boolean(r.is_business_order),
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
```

- [ ] **Step 2: Type-check**

```bash
cd C:\SPIGEN_CLAUDE_EDU\SPIGEN_CLAUDE_002
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/mappers.ts
git commit -m "feat: add camelCase/snake_case mappers for all 8 data types"
```

---

## Task 3: Create Server Actions

**Files:**
- Create: `src/lib/supabase/actions.ts`

- [ ] **Step 1: Create `src/lib/supabase/actions.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import type { DataType } from '@/types/data'
import { toDbRows, fromDbRows } from './mappers'

const TYPE_TO_TABLE: Record<DataType, string> = {
  sp_campaigns: 'sp_campaigns',
  sb_campaigns: 'sb_campaigns',
  sd_campaigns: 'sd_campaigns',
  orders: 'orders',
  listing: 'listing',
  inventory: 'inventory',
  traffic: 'traffic',
  attribution: 'attribution',
}

export async function upsertData(type: DataType, rows: unknown[]): Promise<void> {
  if (rows.length === 0) return
  const supabase = await createClient()
  const table = TYPE_TO_TABLE[type]
  const dbRows = toDbRows(type, rows)

  // Supabase upsert in batches of 500 to avoid request size limits
  const BATCH = 500
  for (let i = 0; i < dbRows.length; i += BATCH) {
    const batch = dbRows.slice(i, i + BATCH)
    const { error } = await supabase.from(table).upsert(batch)
    if (error) throw new Error(`[${table}] upsert failed: ${error.message}`)
  }
}

export async function fetchAllData() {
  const supabase = await createClient()

  const [sp, sb, sd, orders, listing, inventory, traffic, attribution] = await Promise.all([
    supabase.from('sp_campaigns').select('*'),
    supabase.from('sb_campaigns').select('*'),
    supabase.from('sd_campaigns').select('*'),
    supabase.from('orders').select('*'),
    supabase.from('listing').select('*'),
    supabase.from('inventory').select('*'),
    supabase.from('traffic').select('*'),
    supabase.from('attribution').select('*'),
  ])

  return {
    spCampaigns: fromDbRows('sp_campaigns', sp.data ?? []),
    sbCampaigns: fromDbRows('sb_campaigns', sb.data ?? []),
    sdCampaigns: fromDbRows('sd_campaigns', sd.data ?? []),
    orders: fromDbRows('orders', orders.data ?? []),
    listing: fromDbRows('listing', listing.data ?? []),
    inventory: fromDbRows('inventory', inventory.data ?? []),
    traffic: fromDbRows('traffic', traffic.data ?? []),
    attribution: fromDbRows('attribution', attribution.data ?? []),
  }
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/actions.ts
git commit -m "feat: add upsertData and fetchAllData server actions"
```

---

## Task 4: Modify FileDropzone — Save to Supabase on Upload

**Files:**
- Modify: `src/components/upload/FileDropzone.tsx`

Current `handleFile` function (lines 16–29) calls `parseCSV` then `setData`. We add a fire-and-forget `upsertData` call after `setData`.

- [ ] **Step 1: Update `src/components/upload/FileDropzone.tsx`**

Replace the entire file with:

```typescript
'use client'
import { useState, useRef } from 'react'
import { DataType } from '@/types/data'
import { parseCSV } from '@/lib/parsers'
import { useDashboardStore } from '@/lib/store/dashboardStore'
import { upsertData } from '@/lib/supabase/actions'

interface FileDropzoneProps { dataType: DataType; label: string }

export function FileDropzone({ dataType, label }: FileDropzoneProps) {
  const setData = useDashboardStore(s => s.setData)
  const uploadedAt = useDashboardStore(s => s.uploadedAt[dataType])
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setError(null)
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string
        const rows = parseCSV(dataType, text)
        if (rows.length > 50000) setError(`Warning: ${rows.length} rows loaded (>50,000)`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setData(dataType, rows as any)

        // Save to Supabase in background
        setSaving(true)
        await upsertData(dataType, rows)
        setSaving(false)
      } catch (err) {
        setSaving(false)
        setError(String(err))
      }
    }
    reader.readAsText(file)
  }

  return (
    <div
      onDragEnter={e => { e.preventDefault(); setDragging(true) }}
      onDragOver={e => e.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer rounded-lg border-2 border-dashed p-3 transition-colors ${
        dragging ? 'border-blue-500 bg-blue-900/20' : uploadedAt ? 'border-green-700 bg-green-900/10' : 'border-zinc-700 hover:border-zinc-500'
      }`}
    >
      <input ref={inputRef} type="file" accept=".csv,.xlsx" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-300">{label}</span>
        {saving
          ? <span className="text-xs text-blue-400">⏳ Saving...</span>
          : uploadedAt
            ? <span className="text-xs text-green-400">✓ {new Date(uploadedAt).toLocaleTimeString()}</span>
            : <span className="text-xs text-zinc-500">Drop CSV/XLSX</span>
        }
      </div>
      {error && <p className="text-xs text-amber-400 mt-1">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/upload/FileDropzone.tsx
git commit -m "feat: save uploaded CSV data to Supabase on upload"
```

---

## Task 5: Modify dashboardStore — Remove IndexedDB

**Files:**
- Modify: `src/lib/store/dashboardStore.ts`

Remove `persist` middleware and idb imports. Store becomes plain in-memory Zustand.

- [ ] **Step 1: Replace `src/lib/store/dashboardStore.ts`**

```typescript
import { create } from 'zustand'
import {
  StorageSchema, DataType,
  SPCampaignRow, SBCampaignRow, SDCampaignRow,
  OrderRow, ListingRow, InventoryRow, TrafficRow, AttributionRow,
} from '@/types/data'

type DataTypeRowMap = {
  sp_campaigns: SPCampaignRow[]; sb_campaigns: SBCampaignRow[]
  sd_campaigns: SDCampaignRow[]; orders: OrderRow[]; listing: ListingRow[]
  inventory: InventoryRow[]; traffic: TrafficRow[]; attribution: AttributionRow[]
}

interface DashboardState extends StorageSchema {
  setData: <K extends DataType>(type: K, rows: DataTypeRowMap[K]) => void
  setDateRange: (from: string, to: string) => void
  clearAll: () => void
  hydrateAll: (data: Omit<StorageSchema, 'uploadedAt' | 'dateRange'>) => void
}

const KEY_MAP: Record<DataType, keyof StorageSchema> = {
  sp_campaigns: 'spCampaigns', sb_campaigns: 'sbCampaigns',
  sd_campaigns: 'sdCampaigns', orders: 'orders', listing: 'listing',
  inventory: 'inventory', traffic: 'traffic', attribution: 'attribution',
}

const empty: StorageSchema = {
  spCampaigns: [], sbCampaigns: [], sdCampaigns: [],
  orders: [], listing: [], inventory: [], traffic: [], attribution: [],
  uploadedAt: {}, dateRange: null,
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  ...empty,
  setData: (type, rows) => {
    const key = KEY_MAP[type]
    set((s) => ({
      [key]: rows,
      uploadedAt: { ...s.uploadedAt, [type]: new Date().toISOString() },
    } as Partial<DashboardState>))
  },
  setDateRange: (from, to) => set({ dateRange: { from, to } }),
  clearAll: () => set(empty),
  hydrateAll: (data) => set({
    spCampaigns: data.spCampaigns,
    sbCampaigns: data.sbCampaigns,
    sdCampaigns: data.sdCampaigns,
    orders: data.orders,
    listing: data.listing,
    inventory: data.inventory,
    traffic: data.traffic,
    attribution: data.attribution,
  }),
}))
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/store/dashboardStore.ts
git commit -m "refactor: remove IndexedDB persist, add hydrateAll action"
```

---

## Task 6: Modify providers.tsx — Hydrate from Supabase on Mount

**Files:**
- Modify: `src/app/providers.tsx`

On mount, call `fetchAllData()` and populate the Zustand store via `hydrateAll`.

- [ ] **Step 1: Replace `src/app/providers.tsx`**

```typescript
'use client'
import { useEffect, useState } from 'react'
import { useDashboardStore } from '@/lib/store/dashboardStore'
import { fetchAllData } from '@/lib/supabase/actions'

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const hydrateAll = useDashboardStore(s => s.hydrateAll)

  useEffect(() => {
    setMounted(true)
    fetchAllData()
      .then(data => hydrateAll(data))
      .catch(err => console.error('Failed to load data from Supabase:', err))
  }, [hydrateAll])

  if (!mounted) return <>{children}</>
  return <>{children}</>
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start dev server and verify no runtime errors**

```bash
npm run dev
```

Open http://localhost:3000. Check browser console — should be no errors. If Supabase has no data yet, dashboard shows "No data loaded" (expected).

- [ ] **Step 4: Final commit**

```bash
git add src/app/providers.tsx
git commit -m "feat: hydrate Zustand from Supabase on app mount"
```

---

## Task 7: End-to-End Test

- [ ] **Step 1: Upload a sample CSV**

1. Open http://localhost:3000
2. Click "Upload Data"
3. Drop `data/zocoding_order_sample.csv` onto "Orders"
4. Verify "⏳ Saving..." appears, then "✓ [time]"

- [ ] **Step 2: Verify data in Supabase**

Using Supabase MCP: call `execute_sql` with:
```sql
SELECT COUNT(*) FROM orders;
```
Expected: count > 0.

- [ ] **Step 3: Verify dashboard loads data after refresh**

1. Hard refresh the page (Ctrl+Shift+R)
2. Navigate to Overview
3. Verify charts and KPIs show data (data loaded from Supabase, not IndexedDB)

- [ ] **Step 4: Upload all remaining CSVs and verify each**

Upload: sp_campaigns, sb_campaigns, sd_campaigns, inventory, listing, traffic, attribution.
After each upload verify the ✓ checkmark appears.

- [ ] **Step 5: Full refresh and verify all dashboard pages**

After all uploads, hard refresh and verify:
- Overview: KPI cards and charts show data
- Advertising: shows campaign data
- Products: shows listing/traffic data
- Inventory: shows inventory data
- Attribution: shows attribution data

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete Supabase integration - all CSV data persisted to DB"
```
