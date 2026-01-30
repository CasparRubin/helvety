import "server-only"

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { getSupabaseUrl, getSupabaseKey } from '@/lib/env-validation'

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase server client with cookie handling for Server Components.
 * This is the standard way to create a client in Server Components, Server Actions, etc.
 * 
 * @returns Promise that resolves to a Supabase client instance
 */
export async function createServerComponentClient(): Promise<SupabaseClient> {
  const supabaseUrl = getSupabaseUrl()
  const supabaseKey = getSupabaseKey()
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>): void {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // Session refresh happens automatically through Supabase client in server components.
        }
      },
    },
  })
}
