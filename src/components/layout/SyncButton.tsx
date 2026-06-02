'use client'
import { useState } from 'react'
import { syncFromSheet } from '@/lib/sync/sync-actions'
import { fetchAllData } from '@/lib/supabase/actions'
import { useDashboardStore } from '@/lib/store/dashboardStore'

export function SyncButton() {
  const hydrateAll = useDashboardStore(s => s.hydrateAll)
  const [syncing, setSyncing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'done' | 'error'>('idle')

  async function handleSync() {
    if (syncing) return
    setSyncing(true)
    setStatus('idle')
    try {
      await syncFromSheet()
      // Re-hydrate the store from Supabase so the new data shows immediately
      const data = await fetchAllData()
      hydrateAll(data)
      setStatus('done')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      console.error('Manual sync failed:', err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 5000)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={syncing}
      aria-label="Sync data from Google Sheet"
      className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1 rounded-lg border border-zinc-700 hover:border-zinc-500 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-wait"
    >
      {syncing ? '⏳ Syncing...' : status === 'done' ? '✓ Synced' : status === 'error' ? '⚠ Sync failed' : '⟳ Sync'}
    </button>
  )
}
