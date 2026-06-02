'use server'

import { createClient } from '@/lib/supabase/server'
import { syncSheetToSupabase, type SyncResult } from './sync'

/** Manual sync triggered from the dashboard UI. Requires a logged-in user. */
export async function syncFromSheet(): Promise<SyncResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) throw new Error('Not authenticated')
  return syncSheetToSupabase()
}
