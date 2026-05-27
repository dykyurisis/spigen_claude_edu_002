import { createClient } from '@/lib/supabase/server'
import { updatePassword } from '@/lib/supabase/auth-actions'
import { redirect } from 'next/navigation'

interface Props {
  searchParams: Promise<{ error?: string; message?: string }>
}

export default async function ProfilePage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data, error: authError } = await supabase.auth.getUser()
  if (authError || !data.user) redirect('/login')

  const user = data.user
  const { error: rawError, message: rawMessage } = await searchParams
  const error = typeof rawError === 'string' ? rawError.slice(0, 200) : undefined
  const message = typeof rawMessage === 'string' ? rawMessage.slice(0, 200) : undefined

  // Generate initials (up to 2 chars)
  const fullName = user.user_metadata?.full_name as string | undefined
  const initials = fullName?.trim()
    ? fullName.trim().split(/\s+/).map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : user.email?.[0].toUpperCase() ?? '?'

  // Format user ID (show first 8 chars)
  const shortId = user.id.slice(0, 8)

  // Format created date
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—'

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold text-zinc-100">My Profile</h1>

      {/* Feedback messages */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-green-800 bg-green-950/50 px-4 py-3 text-sm text-green-400">
          {message}
        </div>
      )}

      {/* Profile card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center gap-4 mb-6">
          {/* Large avatar */}
          <div className="w-14 h-14 rounded-full bg-pink-600/30 border border-pink-500/40 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-pink-400">{initials}</span>
          </div>
          <div>
            <p className="text-base font-medium text-zinc-100">{user.email}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Authenticated via Supabase</p>
          </div>
        </div>

        <dl className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-zinc-800">
            <dt className="text-sm text-zinc-500">Email</dt>
            <dd className="text-sm text-zinc-300">{user.email}</dd>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-zinc-800">
            <dt className="text-sm text-zinc-500">User ID</dt>
            <dd className="text-sm text-zinc-300 font-mono">{shortId}…</dd>
          </div>
          <div className="flex justify-between items-center py-2">
            <dt className="text-sm text-zinc-500">Member since</dt>
            <dd className="text-sm text-zinc-300">{createdAt}</dd>
          </div>
        </dl>
      </div>

      {/* Change password card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Change Password</h2>
        <form action={updatePassword} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-xs text-zinc-400 mb-1.5">
              Current Password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-xs text-zinc-400 mb-1.5">
              New Password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-xs text-zinc-400 mb-1.5">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium py-2 transition-colors"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
}
