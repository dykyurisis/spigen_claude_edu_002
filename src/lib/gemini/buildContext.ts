import type {
  StorageSchema,
  SPCampaignRow, SBCampaignRow, SDCampaignRow,
} from '@/types/data'
import { calcROAS, calcACoS, calcCVR, calcBlendedROAS } from '@/lib/metrics/adMetrics'
import { calcDaysOfStock, getStockStatus, buildAsinSalesMap } from '@/lib/metrics/inventoryMetrics'

export type DashboardData = Omit<StorageSchema, 'uploadedAt' | 'dateRange'>

/** Round to 2 decimals for compact, readable tables. */
const r2 = (n: number) => Math.round(n * 100) / 100

interface CampaignAgg {
  name: string
  spend: number
  sales: number
  clicks: number
  impressions: number
}

function aggCampaigns(
  rows: Array<SPCampaignRow | SBCampaignRow | SDCampaignRow>,
  getSpend: (r: never) => number,
  getSales: (r: never) => number
): CampaignAgg[] {
  const map = new Map<string, CampaignAgg>()
  for (const row of rows) {
    const key = row.campaignName || row.campaignId
    const agg = map.get(key) ?? { name: key, spend: 0, sales: 0, clicks: 0, impressions: 0 }
    agg.spend += getSpend(row as never)
    agg.sales += getSales(row as never)
    agg.clicks += row.clicks
    agg.impressions += row.impressions
    map.set(key, agg)
  }
  return [...map.values()].sort((a, b) => b.sales - a.sales)
}

function campaignTable(channel: string, aggs: CampaignAgg[]): string {
  const lines = aggs.map(a => {
    const roas = r2(calcROAS(a.sales, a.spend))
    const acos = r2(calcACoS(a.spend, a.sales))
    const ctr = a.impressions === 0 ? 0 : r2((a.clicks / a.impressions) * 100)
    return `${a.name} | ${r2(a.spend)} | ${r2(a.sales)} | ${roas} | ${acos}% | ${a.clicks} | ${a.impressions} | ${ctr}%`
  })
  return [
    `### ${channel} 캠페인별 집계 (캠페인명 | 광고비EUR | 광고매출EUR | ROAS | ACoS | 클릭 | 노출 | CTR)`,
    ...lines,
  ].join('\n')
}

function monthlyTrend(
  label: string,
  rows: Array<{ date: string }>,
  getSpend: (r: never) => number,
  getSales: (r: never) => number
): string[] {
  const map = new Map<string, { spend: number; sales: number }>()
  for (const row of rows) {
    const month = row.date.slice(0, 7)
    const agg = map.get(month) ?? { spend: 0, sales: 0 }
    agg.spend += getSpend(row as never)
    agg.sales += getSales(row as never)
    map.set(month, agg)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, v]) => `${m} | ${label} | ${r2(v.spend)} | ${r2(v.sales)} | ${r2(calcROAS(v.sales, v.spend))}`)
}

/**
 * Build the Korean-labeled, pre-aggregated data context for Gemini.
 * All arithmetic happens HERE (exact, in TS) — the model only selects,
 * ranks and explains. Row-level detail is intentionally out of scope.
 */
export function buildDataContext(data: DashboardData): string {
  const { orders, inventory, traffic, attribution, spCampaigns, sbCampaigns, sdCampaigns, listing } = data

  // ── date range ─────────────────────────────────────────────────
  const orderDates = orders.map(o => o.purchaseDate.slice(0, 10)).filter(Boolean).sort()
  const campDates = [...spCampaigns, ...sbCampaigns, ...sdCampaigns].map(c => c.date).filter(Boolean).sort()
  const from = [orderDates[0], campDates[0]].filter(Boolean).sort()[0] ?? ''
  const to = [orderDates.at(-1), campDates.at(-1)].filter((d): d is string => Boolean(d)).sort().at(-1) ?? ''
  const rangeDays = from && to
    ? Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1)
    : 1

  // ── grand totals (match dashboard Overview KPIs) ───────────────
  const totalRevenue = orders.reduce((s, o) => s + o.itemPrice, 0)
  const spSpend = spCampaigns.reduce((s, c) => s + c.spend, 0)
  const sbSpend = sbCampaigns.reduce((s, c) => s + c.cost, 0)
  const sdSpend = sdCampaigns.reduce((s, c) => s + c.cost, 0)
  const totalAdSpend = spSpend + sbSpend + sdSpend
  const blendedRoas = calcBlendedROAS(totalRevenue, spCampaigns, sbCampaigns, sdCampaigns)

  const totals = [
    '## 전체 요약',
    `데이터 기간: ${from} ~ ${to} (${rangeDays}일)`,
    `총 매출(주문): €${r2(totalRevenue)} / 총 주문 행: ${orders.length}`,
    `총 광고비: €${r2(totalAdSpend)} (SP €${r2(spSpend)}, SB €${r2(sbSpend)}, SD €${r2(sdSpend)})`,
    `Blended ROAS: ${r2(blendedRoas)}`,
  ].join('\n')

  // ── per-channel campaign tables ────────────────────────────────
  const spAgg = aggCampaigns(spCampaigns, (r: SPCampaignRow) => r.spend, (r: SPCampaignRow) => r.sales14d)
  const sbAgg = aggCampaigns(sbCampaigns, (r: SBCampaignRow) => r.cost, (r: SBCampaignRow) => r.salesClicks)
  const sdAgg = aggCampaigns(sdCampaigns, (r: SDCampaignRow) => r.cost, (r: SDCampaignRow) => r.salesClicks)

  // ── monthly trend ──────────────────────────────────────────────
  const monthly = [
    '## 월별 채널 트렌드 (월 | 채널 | 광고비EUR | 광고매출EUR | ROAS)',
    ...monthlyTrend('SP', spCampaigns, (r: SPCampaignRow) => r.spend, (r: SPCampaignRow) => r.sales14d),
    ...monthlyTrend('SB', sbCampaigns, (r: SBCampaignRow) => r.cost, (r: SBCampaignRow) => r.salesClicks),
    ...monthlyTrend('SD', sdCampaigns, (r: SDCampaignRow) => r.cost, (r: SDCampaignRow) => r.salesClicks),
  ].join('\n')

  // ── ASIN sales (cancelled orders excluded, matching Product page) ─
  const nameByAsin = new Map<string, string>()
  for (const l of listing) if (l.asin1) nameByAsin.set(l.asin1, l.itemName)
  const unitsByAsin = buildAsinSalesMap(orders, from, to + '~') // '~' sorts after any time suffix
  const revByAsin = new Map<string, { revenue: number; orders: number }>()
  for (const o of orders) {
    if (o.orderStatus === 'Cancelled') continue
    const agg = revByAsin.get(o.asin) ?? { revenue: 0, orders: 0 }
    agg.revenue += o.itemPrice
    agg.orders += 1
    revByAsin.set(o.asin, agg)
  }
  const TOP_ASIN = 60
  const asinRows = [...revByAsin.entries()]
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, TOP_ASIN)
    .map(([asin, v]) =>
      `${asin} | ${(nameByAsin.get(asin) ?? '').slice(0, 60)} | ${r2(v.revenue)} | ${unitsByAsin.get(asin) ?? 0} | ${v.orders}`
    )
  const asinSection = [
    `## ASIN별 판매 (취소 제외, 매출 상위 ${Math.min(TOP_ASIN, revByAsin.size)}/${revByAsin.size}개) (ASIN | 상품명 | 매출EUR | 판매수량 | 주문수)`,
    ...asinRows,
  ].join('\n')

  // ── inventory status ───────────────────────────────────────────
  const invRows = inventory.map(i => {
    const units = unitsByAsin.get(i.asin) ?? 0
    const days = calcDaysOfStock(i.afnFulfillableQuantity, units, rangeDays)
    return { ...i, days, status: getStockStatus(days) }
  })
  const critical = invRows.filter(i => i.status === 'critical')
  const warning = invRows.filter(i => i.status === 'warning')
  const invSection = [
    `## 재고 상태 (전체 ${invRows.length} SKU: 위험 ${critical.length} / 주의 ${warning.length} / 정상 ${invRows.length - critical.length - warning.length})`,
    '### 위험(<14일)·주의(14-30일) SKU (SKU | ASIN | 상품명 | 가용재고 | 예상소진일)',
    ...[...critical, ...warning].map(i =>
      `${i.sku} | ${i.asin} | ${(i.productName ?? '').slice(0, 50)} | ${i.afnFulfillableQuantity} | ${i.days === Infinity ? '∞' : r2(i.days)}일`
    ),
  ].join('\n')

  // ── traffic ────────────────────────────────────────────────────
  const trafByAsin = new Map<string, { sessions: number; pv: number; units: number; bb: number; bbN: number }>()
  for (const t of traffic) {
    const agg = trafByAsin.get(t.childAsin) ?? { sessions: 0, pv: 0, units: 0, bb: 0, bbN: 0 }
    agg.sessions += t.sessionsTotal
    agg.pv += t.pageViewsTotal
    agg.units += t.unitsOrdered
    agg.bb += t.buyBoxPercentage
    agg.bbN += 1
    trafByAsin.set(t.childAsin, agg)
  }
  const TOP_TRAF = 40
  const trafRows = [...trafByAsin.entries()]
    .sort(([, a], [, b]) => b.sessions - a.sessions)
    .slice(0, TOP_TRAF)
    .map(([asin, v]) =>
      `${asin} | ${v.sessions} | ${v.pv} | ${v.units} | ${r2(calcCVR(v.units, v.sessions))}% | ${r2(v.bb / Math.max(1, v.bbN))}%`
    )
  const trafSection = [
    `## 트래픽 (세션 상위 ${Math.min(TOP_TRAF, trafByAsin.size)}/${trafByAsin.size} ASIN) (ASIN | 세션 | 페이지뷰 | 주문수량 | CVR | 평균바이박스%)`,
    ...trafRows,
  ].join('\n')

  // ── attribution by publisher ───────────────────────────────────
  const byPub = new Map<string, { sales: number; purchases: number; ntbSales: number; halo: number; campaigns: Set<string> }>()
  for (const a of attribution) {
    const agg = byPub.get(a.publisher) ?? { sales: 0, purchases: 0, ntbSales: 0, halo: 0, campaigns: new Set<string>() }
    agg.sales += a.attributedSales14d
    agg.purchases += a.attributedPurchases14d
    agg.ntbSales += a.attributedNewToBrandSales14d
    agg.halo += a.brandHaloAttributedSales14d
    agg.campaigns.add(a.campaignId)
    byPub.set(a.publisher, agg)
  }
  const attrSection = [
    '## 외부 채널 어트리뷰션 (Publisher | 캠페인수 | 기여매출14d EUR | 기여구매14d | NTB매출EUR | BrandHalo매출EUR)',
    ...[...byPub.entries()].map(([pub, v]) =>
      `${pub} | ${v.campaigns.size} | ${r2(v.sales)} | ${v.purchases} | ${r2(v.ntbSales)} | ${r2(v.halo)}`
    ),
  ].join('\n')

  return [
    totals,
    monthly,
    campaignTable('SP', spAgg),
    campaignTable('SB', sbAgg),
    campaignTable('SD', sdAgg),
    asinSection,
    invSection,
    trafSection,
    attrSection,
  ].join('\n\n')
}
