import 'server-only';

import { supabase } from '@/lib/supabase';

export type HomepageBanner = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  cta_label: string;
  href: string;
  image_url: string;
  image_path: string;
  display_order: number;
};

export type HomepageReview = {
  id: string;
  customer_name: string;
  company: string;
  content: string;
  rating: number;
  image_url: string | null;
  display_order: number;
  product_slug: string;
};

export async function getHomepageContent() {
  if (!supabase) return { banners: [] as HomepageBanner[] };
  const bannersResult = await supabase
    .from('homepage_banners')
    .select('id,eyebrow,title,description,cta_label,href,image_url,image_path,display_order')
    .eq('is_active', true)
    .order('display_order');

  return {
    banners: bannersResult.error ? [] : (bannersResult.data ?? []) as HomepageBanner[],
  };
}