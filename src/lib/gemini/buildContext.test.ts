import { describe, it, expect } from 'vitest'
import { buildDataContext, type DashboardData } from './buildContext'
import type {
  OrderRow, InventoryRow, TrafficRow, AttributionRow,
  SPCampaignRow, SBCampaignRow, SDCampaignRow, ListingRow,
} from '@/types/data'

function order(p: Partial<OrderRow>): OrderRow {
  return {
    amazonOrderId: 'o1', merchantOrderId: '', purchaseDate: '2026-03-01T10:00:00+00:00',
    lastUpdatedDate: '', orderStatus: 'Shipped', fulfillmentChannel: '', salesChannel: '',
    sku: 'SKU1', asin: 'A1', quantity: 1, currency: 'EUR', itemPrice: 10, itemTax: 0,
    shipCountry: '', shipCity: '', shipState: '', shipPostalCode: '', isBusinessOrder: false,
    ...p,
  }
}

function sp(p: Partial<SPCampaignRow>): SPCampaignRow {
  return {
    date: '2026-03-01', campaignId: 'c1', campaignName: 'Camp A', impressions: 100, clicks: 10,
    spend: 5, cost: 5, sales14d: 20, purchases14d: 1, sales7d: 0, sales1d: 0, sales30d: 0,
    campaignBudgetAmount: 10, campaignBudgetType: '', campaignBudgetCurrencyCode: 'EUR',
    campaignStatus: 'ENABLED', costPerClick: 0.5, clickThroughRate: 10,
    unitsSoldClicks14d: 1, topOfSearchImpressionShare: 0, campaignBiddingStrategy: '',
    campaignRuleBasedBudgetAmount: 0,
    ...p,
  }
}

const empty: DashboardData = {
  orders: [], inventory: [], listing: [], traffic: [], attribution: [],
  spCampaigns: [], sbCampaigns: [], sdCampaigns: [],
}

describe('buildDataContext', () => {
  it('computes grand totals exactly', () => {
    const data: DashboardData = {
      ...empty,
      orders: [order({ itemPrice: 10 }), order({ amazonOrderId: 'o2', itemPrice: 20.5 })],
      spCampaigns: [sp({ spend: 5, sales14d: 20 }), sp({ date: '2026-03-02', spend: 2.5, sales14d: 0 })],
    }
    const ctx = buildDataContext(data)
    expect(ctx).toContain('총 매출(주문): €30.5')
    expect(ctx).toContain('총 광고비: €7.5')
    // Blended ROAS = 30.5 / 7.5 = 4.0666... → 4.07
    expect(ctx).toContain('Blended ROAS: 4.07')
  })

  it('aggregates campaigns across dates and computes ROAS/ACoS', () => {
    const data: DashboardData = {
      ...empty,
      spCampaigns: [
        sp({ date: '2026-03-01', campaignName: 'Camp A', spend: 5, sales14d: 20, clicks: 10, impressions: 100 }),
        sp({ date: '2026-03-02', campaignName: 'Camp A', spend: 5, sales14d: 10, clicks: 5, impressions: 100 }),
      ],
    }
    const ctx = buildDataContext(data)
    // spend 10, sales 30 → ROAS 3, ACoS 33.33%, clicks 15, impr 200, CTR 7.5%
    expect(ctx).toContain('Camp A | 10 | 30 | 3 | 33.33% | 15 | 200 | 7.5%')
  })

  it('excludes cancelled orders from ASIN sales but not from total revenue', () => {
    const data: DashboardData = {
      ...empty,
      orders: [
        order({ asin: 'A1', itemPrice: 10, quantity: 2 }),
        order({ amazonOrderId: 'o2', asin: 'A1', itemPrice: 99, quantity: 5, orderStatus: 'Cancelled' }),
      ],
    }
    const ctx = buildDataContext(data)
    expect(ctx).toContain('총 매출(주문): €109') // dashboard KPI includes all rows
    expect(ctx).toContain('A1 |  | 10 | 2 | 1') // cancelled excluded: revenue 10, units 2, 1 order
  })

  it('flags critical inventory below 14 days of stock', () => {
    const data: DashboardData = {
      ...empty,
      orders: [
        order({ asin: 'A1', quantity: 10, purchaseDate: '2026-03-01T00:00:00+00:00' }),
        order({ amazonOrderId: 'o2', asin: 'A1', quantity: 10, purchaseDate: '2026-03-10T00:00:00+00:00' }),
      ],
      inventory: [{
        sku: 'SKU1', fnsku: '', asin: 'A1', productName: 'Case', condition: 'New', yourPrice: 9.99,
        afnFulfillableQuantity: 10, afnUnsellableQuantity: 0, afnReservedQuantity: 0, afnTotalQuantity: 10,
        afnInboundWorkingQuantity: 0, afnInboundShippedQuantity: 0, afnInboundReceivingQuantity: 0,
        afnWarehouseQuantity: 0, afnResearchingQuantity: 0, afnReservedFutureSupply: 0,
        afnFutureSupplyBuyable: 0, store: '', reportDate: '2026-03-10',
      } as InventoryRow],
    }
    // range 10 days, 20 units sold → 2/day → 10 stock / 2 = 5 days → critical
    const ctx = buildDataContext(data)
    expect(ctx).toContain('위험 1 / 주의 0 / 정상 0')
    expect(ctx).toContain('SKU1 | A1 | Case | 10 | 5일')
  })

  it('aggregates attribution per publisher', () => {
    const attr = (p: Partial<AttributionRow>): AttributionRow => ({
      date: '2026-03-01', campaignId: 'g1', adGroupId: 'ag', productAsin: 'A1', publisher: 'Google Ads',
      productName: '', productConversionType: '', attributedSales14d: 100, attributedPurchases14d: 2,
      attributedNewToBrandSales14d: 40, attributedNewToBrandPurchases14d: 1,
      brandHaloAttributedSales14d: 10, brandHaloAttributedPurchases14d: 0, brandHaloNewToBrandSales14d: 0,
      unitsSold14d: 0, attributedDetailPageViewsClicks14d: 0, attributedAddToCartClicks14d: 0,
      advertiserName: '', productCategory: '', productSubcategory: '', brandName: '', marketplace: '',
      brandHaloUnitsSold14d: 0, brandHaloNewToBrandPurchases14d: 0, brandHaloNewToBrandUnitsSold14d: 0,
      brandHaloAttributedAddToCartClicks14d: 0, brandHaloDetailPageViewsClicks14d: 0,
      attributedNewToBrandUnitsSold14d: 0,
      ...p,
    })
    const data: DashboardData = {
      ...empty,
      attribution: [attr({}), attr({ campaignId: 'g2', attributedSales14d: 50 })],
    }
    const ctx = buildDataContext(data)
    expect(ctx).toContain('Google Ads | 2 | 150 | 4 | 80 | 20')
  })
})

// keep TS happy about unused type imports used only in casts
void (0 as unknown as TrafficRow | SBCampaignRow | SDCampaignRow | ListingRow)
