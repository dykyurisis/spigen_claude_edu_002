'use client'
import { useEffect, useState } from 'react'
import { useDashboardStore } from '@/lib/store/dashboardStore'
import { fetchAllData } from '@/lib/supabase/actions'

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const hydrateAll = useDashboardStore(s => s.hydrateAll)

  useEffect(() => {
    setMounted(true)
    // Supabase is the read source; the Google Sheet is synced into it
    // hourly (Cloud Scheduler) or via the manual Sync button.
    fetchAllData()
      .then(data => hydrateAll(data))
      .catch(err => console.error('Failed to load data from Supabase:', err))
  }, [hydrateAll])

  if (!mounted) return <>{children}</>
  return <>{children}</>
}
