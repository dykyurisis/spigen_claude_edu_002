'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signIn(formData: FormData): Promise<void> {
  const emailVal = formData.get('email')
  const passwordVal = formData.get('password')
  if (!emailVal || !passwordVal) {
    redirect('/login?error=' + encodeURIComponent('Email and password are required'))
  }
  const email = emailVal as string
  const password = passwordVal as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/overview')
}

export async function signUp(formData: FormData): Promise<void> {
  const emailVal = formData.get('email')
  const passwordVal = formData.get('password')
  if (!emailVal || !passwordVal) {
    redirect('/login?error=' + encodeURIComponent('Email and password are required'))
  }
  const email = emailVal as string
  const password = passwordVal as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Check your email to confirm your account')
}

export async function signInWithOtp(formData: FormData): Promise<void> {
  const emailVal = formData.get('email')
  if (!emailVal) {
    redirect('/login?error=' + encodeURIComponent('Email is required'))
  }
  const email = emailVal as string

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    redirect('/login?error=' + encodeURIComponent('Server configuration error: NEXT_PUBLIC_SITE_URL is not set'))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm`,
    },
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/login?message=Check your email for the magic link')
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  if (error) console.error('[signOut] failed:', error.message)
  redirect('/login')
}
