import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dhbkfpbsqohidihkalrl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const initialLinks = [
  {
    id: 'link-1',
    url: 'https://www.totalwine.com/spirits/cognac/hennessy-xo/p/1628750',
    title: 'Hennessy XO Cognac 750ml - Total Wine & More',
    description: 'Rich, robust, with flavors of candied fruit, spice, wild cocoa, and oak. Essential for Vietnamese wedding banquet Chào Bàn table toasts.',
    image_url: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=800&q=80',
    site_name: 'Total Wine',
    category: 'drinks',
    submitted_by: 'Alfredo',
    notes: 'Good price on case discount! We need 8-10 bottles for the banquet tables.',
    status: 'reviewing',
    estimated_cost: 2100,
    created_at: '2026-08-15T14:30:00Z',
    updated_at: '2026-08-15T14:30:00Z'
  },
  {
    id: 'link-2',
    url: 'https://www.instagram.com/p/aodai_inspiration_red_gold',
    title: 'Custom Silk Red & Gold Áo Dài with Dragon & Phoenix Embroidery',
    description: 'Hand-tailored Vietnamese royal silk Áo Dài featuring double happiness golden metallic thread embroidery and matching Khăn Đóng.',
    image_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
    site_name: 'Instagram',
    category: 'attire',
    submitted_by: 'Trang',
    notes: 'Trang loves this red and gold silk cut for the grand entrance and table toasting!',
    status: 'booked',
    estimated_cost: 1600,
    created_at: '2026-08-18T16:20:00Z',
    updated_at: '2026-08-18T16:20:00Z'
  },
  {
    id: 'link-3',
    url: 'https://www.yelp.com/biz/grand-harbor-restaurant-temple-city',
    title: 'Grand Harbor Restaurant - Authentic Asian Banquet Menu',
    description: 'Renowned Cantonese & Vietnamese banquet hall in Temple City featuring live seafood, Ginger Scallion Lobster, and Peking Duck.',
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    site_name: 'Yelp',
    category: 'venue',
    submitted_by: 'Trang',
    notes: 'Venue allows host-supplied alcohol and corkage package with glassware included.',
    status: 'booked',
    estimated_cost: 14500,
    created_at: '2026-08-20T11:00:00Z',
    updated_at: '2026-08-20T11:00:00Z'
  },
  {
    id: 'link-4',
    url: 'https://www.pinterest.com/pin/wedding_red_gold_backdrop_orchids',
    title: 'Modern Double Happiness 囍 Red Rose & Phalaenopsis Orchid Backdrop',
    description: 'Circular floral stage arch with cascading white & red orchids, warm uplighting, and glowing gold Double Happiness crest.',
    image_url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80',
    site_name: 'Pinterest',
    category: 'decor',
    submitted_by: 'Trang',
    notes: 'Saved for stage backdrop inspiration behind the sweetheart table.',
    status: 'saved',
    estimated_cost: 2500,
    created_at: '2026-08-22T09:15:00Z',
    updated_at: '2026-08-22T09:15:00Z'
  },
  {
    id: 'link-5',
    url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
    title: 'Em Đồng Ý (I Do) - Đức Phúc x 911 x Khắc Hưng',
    description: 'Romantic bilingual ballad chosen for our ceremonial entrance and invitation soundtrack.',
    image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    site_name: 'Spotify',
    category: 'music',
    submitted_by: 'Alfredo',
    notes: 'Our official wedding anthem! Starts right at 0:13 melody.',
    status: 'booked',
    created_at: '2026-08-24T18:00:00Z',
    updated_at: '2026-08-24T18:00:00Z'
  }
];

async function seed() {
  console.log('Seeding inspiration links to Supabase...');
  for (const link of initialLinks) {
    const { error } = await supabase
      .from('inspiration_links')
      .upsert(link, { onConflict: 'id' });
    if (error) {
      console.error(`Failed to upsert ${link.id}:`, error.message);
    } else {
      console.log(`✅ Upserted ${link.id} (${link.title.slice(0, 30)})`);
    }
  }
  console.log('Done!');
}

seed();
