'use client'

interface KpiCardProps {
  title: string
  value: string | number
  unit?: string
  subtext?: string
  loading?: boolean
}

export function KpiCard({ title, value, unit, subtext, loading }: KpiCardProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 animate-pulse h-28" />
    )
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
      <p className="text-xs text-zinc-500 uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold text-white mt-1">
        {typeof value === 'number' ? value.toLocaleString('de-DE') : value}
        {unit && <span className="text-sm font-normal text-zinc-400 ml-1">{unit}</span>}
      </p>
      {subtext && <p className="text-xs text-zinc-500 mt-1">{subtext}</p>}
    </div>
  )
}
