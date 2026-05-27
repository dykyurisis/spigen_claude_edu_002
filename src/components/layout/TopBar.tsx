import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/supabase/auth-actions'

export async function TopBar() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) console.error('[TopBar] getUser failed:', error.message)
  const user = data?.user

  return (
    <header className="h-12 flex items-center justify-end gap-3 px-6 bg-zinc-900 border-b border-zinc-800 shrink-0">
      {user?.email && (
        <span className="text-xs text-zinc-400">{user.email}</span>
      )}
      <form action={signOut}>
        <button
          type="submit"
          className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1 rounded-lg border border-zinc-700 hover:border-zinc-500 transition-colors"
        >
          Sign out
        </button>
      </form>
    </header>
  )
}
