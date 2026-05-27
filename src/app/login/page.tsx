import Link from 'next/link'
import { signIn, signUp, signInWithOtp } from '@/lib/supabase/auth-actions'

interface LoginPageProps {
  searchParams: Promise<{
    error?: string
    message?: string
    mode?: string
    tab?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const rawError = params.error
  const rawMessage = params.message
  const error = typeof rawError === 'string' ? rawError.slice(0, 200) : undefined
  const message = typeof rawMessage === 'string' ? rawMessage.slice(0, 200) : undefined
  const mode = params.mode // 'signup' or undefined
  const tab = params.tab   // 'magic' or undefined

  const isSignUp = mode === 'signup'
  const isMagicTab = tab === 'magic'

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Spigen DE Analytics
          </h1>
          <p className="mt-2 text-sm text-zinc-400">Sign in to continue</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-lg border border-green-800 bg-green-950/50 px-4 py-3 text-sm text-green-400">
            {message}
          </div>
        )}

        {/* Card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
          {/* Tab Navigation */}
          <div className="flex border-b border-zinc-800 mb-6">
            <Link
              href="/login"
              className={`px-4 pb-3 text-sm font-medium transition-colors ${
                !isMagicTab
                  ? 'border-b-2 border-pink-500 text-pink-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Email / Password
            </Link>
            <Link
              href={`/login?tab=magic${isSignUp ? '&mode=signup' : ''}`}
              className={`px-4 pb-3 text-sm font-medium transition-colors ${
                isMagicTab
                  ? 'border-b-2 border-pink-500 text-pink-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Magic Link
            </Link>
          </div>

          {/* Section 1: Email + Password */}
          {!isMagicTab && (
            <div>
              {/* Sign In / Sign Up mode toggle */}
              <div className="flex gap-4 mb-5">
                <Link
                  href="/login"
                  className={`text-sm font-medium transition-colors ${
                    !isSignUp
                      ? 'text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  href="/login?mode=signup"
                  className={`text-sm font-medium transition-colors ${
                    isSignUp
                      ? 'text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Sign Up
                </Link>
              </div>

              <form action={isSignUp ? signUp : signIn} className="space-y-4">
                <div>
                  <label
                    htmlFor="email-pw"
                    className="block text-xs font-medium text-zinc-400 mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="email-pw"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-zinc-400 mb-1.5"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    minLength={isSignUp ? 6 : undefined}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium py-2 transition-colors"
                >
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </button>
              </form>
            </div>
          )}

          {/* Section 2: Magic Link */}
          {isMagicTab && (
            <div>
              <p className="text-sm text-zinc-400 mb-5">
                We&apos;ll email you a magic link to sign in instantly — no password needed.
              </p>
              <form action={signInWithOtp} className="space-y-4">
                <div>
                  <label
                    htmlFor="email-magic"
                    className="block text-xs font-medium text-zinc-400 mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="email-magic"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium py-2 transition-colors"
                >
                  Send Magic Link
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
