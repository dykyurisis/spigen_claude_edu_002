'use client'

import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { useDashboardStore } from '@/lib/store/dashboardStore'

export function DateRangePicker() {
  const setDateRange = useDashboardStore(s => s.setDateRange)
  const dateRange = useDashboardStore(s => s.dateRange)
  const [showCustom, setShowCustom] = useState(false)

  function applyPreset(days: number) {
    setShowCustom(false)
    const to = format(new Date(), 'yyyy-MM-dd')
    const from = format(subDays(new Date(), days - 1), 'yyyy-MM-dd')
    setDateRange(from, to)
  }

  return (
    <div className="flex flex-col gap-2 px-3 pb-4">
      <p className="text-xs text-zinc-500 uppercase tracking-wide">Date Range</p>
      <div className="flex gap-1">
        {[7, 30].map(d => (
          <button
            key={d}
            onClick={() => applyPreset(d)}
            className="flex-1 text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
          >
            {d}d
          </button>
        ))}
        <button
          onClick={() => setShowCustom(v => !v)}
          className="flex-1 text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
        >
          Custom
        </button>
      </div>
      {showCustom && (
        <div className="flex flex-col gap-1">
          <input
            type="date"
            defaultValue={dateRange?.from ?? ''}
            onChange={e => dateRange && setDateRange(e.target.value, dateRange.to)}
            className="bg-zinc-800 text-zinc-300 text-xs rounded px-2 py-1 border border-zinc-700"
          />
          <input
            type="date"
            defaultValue={dateRange?.to ?? ''}
            onChange={e => dateRange && setDateRange(dateRange.from, e.target.value)}
            className="bg-zinc-800 text-zinc-300 text-xs rounded px-2 py-1 border border-zinc-700"
          />
        </div>
      )}
      {dateRange && (
        <p className="text-xs text-zinc-500">
          {dateRange.from} → {dateRange.to}
        </p>
      )}
    </div>
  )
}
