import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://SEU_PROJECT_URL.supabase.co'
const SUPABASE_ANON_KEY = 'SUA_ANON_PUBLIC_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
