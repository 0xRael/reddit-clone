import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // use anon key here
    {
      cookies: {
        get(name) {
          const cookie = cookieStore.get(name)
          return cookie ? { name: cookie.name, value: cookie.value } : undefined
        },
        set(name, value, options) {
          try {
            cookieStore.set(name, value, options as CookieOptions)
          } catch {
            // In static contexts, cookies can't be set
          }
        },
        remove(name, options) {
          try {
            cookieStore.delete(name, options)
          } catch {
            // In static contexts, cookies can't be deleted
          }
        },
      },
    }
  )
}
