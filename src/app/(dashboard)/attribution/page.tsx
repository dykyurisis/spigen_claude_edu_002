'use client'
import { useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts'
import { useDashboardStore } from '@/lib/store/dashboardStore'
import { normalizeDate } from '@/lib/utils/normalizeDate'
import { calcNTBRate } from '@/lib/metrics/adMetrics'

function inRange(date: string, from: string, to: string) {
  const d = normalizeDate(date); return d >= from && d <= to
}
function eur(n: number) { return `€${n.toLocaleString('de-DE', { maximumFractionDigits: 0 })}` }
function sum(arr: number[]) { return arr.reduce((a, b) => a + b, 0) }

const PUBLISHERS = ['Google Ads', 'Instagram', 'Facebook'] as const
const COLORS = { promoted: '#6366f1', brandHalo: '#8b5cf6' }

export default function AttributionPage() {
  const { attribution, spCampaigns, sbCampaigns, sdCampaigns, dateRange } = useDashboardStore()
  const { from, to } = dateRange ?? { from: '2000-01-01', to: '2099-12-31' }
  const filtered = useMemo(() => attribution.filter(r => inRange(r.date, from, to)), [attribution, from, to])

  const pubMetrics = useMemo(() =>
    PUBLISHERS.map(pub => {
      const rows = filtered.filter(r => r.publisher === pub)
      return {
        publisher: pub,
        sales: sum(rows.map(r => r.attributedSales14d)),
        purchases: sum(rows.map(r => r.attributedPurchases14d)),
        ntbSales: sum(rows.map(r => r.attributedNewToBrandSales14d)),
        ntbPurchases: sum(rows.map(r => r.attributedNewToBrandPurchases14d)),
        brandHaloSales: sum(rows.map(r => r.brandHaloAttributedSales14d)),
        brandHaloPurchases: sum(rows.map(r => r.brandHaloAttributedPurchases14d)),
        ntbRate: calcNTBRate(
          sum(rows.map(r => r.attributedNewToBrandPurchases14d)),
          sum(rows.map(r => r.attributedPurchases14d))
        ),
      }
    })
  , [filtered])

  const promotedSales = sum(filtered.filter(r => r.productConversionType === 'Promoted').map(r => r.attributedSales14d))
  const brandHaloSales = sum(filtered.filter(r => r.productConversionType === 'Brand Halo').map(r => r.brandHaloAttributedSales14d))
  const donutData = [
    { name: 'Promoted', value: promotedSales },
    { name: 'Brand Halo', value: brandHaloSales },
  ].filter(d => d.value > 0)

  const campaignNameMap = useMemo(() => {
    const map = new Map<string, { name: string; type: string }>()
    spCampaigns.forEach(r => map.set(String(r.campaignId), { name: r.campaignName, type: 'SP' }))
    sbCampaigns.forEach(r => map.set(String(r.campaignId), { name: r.campaignName, type: 'SB' }))
    sdCampaigns.forEach(r => map.set(String(r.campaignId), { name: r.campaignName, type: 'SD' }))
    return map
  }, [spCampaigns, sbCampaigns, sdCampaigns])

  const uniqueCampaigns = useMemo(() => {
    const seen = new Set<string>()
    return filtered.filter(r => { if (seen.has(r.campaignId)) return false; seen.add(r.campaignId); return true })
  }, [filtered])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">External Attribution</h1>

      {/* Publisher Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pubMetrics.map(m => (
          <div key={m.publisher} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 space-y-2">
            <p className="text-sm font-semibold text-white">{m.publisher}</p>
            <div className="space-y-1 text-xs text-zinc-400">
              <div className="flex justify-between"><span>Attr. Sales (14d)</span><span className="text-zinc-200">{eur(m.sales)}</span></div>
              <div className="flex justify-between"><span>Attr. Purchases</span><span className="text-zinc-200">{m.purchases}</span></div>
              <div className="flex justify-between"><span>NTB Sales</span><span className="text-zinc-200">{eur(m.ntbSales)}</span></div>
              <div className="flex justify-between"><span>Brand Halo Sales</span><span className="text-zinc-200">{eur(m.brandHaloSales)}</span></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Promoted vs Brand Halo Donut */}
        <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Promoted vs Brand Halo</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                <Cell fill={COLORS.promoted} /><Cell fill={COLORS.brandHalo} />
              </Pie>
              <Tooltip formatter={(v: number) => eur(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* NTB Rate Bar Chart */}
        <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">NTB Rate by Publisher</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pubMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="publisher" tick={{ fill: '#71717a', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fill: '#71717a', fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
              <Bar dataKey="ntbRate" fill="#6366f1" radius={[4, 4, 0, 0]} name="NTB Rate" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Campaign Lookup */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-x-auto">
        <div className="px-4 py-3 border-b border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-300">Campaign Lookup</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-3 py-2 text-xs text-zinc-500 uppercase tracking-wide">Campaign ID</th>
              <th className="text-left px-3 py-2 text-xs text-zinc-500 uppercase tracking-wide">Campaign Name</th>
              <th className="text-left px-3 py-2 text-xs text-zinc-500 uppercase tracking-wide">Ad Type</th>
              <th className="text-left px-3 py-2 text-xs text-zinc-500 uppercase tracking-wide">Publisher</th>
            </tr>
          </thead>
          <tbody>
            {uniqueCampaigns.map(r => {
              const lookup = campaignNameMap.get(r.campaignId)
              return (
                <tr key={r.campaignId} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="px-3 py-2 text-zinc-400 font-mono text-xs">{r.campaignId}</td>
                  <td className="px-3 py-2 text-zinc-300 max-w-xs truncate">{lookup?.name ?? '—'}</td>
                  <td className="px-3 py-2 text-zinc-400">{lookup?.type ?? '—'}</td>
                  <td className="px-3 py-2 text-zinc-400">{r.publisher}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
