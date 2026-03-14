import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { getSupabaseEnv } from '@/lib/env'

export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv()
  const cookieStore = await cookies()
  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )
}
