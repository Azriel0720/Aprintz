import 'server-only';

import { createServerSupabase } from '@/lib/supabase-server';

export async function getCurrentUser() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}

export async function isAdminUser() {
  const user = await getCurrentUser();
  return user?.app_metadata?.role === 'admin';
}