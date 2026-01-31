import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

import type { EmailOtpType } from '@supabase/supabase-js'

/**
 * Auth callback route for handling Supabase magic links and OAuth
 * 
 * This route is called when users click magic links or complete OAuth flows.
 * It exchanges the auth code for a session and redirects to the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  // Handle PKCE flow (code exchange)
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
    
    console.error('Auth callback error (code exchange):', error)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Handle token hash (email OTP verification link)
  // Supports all Supabase email types: magiclink, signup, recovery, invite, email_change
  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as EmailOtpType,
    })
    
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
    
    console.error('Auth callback error (token hash):', error)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // No valid auth params
  return NextResponse.redirect(`${origin}/login?error=missing_params`)
}
