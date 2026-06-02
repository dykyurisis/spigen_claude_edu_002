'use client'
import { useEffect, useState } from 'react'
import { useDashboardStore } from '@/lib/store/dashboardStore'
import { fetchAllData } from '@/lib/supabase/actions'
import { fetchSheetData } from '@/lib/google/sheets-actions'

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const hydrateAll = useDashboardStore(s => s.hydrateAll)

  useEffect(() => {
    setMounted(true)
    // Google Sheet is the primary data source; Supabase is the fallback.
    fetchSheetData()
      .then(data => hydrateAll(data))
      .catch(err => {
        console.error('Sheet fetch failed, falling back to Supabase:', err)
        return fetchAllData()
          .then(data => hydrateAll(data))
          .catch(e => console.error('Supabase fallback also failed:', e))
      })
  }, [hydrateAll])

  if (!mounted) return <>{children}</>
  return <>{children}</>
}
