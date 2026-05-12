'use client'
import { useEffect } from 'react'
import { DataType } from '@/types/data'
import { FileDropzone } from './FileDropzone'

const SLOTS: { type: DataType; label: string }[] = [
  { type: 'sp_campaigns',  label: 'SP Campaigns' },
  { type: 'sb_campaigns',  label: 'SB Campaigns' },
  { type: 'sd_campaigns',  label: 'SD Campaigns' },
  { type: 'orders',        label: 'Orders' },
  { type: 'listing',       label: 'Listing' },
  { type: 'inventory',     label: 'Inventory' },
  { type: 'traffic',       label: 'Traffic' },
  { type: 'attribution',   label: 'Attribution' },
]

export function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
         onClick={onClose}>
      <div className="bg-zinc-900 rounded-2xl p-6 w-[600px] max-h-[90vh] overflow-y-auto border border-zinc-700"
           onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Upload Data</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl">×</button>
        </div>
        <div className="space-y-2">
          {SLOTS.map(s => <FileDropzone key={s.type} dataType={s.type} label={s.label} />)}
        </div>
      </div>
    </div>
  )
}
