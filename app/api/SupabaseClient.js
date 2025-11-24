import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qwutbnhyboxzmqbyvrzy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3dXRibmh5Ym94em1xYnl2cnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMjA2NzUsImV4cCI6MjA3Njc5NjY3NX0.M5xg_kDYye04MQfc6YEVbGjlSLEhq79HTAzPUxD54ys'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
