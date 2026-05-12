'use client'
import { useState, useMemo } from 'react'
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, type ColumnDef, type SortingState } from '@tanstack/react-table'
import { useDashboardStore } from '@/lib/store/dashboardStore'
import { Badge } from '@/components/ui/Badge'
import { buildAsinLookup } from '@/lib/joins/asinLookup'
import { buildProductToCampaignMap } from '@/lib/joins/campaignToProduct'
import { buildAsinSalesMap, calcDaysOfStock, getStockStatus } from '@/lib/metrics/inventoryMetrics'
import { normalizeDate } from '@/lib/utils/normalizeDate'
import { differenceInDays, parseISO } from 'date-fns'

function inRange(date: string, from: string, to: string) {
  const d = normalizeDate(date); return d >= from && d <= to
}
function eur(n: number) { return `€${n.toLocaleString('de-DE', { maximumFractionDigits: 2 })}` }

type ProductRow = {
  asin: string; productName: string; sessions: number; cvr: number
  buyBoxPct: number; orders: number; revenue: number
  adSales14d: number; brandHaloSales: number; fulfillable: number; daysOfStock: number
}

export default function ProductPage() {
  const { listing, traffic, orders, attribution, inventory, dateRange } = useDashboardStore()
  const { from, to } = dateRange ?? { from: '2000-01-01', to: '2099-12-31' }
  const [selectedAsin, setSelectedAsin] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])

  const dateRangeDays = useMemo(() => {
    try { return Math.max(1, differenceInDays(parseISO(to), parseISO(from)) + 1) } catch { return 30 }
  }, [from, to])

  const asinLookup = useMemo(() => buildAsinLookup(listing), [listing])
  const productToCampaign = useMemo(() => buildProductToCampaignMap(attribution), [attribution])
  const asinSalesMap = useMemo(() => buildAsinSalesMap(orders, from, to), [orders, from, to])

  const trafficByAsin = useMemo(() => {
    const map = new Map<string, typeof traffic[0]>()
    traffic.filter(r => inRange(r.reportDate, from, to)).forEach(r => map.set(r.childAsin, r))
    return map
  }, [traffic, from, to])

  const attrByAsin = useMemo(() => {
    const map = new Map<string, { adSales: number; brandHalo: number }>()
    attribution.filter(r => inRange(r.date, from, to)).forEach(r => {
      const cur = map.get(r.productAsin) ?? { adSales: 0, brandHalo: 0 }
      cur.adSales += r.attributedSales14d; cur.brandHalo += r.brandHaloAttributedSales14d
      map.set(r.productAsin, cur)
    })
    return map
  }, [attribution, from, to])

  const inventoryByAsin = useMemo(() => {
    const map = new Map<string, typeof inventory[0]>()
    inventory.forEach(r => { if (!map.has(r.asin) || r.reportDate > (map.get(r.asin)?.reportDate ?? '')) map.set(r.asin, r) })
    return map
  }, [inventory])

  const orderRevByAsin = useMemo(() => {
    const map = new Map<string, number>()
    orders.filter(r => inRange(r.purchaseDate, from, to)).forEach(r => {
      map.set(r.asin, (map.get(r.asin) ?? 0) + r.itemPrice)
    })
    return map
  }, [orders, from, to])

  const rows: ProductRow[] = useMemo(() => {
    const asins = new Set([...listing.map(r => r.asin1), ...trafficByAsin.keys()])
    return [...asins].map(asin => {
      const listRow = asinLookup.get(asin)
      const tRow = trafficByAsin.get(asin)
      const inv = inventoryByAsin.get(asin)
      const attr = attrByAsin.get(asin) ?? { adSales: 0, brandHalo: 0 }
      const unitsSold = asinSalesMap.get(asin) ?? 0
      const fulfillable = inv?.afnFulfillableQuantity ?? 0
      const daysOfStock = calcDaysOfStock(fulfillable, unitsSold, dateRangeDays)
      return {
        asin, productName: listRow?.itemName ?? tRow?.title ?? asin,
        sessions: tRow?.sessionsTotal ?? 0, cvr: tRow?.unitSessionPercentage ?? 0,
        buyBoxPct: tRow?.buyBoxPercentage ?? 0, orders: unitsSold,
        revenue: orderRevByAsin.get(asin) ?? 0,
        adSales14d: attr.adSales, brandHaloSales: attr.brandHalo,
        fulfillable, daysOfStock,
      }
    }).filter(r => r.sessions > 0 || r.orders > 0 || r.adSales14d > 0)
  }, [listing, trafficByAsin, asinLookup, inventoryByAsin, attrByAsin, asinSalesMap, orderRevByAsin, dateRangeDays])

  const stockBadge = (days: number) => {
    const s = getStockStatus(days)
    const labels: Record<typeof s, string> = { critical: 'At Risk', warning: 'Low Stock', ok: 'OK' }
    return <Badge variant={s === 'critical' ? 'danger' : s === 'warning' ? 'warning' : 'success'} label={labels[s]} />
  }

  const columns: ColumnDef<ProductRow>[] = [
    { accessorKey: 'asin', header: 'ASIN' },
    { accessorKey: 'productName', header: 'Product', cell: i => <span className="max-w-xs truncate block" title={String(i.getValue())}>{String(i.getValue())}</span> },
    { accessorKey: 'sessions', header: 'Sessions', cell: i => Number(i.getValue()).toLocaleString('de-DE') },
    { accessorKey: 'cvr', header: 'CVR', cell: i => `${Number(i.getValue()).toFixed(1)}%` },
    { accessorKey: 'buyBoxPct', header: 'Buy Box', cell: i => `${Number(i.getValue()).toFixed(1)}%` },
    { accessorKey: 'orders', header: 'Units', cell: i => Number(i.getValue()).toLocaleString('de-DE') },
    { accessorKey: 'revenue', header: 'Revenue', cell: i => eur(Number(i.getValue())) },
    { accessorKey: 'adSales14d', header: 'Ad Sales (14d)', cell: i => eur(Number(i.getValue())) },
    { accessorKey: 'brandHaloSales', header: 'Brand Halo', cell: i => eur(Number(i.getValue())) },
    { accessorKey: 'fulfillable', header: 'FBA Stock', cell: i => Number(i.getValue()).toLocaleString('de-DE') },
    { accessorKey: 'daysOfStock', header: 'Days Stock', cell: i => { const v = Number(i.getValue()); return v === Infinity ? '—' : v.toFixed(0) } },
    { id: 'stockStatus', header: 'Status', accessorFn: r => r.daysOfStock, cell: i => stockBadge(Number(i.getValue())) },
  ]

  const table = useReactTable({ data: rows, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })

  const selectedRow = selectedAsin ? rows.find(r => r.asin === selectedAsin) : null
  const linkedCampaigns = useMemo(() => {
    if (!selectedAsin) return []
    return [...(productToCampaign.get(selectedAsin) ?? new Set<string>())]
  }, [selectedAsin, productToCampaign])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-white">Products</h1>
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-x-auto">
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
              <tr key={row.id} onClick={() => setSelectedAsin(row.original.asin)}
                className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition-colors">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-3 py-2 text-zinc-300 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Side Panel */}
      <div className={`fixed right-0 top-0 h-full w-96 bg-zinc-900 border-l border-zinc-800 z-50 transition-transform duration-200 overflow-y-auto ${selectedAsin ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">{selectedAsin}</h2>
          <button onClick={() => setSelectedAsin(null)} className="text-zinc-400 hover:text-white text-xl">×</button>
        </div>
        {selectedRow && (
          <div className="p-5 space-y-4 text-sm">
            <p className="text-zinc-400 truncate">{selectedRow.productName}</p>
            <div className="space-y-1">
              <p className="text-xs text-zinc-500 uppercase">Stock</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-zinc-800 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, (selectedRow.fulfillable / Math.max(selectedRow.fulfillable + 1, 1)) * 100)}%` }} />
                </div>
                <span className="text-zinc-300">{selectedRow.fulfillable} units</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-500 uppercase">Linked Campaigns</p>
              {linkedCampaigns.length === 0
                ? <p className="text-zinc-500">No attribution data for this ASIN</p>
                : <ul className="space-y-1">{linkedCampaigns.map(c => (
                    <li key={String(c)} className="text-zinc-300 text-xs bg-zinc-800 rounded px-2 py-1">
                      {String(c)}
                    </li>
                  ))}</ul>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
