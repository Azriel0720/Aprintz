import 'server-only';

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = url && secretKey
	? createClient(url, secretKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		})
	: null;
