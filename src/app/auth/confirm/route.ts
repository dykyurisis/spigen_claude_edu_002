import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/overview'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/overview'

  const supabase = await createClient()

  // Magic link / OTP flow
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) redirect(next)
  }

  // PKCE flow
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) redirect(next)
  }

  redirect(`/login?error=${encodeURIComponent('Authentication failed')}`)
}
