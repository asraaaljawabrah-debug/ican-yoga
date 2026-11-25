import { appSupabase } from '../services/supabase.js';

export function loadCatalog() {
  return appSupabase().list();
}
