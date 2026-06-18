import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'

// Client for general use (client-side or simple server-side calls)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Function to create a server-side client with cookies (for SSR/Actions)
// This is typically handled by @supabase/ssr in Next.js 14/15
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClientServer() {
  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
