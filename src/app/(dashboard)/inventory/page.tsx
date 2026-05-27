'use client'
import { useMemo, useState } from 'react'
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, type ColumnDef, type SortingState } from '@tanstack/react-table'
import { useDashboardStore } from '@/lib/store/dashboardStore'
import { Badge } from '@/components/ui/Badge'
import { KpiCard } from '@/components/ui/KpiCard'
import { buildAsinSalesMap, calcDaysOfStock, getStockStatus } from '@/lib/metrics/inventoryMetrics'
import { differenceInDays, parseISO } from 'date-fns'

function eur(n: number) { return `€${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }

type InvRow = {
  sku: string; asin: string; productName: string; price: number
  fulfillable: number; reserved: number; inbound: number; total: number
  dailySales: number; daysOfStock: number; status: ReturnType<typeof getStockStatus>
}

export default function InventoryPage() {
  const { inventory, orders, dateRange } = useDashboardStore()
  const { from, to } = dateRange ?? { from: '2000-01-01', to: '2099-12-31' }
  const [sorting, setSorting] = useState<SortingState>([{ id: 'daysOfStock', desc: false }])

  const dateRangeDays = useMemo(() => {
    try { return Math.max(1, differenceInDays(parseISO(to), parseISO(from)) + 1) } catch { return 30 }
  }, [from, to])

  const asinSalesMap = useMemo(() => buildAsinSalesMap(orders, from, to), [orders, from, to])

  const rows: InvRow[] = useMemo(() => inventory.map(r => {
    const unitsSold = asinSalesMap.get(r.asin) ?? 0
    const daysOfStock = calcDaysOfStock(r.afnFulfillableQuantity, unitsSold, dateRangeDays)
    return {
      sku: r.sku, asin: r.asin, productName: r.productName, price: r.yourPrice,
      fulfillable: r.afnFulfillableQuantity, reserved: r.afnReservedQuantity,
      inbound: r.afnInboundWorkingQuantity + r.afnInboundShippedQuantity,
      total: r.afnTotalQuantity,
      dailySales: unitsSold / dateRangeDays,
      daysOfStock, status: getStockStatus(daysOfStock),
    }
  }), [inventory, asinSalesMap, dateRangeDays])

  const dangerCount = rows.filter(r => r.status === 'critical').length
  const warningCount = rows.filter(r => r.status === 'warning').length
  const inboundCount = rows.filter(r => r.inbound > 0).length

  const columns: ColumnDef<InvRow>[] = [
    { accessorKey: 'sku', header: 'SKU' },
    { accessorKey: 'asin', header: 'ASIN' },
    { accessorKey: 'productName', header: 'Product', cell: i => <span className="max-w-xs truncate block" title={String(i.getValue())}>{String(i.getValue())}</span> },
    { accessorKey: 'price', header: 'Price', cell: i => eur(Number(i.getValue())) },
    { accessorKey: 'fulfillable', header: 'Fulfillable', cell: i => Number(i.getValue()).toLocaleString('de-DE') },
    { accessorKey: 'reserved', header: 'Reserved', cell: i => Number(i.getValue()).toLocaleString('de-DE') },
    { accessorKey: 'inbound', header: 'Inbound', cell: i => Number(i.getValue()).toLocaleString('de-DE') },
    { accessorKey: 'total', header: 'Total', cell: i => Number(i.getValue()).toLocaleString('de-DE') },
    { accessorKey: 'dailySales', header: 'Daily Sales', cell: i => Number(i.getValue()).toFixed(1) },
    { accessorKey: 'daysOfStock', header: 'Days Stock', cell: i => { const v = Number(i.getValue()); return v === Infinity ? '—' : v.toFixed(0) } },
    { id: 'statusBadge', header: 'Status', accessorFn: r => r.status, cell: i => {
      const s = String(i.getValue()) as ReturnType<typeof getStockStatus>
      return <Badge variant={s === 'critical' ? 'danger' : s === 'warning' ? 'warning' : 'success'} label={s === 'critical' ? 'At Risk' : s === 'warning' ? 'Low Stock' : 'OK'} />
    }},
  ]

  const table = useReactTable({ data: rows, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-white">Inventory</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard title="At Risk (< 14 days)" value={dangerCount} />
        <KpiCard title="Low Stock (14–30 days)" value={warningCount} />
        <KpiCard title="Inbound Shipments" value={inboundCount} />
      </div>
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
              <tr key={row.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
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
    </div>
  )
}
