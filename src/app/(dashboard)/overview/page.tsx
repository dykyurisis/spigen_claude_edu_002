'use client'
import { useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts'
import { useDashboardStore } from '@/lib/store/dashboardStore'
import { KpiCard } from '@/components/ui/KpiCard'
import { calcBlendedROAS } from '@/lib/metrics/adMetrics'
import { normalizeDate } from '@/lib/utils/normalizeDate'

function inRange(date: string, from: string, to: string) {
  const d = normalizeDate(date)
  return d >= from && d <= to
}
function sum(arr: number[]) { return arr.reduce((a, b) => a + b, 0) }
const PIE_COLORS = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6']

export default function OverviewPage() {
  const { spCampaigns, sbCampaigns, sdCampaigns, orders, traffic, attribution, dateRange } = useDashboardStore()

  const { from, to } = dateRange ?? { from: '2000-01-01', to: '2099-12-31' }

  const filteredOrders = useMemo(() => orders.filter(r => inRange(r.purchaseDate, from, to)), [orders, from, to])
  const filteredSP = useMemo(() => spCampaigns.filter(r => inRange(r.date, from, to)), [spCampaigns, from, to])
  const filteredSB = useMemo(() => sbCampaigns.filter(r => inRange(r.date, from, to)), [sbCampaigns, from, to])
  const filteredSD = useMemo(() => sdCampaigns.filter(r => inRange(r.date, from, to)), [sdCampaigns, from, to])
  const filteredAttr = useMemo(() => attribution.filter(r => inRange(r.date, from, to)), [attribution, from, to])
  const filteredTraffic = useMemo(() => traffic.filter(r => inRange(r.reportDate, from, to)), [traffic, from, to])

  const totalRevenue = useMemo(() => sum(filteredOrders.map(r => r.itemPrice)), [filteredOrders])
  const totalAdSpend = useMemo(() =>
    sum(filteredSP.map(r => r.spend)) + sum(filteredSB.map(r => r.cost)) + sum(filteredSD.map(r => r.cost))
  , [filteredSP, filteredSB, filteredSD])
  const blendedROAS = calcBlendedROAS(totalRevenue, filteredSP, filteredSB, filteredSD)
  const avgCVR = filteredTraffic.length ? sum(filteredTraffic.map(r => r.unitSessionPercentage)) / filteredTraffic.length : 0
  const avgBuyBox = filteredTraffic.length ? sum(filteredTraffic.map(r => r.buyBoxPercentage)) / filteredTraffic.length : 0

  const donutData = useMemo(() => {
    const spSales = sum(filteredSP.map(r => r.sales14d))
    const sbSales = sum(filteredSB.map(r => r.salesClicks))
    const sdSales = sum(filteredSD.map(r => r.salesClicks))
    const gaSales = sum(filteredAttr.filter(r => r.publisher === 'Google Ads').map(r => r.attributedSales14d))
    const igSales = sum(filteredAttr.filter(r => r.publisher === 'Instagram').map(r => r.attributedSales14d))
    const fbSales = sum(filteredAttr.filter(r => r.publisher === 'Facebook').map(r => r.attributedSales14d))
    const organic = Math.max(0, totalRevenue - spSales - sbSales - sdSales)
    return [
      { name: 'Organic', value: organic },
      { name: 'SP', value: spSales }, { name: 'SB', value: sbSales }, { name: 'SD', value: sdSales },
      { name: 'Google Ads', value: gaSales }, { name: 'Instagram', value: igSales }, { name: 'Facebook', value: fbSales },
    ].filter(d => d.value > 0)
  }, [filteredSP, filteredSB, filteredSD, filteredAttr, totalRevenue])

  const trendData = useMemo(() => {
    const map = new Map<string, { revenue: number; spend: number }>()
    filteredOrders.forEach(r => {
      const d = map.get(r.purchaseDate) ?? { revenue: 0, spend: 0 }
      d.revenue += r.itemPrice; map.set(r.purchaseDate, d)
    })
    ;[...filteredSP.map(r => ({ date: r.date, spend: r.spend })),
      ...filteredSB.map(r => ({ date: r.date, spend: r.cost })),
      ...filteredSD.map(r => ({ date: r.date, spend: r.cost }))
    ].forEach(({ date, spend }) => {
      const d = map.get(date) ?? { revenue: 0, spend: 0 }
      d.spend += spend; map.set(date, d)
    })
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v }))
  }, [filteredOrders, filteredSP, filteredSB, filteredSD])

  const noData = orders.length === 0 && spCampaigns.length === 0
  if (noData) return (
    <div className="flex items-center justify-center h-64 text-zinc-500 text-sm">
      No data loaded. Click "Upload Data" in the sidebar to import your reports.
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard title="Total Revenue" value={`€${totalRevenue.toLocaleString('de-DE', { maximumFractionDigits: 0 })}`} />
        <KpiCard title="Total Ad Spend" value={`€${totalAdSpend.toLocaleString('de-DE', { maximumFractionDigits: 0 })}`} />
        <KpiCard title="Blended ROAS" value={blendedROAS.toFixed(2)} unit="x" />
        <KpiCard title="Total Orders" value={filteredOrders.length} />
        <KpiCard title="Avg CVR" value={avgCVR.toFixed(1)} unit="%" />
        <KpiCard title="Buy Box %" value={avgBuyBox.toFixed(1)} unit="%" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Revenue by Channel</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                {donutData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `€${v.toLocaleString('de-DE', { maximumFractionDigits: 0 })}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Daily Revenue vs Ad Spend</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fill: '#71717a', fontSize: 11 }} />
              <YAxis yAxisId="rev" tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
              <YAxis yAxisId="spend" orientation="right" tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `€${v.toLocaleString('de-DE', { maximumFractionDigits: 0 })}`} />
              <Legend />
              <Line yAxisId="rev" type="monotone" dataKey="revenue" stroke="#6366f1" dot={false} name="Revenue" />
              <Line yAxisId="spend" type="monotone" dataKey="spend" stroke="#f59e0b" dot={false} name="Ad Spend" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
