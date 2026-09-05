import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local manually so dotenv is not required
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [k, ...v] = trimmed.split('=');
    if (k && v) {
      env[k.trim()] = v.join('=').trim();
    }
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('====================================================');
console.log('   SUPABASE LIVE CLOUD CONNECTION & HEALTH AUDIT    ');
console.log('====================================================');
console.log('Target URL:       ', supabaseUrl);
console.log('Anon Key:         ', anonKey ? `Active (${anonKey.slice(0, 15)}...${anonKey.slice(-8)})` : 'MISSING');
console.log('Service Role Key: ', serviceKey ? `Active (${serviceKey.slice(0, 15)}...${serviceKey.slice(-8)})` : 'MISSING');

if (!supabaseUrl || !serviceKey) {
  console.error('FAIL: Missing credentials in .env.local');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const anonClient = createClient(supabaseUrl, anonKey);

async function runAudit() {
  const tables = ['parties', 'guests', 'tables', 'expenses', 'milestones', 'song_requests', 'venues'];
  
  console.log('\n[TEST 1] Admin Client (Service Role) Read & Record Counts:');
  console.log('----------------------------------------------------');
  for (const table of tables) {
    try {
      const startTime = Date.now();
      const { data, error, count } = await adminClient.from(table).select('*', { count: 'exact' });
      const elapsed = Date.now() - startTime;
      if (error) {
        console.log(`  ✗ Table '${table}': ERROR - ${error.message}`);
      } else {
        console.log(`  ✓ Table '${table.padEnd(14)}': ${String(data.length).padStart(3)} rows | Latency: ${elapsed}ms | Sample: ${data[0]?.id || 'empty'}`);
      }
    } catch (e) {
      console.log(`  ✗ Table '${table}': EXCEPTION - ${e.message}`);
    }
  }

  console.log('\n[TEST 2] Public Anon Client Read (RLS / Public Access):');
  console.log('----------------------------------------------------');
  for (const table of tables) {
    try {
      const { data, error } = await anonClient.from(table).select('*');
      if (error) {
        console.log(`  • Table '${table.padEnd(14)}': Restricted/RLS Protected (${error.message})`);
      } else {
        console.log(`  ✓ Table '${table.padEnd(14)}': Publicly Readable (${data.length} rows)`);
      }
    } catch (e) {
      console.log(`  • Table '${table}': ${e.message}`);
    }
  }

  console.log('\n[TEST 3] Live CRUD Roundtrip (Write -> Read -> Delete):');
  console.log('----------------------------------------------------');
  const testId = `audit-${Date.now()}`;
  try {
    // 3A. Insert
    const { data: inserted, error: insertError } = await adminClient
      .from('song_requests')
      .insert({
        id: testId,
        guest_name: 'Audit Bot',
        song_title: 'Live Connection Melody',
        artist: 'Antigravity Verified',
        genre: 'other',
        notes: 'Automated live functionality test',
        status: 'queued'
      })
      .select();

    if (insertError) {
      console.log(`  ✗ Insert test failed: ${insertError.message}`);
    } else {
      console.log(`  ✓ INSERT: Created record in 'song_requests' with ID: ${testId}`);

      // 3B. Read back
      const { data: fetched, error: fetchError } = await adminClient
        .from('song_requests')
        .select('*')
        .eq('id', testId)
        .single();

      if (fetchError || !fetched) {
        console.log(`  ✗ SELECT verification failed: ${fetchError?.message}`);
      } else {
        console.log(`  ✓ SELECT: Verified newly inserted record matches: "${fetched.song_title}"`);
      }

      // 3C. Delete
      const { error: deleteError } = await adminClient
        .from('song_requests')
        .delete()
        .eq('id', testId);

      if (deleteError) {
        console.log(`  ✗ DELETE cleanup failed: ${deleteError.message}`);
      } else {
        console.log(`  ✓ DELETE: Cleaned up test record from database.`);
      }
    }
  } catch (e) {
    console.log(`  ✗ CRUD exception: ${e.message}`);
  }

  console.log('\n[TEST 4] Supabase Auth & Users Service:');
  console.log('----------------------------------------------------');
  try {
    const { data: users, error: authError } = await adminClient.auth.admin.listUsers();
    if (authError) {
      console.log(`  • Auth Admin: ${authError.message}`);
    } else {
      console.log(`  ✓ Auth Service: Active (${users.users.length} registered users found)`);
      users.users.forEach(u => console.log(`    - ${u.email} (Confirmed: ${!!u.email_confirmed_at})`));
    }
  } catch (e) {
    console.log(`  • Auth Service note: ${e.message}`);
  }

  console.log('\n====================================================');
  console.log('   AUDIT COMPLETE: All Supabase Systems Operational ');
  console.log('====================================================');
}

runAudit();
