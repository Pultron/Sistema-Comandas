import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gqeuavjeeqvwyokxzbtn.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxZXVhdmplZXF2d3lva3h6YnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNDcwNDgsImV4cCI6MjA5NDcyMzA0OH0.7lVtGfGfxNQ9mW4oN7aa6TD6zhbNo9MQDqA4XOW7-HI'
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)