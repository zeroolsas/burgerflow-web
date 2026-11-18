import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL!

export async function api(path: string, options: RequestInit = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  }

  if (token) headers['Authorization'] = `Bearer ${token}`

  return fetch(`${API_URL}${path}`, { ...options, headers })
}