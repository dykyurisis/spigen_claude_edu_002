'use client'
import { useState, useMemo } from 'react'
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, type ColumnDef, type SortingState } from '@tanstack/react-table'
import { useDashboardStore } from '@/lib/store/dashboardStore'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { normalizeDate } from '@/lib/utils/normalizeDate'
import { calcROAS, calcACoS } from '@/lib/metrics/adMetrics'

type AdTab = 'SP' | 'SB' | 'SD' | 'Attribution' | 'All'
const TABS = [
  { id: 'SP', label: 'SP' }, { id: 'SB', label: 'SB' }, { id: 'SD', label: 'SD' },
  { id: 'Attribution', label: 'Attribution' }, { id: 'All', label: 'All' },
]

function inRange(date: string, from: string, to: string) {
  const d = normalizeDate(date); return d >= from && d <= to
}
function safe(n: number, d: number) { return d === 0 ? 0 : n / d }
function pct(n: number) { return `${n.toFixed(1)}%` }
function eur(n: number) { return `€${n.toLocaleString('de-DE', { maximumFractionDigits: 2 })}` }
function statusVariant(s: string) { return s === 'ENABLED' ? 'success' : s === 'PAUSED' ? 'neutral' : 'warning' }

function SortableTable<T>({ data, columns }: { data: T[]; columns: ColumnDef<T>[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const table = useReactTable({ data, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id} className="border-b border-zinc-800">
              {hg.headers.map(h => (
                <th key={h.id} onClick={h.column.getToggleSortingHandler()}
                  className="text-left px-3 py-2 text-xs text-zinc-500 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                  {h.column.getIsSorted() === 'asc' ? ' ↑' : h.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-3 py-2 text-zinc-300 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-zinc-500">No data</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default function AdvertisingPage() {
  const [activeTab, setActiveTab] = useState<AdTab>('SP')
  const { spCampaigns, sbCampaigns, sdCampaigns, attribution, dateRange } = useDashboardStore()
  const { from, to } = dateRange ?? { from: '2000-01-01', to: '2099-12-31' }

  const fSP = useMemo(() => spCampaigns.filter(r => inRange(r.date, from, to)), [spCampaigns, from, to])
  const fSB = useMemo(() => sbCampaigns.filter(r => inRange(r.date, from, to)), [sbCampaigns, from, to])
  const fSD = useMemo(() => sdCampaigns.filter(r => inRange(r.date, from, to)), [sdCampaigns, from, to])
  const fAttr = useMemo(() => attribution.filter(r => inRange(r.date, from, to)), [attribution, from, to])

  const spCols: ColumnDef<typeof fSP[0]>[] = [
    { accessorKey: 'campaignName', header: 'Campaign', cell: i => <span className="max-w-xs truncate block" title={String(i.getValue())}>{String(i.getValue())}</span> },
    { accessorKey: 'impressions', header: 'Impressions', cell: i => Number(i.getValue()).toLocaleString('de-DE') },
    { accessorKey: 'clicks', header: 'Clicks', cell: i => Number(i.getValue()).toLocaleString('de-DE') },
    { id: 'ctr', header: 'CTR', accessorFn: r => safe(r.clicks, r.impressions) * 100, cell: i => pct(Number(i.getValue())) },
    { accessorKey: 'spend', header: 'Spend', cell: i => eur(Number(i.getValue())) },
    { accessorKey: 'sales14d', header: 'Sales (14d)', cell: i => eur(Number(i.getValue())) },
    { id: 'roas', header: 'ROAS', accessorFn: r => calcROAS(r.sales14d, r.spend), cell: i => Number(i.getValue()) === 0 ? '—' : `${Number(i.getValue()).toFixed(2)}x` },
    { id: 'acos', header: 'ACoS', accessorFn: r => calcACoS(r.spend, r.sales14d), cell: i => Number(i.getValue()) === 0 ? '—' : pct(Number(i.getValue())) },
    { accessorKey: 'campaignBudgetAmount', header: 'Budget', cell: i => eur(Number(i.getValue())) },
    { id: 'budgetUtil', header: 'Budget Used', accessorFn: r => safe(r.spend, r.campaignBudgetAmount) * 100, cell: i => pct(Number(i.getValue())) },
    { id: 'status', header: 'Status', accessorFn: r => r.campaignStatus, cell: i => <Badge variant={statusVariant(String(i.getValue())) as 'danger'|'warning'|'success'|'neutral'} label={String(i.getValue())} /> },
  ]

  const sbCols: ColumnDef<typeof fSB[0]>[] = [
    { accessorKey: 'campaignName', header: 'Campaign', cell: i => <span className="max-w-xs truncate block">{String(i.getValue())}</span> },
    { accessorKey: 'impressions', header: 'Impressions', cell: i => Number(i.getValue()).toLocaleString('de-DE') },
    { accessorKey: 'clicks', header: 'Clicks', cell: i => Number(i.getValue()).toLocaleString('de-DE') },
    { accessorKey: 'cost', header: 'Spend', cell: i => eur(Number(i.getValue())) },
    { accessorKey: 'salesClicks', header: 'Sales (14d)', cell: i => eur(Number(i.getValue())) },
    { id: 'roas', header: 'ROAS', accessorFn: r => calcROAS(r.salesClicks, r.cost), cell: i => Number(i.getValue()) === 0 ? '—' : `${Number(i.getValue()).toFixed(2)}x` },
    { id: 'acos', header: 'ACoS', accessorFn: r => calcACoS(r.cost, r.salesClicks), cell: i => Number(i.getValue()) === 0 ? '—' : pct(Number(i.getValue())) },
    { accessorKey: 'newToBrandSales', header: 'NTB Sales', cell: i => eur(Number(i.getValue())) },
    { accessorKey: 'newToBrandPurchases', header: 'NTB Orders', cell: i => Number(i.getValue()).toLocaleString('de-DE') },
    { accessorKey: 'detailPageViews', header: 'Detail PVs', cell: i => Number(i.getValue()).toLocaleString('de-DE') },
    { id: 'status', accessorFn: r => r.campaignStatus, header: 'Status', cell: i => <Badge variant={statusVariant(String(i.getValue())) as 'danger'|'warning'|'success'|'neutral'} label={String(i.getValue())} /> },
  ]

  const sdCols: ColumnDef<typeof fSD[0]>[] = [
    { accessorKey: 'campaignName', header: 'Campaign', cell: i => <span className="max-w-xs truncate block">{String(i.getValue())}</span> },
    { accessorKey: 'impressions', header: 'Impressions', cell: i => Number(i.getValue()).toLocaleString('de-DE') },
    { accessorKey: 'clicks', header: 'Clicks', cell: i => Number(i.getValue()).toLocaleString('de-DE') },
    { accessorKey: 'cost', header: 'Spend', cell: i => eur(Number(i.getValue())) },
    { accessorKey: 'salesClicks', header: 'Sales (14d)', cell: i => eur(Number(i.getValue())) },
    { id: 'roas', header: 'ROAS', accessorFn: r => calcROAS(r.salesClicks, r.cost), cell: i => Number(i.getValue()) === 0 ? '—' : `${Number(i.getValue()).toFixed(2)}x` },
    { id: 'acos', header: 'ACoS', accessorFn: r => calcACoS(r.cost, r.salesClicks), cell: i => Number(i.getValue()) === 0 ? '—' : pct(Number(i.getValue())) },
    { accessorKey: 'cumulativeReach', header: 'Reach', cell: i => Number(i.getValue()).toLocaleString('de-DE') },
    { id: 'status', accessorFn: r => r.campaignStatus, header: 'Status', cell: i => <Badge variant={statusVariant(String(i.getValue())) as 'danger'|'warning'|'success'|'neutral'} label={String(i.getValue())} /> },
  ]

  type AttrSummary = { publisher: string; sales: number; purchases: number; ntbSales: number; brandHalo: number }
  const attrSummary: AttrSummary[] = useMemo(() => {
    const pubs = ['Google Ads', 'Instagram', 'Facebook']
    return pubs.map(pub => {
      const rows = fAttr.filter(r => r.publisher === pub)
      return {
        publisher: pub,
        sales: rows.reduce((s, r) => s + r.attributedSales14d, 0),
        purchases: rows.reduce((s, r) => s + r.attributedPurchases14d, 0),
        ntbSales: rows.reduce((s, r) => s + r.attributedNewToBrandSales14d, 0),
        brandHalo: rows.reduce((s, r) => s + r.brandHaloAttributedSales14d, 0),
      }
    })
  }, [fAttr])

  const attrCols: ColumnDef<AttrSummary>[] = [
    { accessorKey: 'publisher', header: 'Publisher' },
    { accessorKey: 'sales', header: 'Attr. Sales (14d)', cell: i => eur(Number(i.getValue())) },
    { accessorKey: 'purchases', header: 'Attr. Purchases', cell: i => Number(i.getValue()).toLocaleString('de-DE') },
    { accessorKey: 'ntbSales', header: 'NTB Sales', cell: i => eur(Number(i.getValue())) },
    { accessorKey: 'brandHalo', header: 'Brand Halo Sales', cell: i => eur(Number(i.getValue())) },
  ]

  type MergedRow = { adType: string; campaignName: string; impressions: number; clicks: number; spend: number; sales14d: number; roas: number; acos: number; status: string }
  const allRows: MergedRow[] = useMemo(() => [
    ...fSP.map(r => ({ adType: 'SP', campaignName: r.campaignName, impressions: r.impressions, clicks: r.clicks, spend: r.spend, sales14d: r.sales14d, roas: calcROAS(r.sales14d, r.spend), acos: calcACoS(r.spend, r.sales14d), status: r.campaignStatus })),
    ...fSB.map(r => ({ adType: 'SB', campaignName: r.campaignName, impressions: r.impressions, clicks: r.clicks, spend: r.cost, sales14d: r.salesClicks, roas: calcROAS(r.salesClicks, r.cost), acos: calcACoS(r.cost, r.salesClicks), status: r.campaignStatus })),
    ...fSD.map(r => ({ adType: 'SD', campaignName: r.campaignName, impressions: r.impressions, clicks: r.clicks, spend: r.cost, sales14d: r.salesClicks, roas: calcROAS(r.salesClicks, r.cost), acos: calcACoS(r.cost, r.salesClicks), status: r.campaignStatus })),
  ], [fSP, fSB, fSD])

  const allCols: ColumnDef<MergedRow>[] = [
    { accessorKey: 'adType', header: 'Type' },
    { accessorKey: 'campaignName', header: 'Campaign', cell: i => <span className="max-w-xs truncate block">{String(i.getValue())}</span> },
    { accessorKey: 'impressions', header: 'Impressions', cell: i => Number(i.getValue()).toLocaleString('de-DE') },
    { accessorKey: 'clicks', header: 'Clicks', cell: i => Number(i.getValue()).toLocaleString('de-DE') },
    { accessorKey: 'spend', header: 'Spend', cell: i => eur(Number(i.getValue())) },
    { accessorKey: 'sales14d', header: 'Sales (14d)', cell: i => eur(Number(i.getValue())) },
    { accessorKey: 'roas', header: 'ROAS', cell: i => Number(i.getValue()) === 0 ? '—' : `${Number(i.getValue()).toFixed(2)}x` },
    { accessorKey: 'acos', header: 'ACoS', cell: i => Number(i.getValue()) === 0 ? '—' : pct(Number(i.getValue())) },
    { id: 'status', accessorFn: r => r.status, header: 'Status', cell: i => <Badge variant={statusVariant(String(i.getValue())) as 'danger'|'warning'|'success'|'neutral'} label={String(i.getValue())} /> },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-white">Advertising</h1>
      <Tabs tabs={TABS} activeTab={activeTab} onChange={id => setActiveTab(id as AdTab)} />
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        {activeTab === 'SP' && <SortableTable data={fSP} columns={spCols} />}
        {activeTab === 'SB' && <SortableTable data={fSB} columns={sbCols} />}
        {activeTab === 'SD' && <SortableTable data={fSD} columns={sdCols} />}
        {activeTab === 'Attribution' && <SortableTable data={attrSummary} columns={attrCols} />}
        {activeTab === 'All' && (
          <>
            <SortableTable data={allRows} columns={allCols} />
            <div className="border-t border-zinc-800 p-4">
              <p className="text-xs text-zinc-500 mb-3">
                External Attribution (14d fixed window — ROAS not comparable with SP/SB/SD)
              </p>
              <SortableTable data={attrSummary} columns={attrCols} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
