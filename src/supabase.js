import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gqeuavjeeqvwyokxzbtn.supabase.co'
const SUPABASE_KEY = 'sb_publishable_0SNnyxYu4_LHJS4CncOqCA_LEnVZ6vP'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)