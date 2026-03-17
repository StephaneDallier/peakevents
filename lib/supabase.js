import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xsqvxwbixkjcdnoqrorf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzcXZ4d2JpeGtqY2Rub3Fyb3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MDU5NDAsImV4cCI6MjA4ODM4MTk0MH0.pluxVx-oet7vbLdrgqt8-sibdIdGwkYMJSnGORkpOh8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
