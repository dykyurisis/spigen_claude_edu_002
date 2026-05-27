import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/supabase/auth-actions'
import Link from 'next/link'

export async function SidebarUserInfo() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) console.error('[SidebarUserInfo] getUser failed:', error.message)
  const user = data?.user

  // Generate initials from email (e.g., "john@example.com" → "J")
  const initials = user?.email ? user.email[0].toUpperCase() : '?'
  const email = user?.email ?? ''
  // Truncate long emails: "john.doe@verylongdomain.com" → "john.doe@very…"
  const displayEmail = email.length > 22 ? email.slice(0, 22) + '…' : email

  return (
    <div className="border-t border-zinc-800 p-3">
      <Link
        href="/profile"
        className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-zinc-800/50 transition-colors group"
      >
        {/* Avatar circle with initials */}
        <div className="w-7 h-7 rounded-full bg-pink-600/30 border border-pink-500/40 flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-pink-400">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">
            {displayEmail}
          </p>
          <p className="text-[10px] text-zinc-500">My Profile</p>
        </div>
      </Link>
      <form action={signOut} className="mt-1">
        <button
          type="submit"
          className="w-full text-left px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800/50"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
