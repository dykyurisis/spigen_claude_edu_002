'use client'
import { useState, useRef } from 'react'
import { DataType } from '@/types/data'
import { parseCSV } from '@/lib/parsers'
import { useDashboardStore } from '@/lib/store/dashboardStore'

interface FileDropzoneProps { dataType: DataType; label: string }

export function FileDropzone({ dataType, label }: FileDropzoneProps) {
  const setData = useDashboardStore(s => s.setData)
  const uploadedAt = useDashboardStore(s => s.uploadedAt[dataType])
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const rows = parseCSV(dataType, text)
        if (rows.length > 50000) setError(`Warning: ${rows.length} rows loaded (>50,000)`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setData(dataType, rows as any)
      } catch (err) {
        setError(String(err))
      }
    }
    reader.readAsText(file)
  }

  return (
    <div
      onDragEnter={e => { e.preventDefault(); setDragging(true) }}
      onDragOver={e => e.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer rounded-lg border-2 border-dashed p-3 transition-colors ${
        dragging ? 'border-blue-500 bg-blue-900/20' : uploadedAt ? 'border-green-700 bg-green-900/10' : 'border-zinc-700 hover:border-zinc-500'
      }`}
    >
      <input ref={inputRef} type="file" accept=".csv,.xlsx" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-300">{label}</span>
        {uploadedAt
          ? <span className="text-xs text-green-400">✓ {new Date(uploadedAt).toLocaleTimeString()}</span>
          : <span className="text-xs text-zinc-500">Drop CSV/XLSX</span>
        }
      </div>
      {error && <p className="text-xs text-amber-400 mt-1">{error}</p>}
    </div>
  )
}
