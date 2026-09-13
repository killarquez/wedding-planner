import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local
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
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('FAIL: Missing credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// 1. Define 17 Tables (Grand Harbor Restaurant 10-Top Banquet Round Tables)
const TABLES_CONFIG = [
  {
    id: 'table-1',
    table_number: 1,
    name: 'Bàn 1: VIP Parents & Trưởng Bối',
    capacity: 10,
    hierarchy_tag: 'vip_family',
    stage_position: 'stage_front_left'
  },
  {
    id: 'table-2',
    table_number: 2,
    name: 'Bàn 2: Alfredo Family & Relatives',
    capacity: 10,
    hierarchy_tag: 'vip_family',
    stage_position: 'stage_front_right'
  },
  {
    id: 'table-3',
    table_number: 3,
    name: 'Bàn 3: Bu Friends',
    capacity: 10,
    hierarchy_tag: 'friends_bar',
    stage_position: 'center'
  },
  {
    id: 'table-4',
    table_number: 4,
    name: 'Bàn 4: (D) Family - Sít Của & Relatives',
    capacity: 10,
    hierarchy_tag: 'extended_relatives',
    stage_position: 'center'
  },
  {
    id: 'table-5',
    table_number: 5,
    name: 'Bàn 5: (D) Family - Bé Của, Mai Của & Kevin',
    capacity: 10,
    hierarchy_tag: 'extended_relatives',
    stage_position: 'center'
  },
  {
    id: 'table-6',
    table_number: 6,
    name: 'Bàn 6: (D) Family - Kẹo, Kim Của & Dượng Sơn',
    capacity: 10,
    hierarchy_tag: 'extended_relatives',
    stage_position: 'center'
  },
  {
    id: 'table-7',
    table_number: 7,
    name: 'Bàn 7: (D) Family & Friends - Alex, Olivia & Friends',
    capacity: 10,
    hierarchy_tag: 'extended_relatives',
    stage_position: 'center'
  },
  {
    id: 'table-8',
    table_number: 8,
    name: 'Bàn 8: (M) Family - Dì Minh, Dì Bảy & Relatives',
    capacity: 10,
    hierarchy_tag: 'extended_relatives',
    stage_position: 'center'
  },
  {
    id: 'table-9',
    table_number: 9,
    name: 'Bàn 9: (M) Family - Anh Quang & Chị Phượng',
    capacity: 10,
    hierarchy_tag: 'extended_relatives',
    stage_position: 'center'
  },
  {
    id: 'table-10',
    table_number: 10,
    name: 'Bàn 10: (M) Family & Friends - Chị Bích & Tuyết Hawaii',
    capacity: 10,
    hierarchy_tag: 'extended_relatives',
    stage_position: 'center'
  },
  {
    id: 'table-11',
    table_number: 11,
    name: 'Bàn 11: (M) Friends - Hội Bạn Mẹ',
    capacity: 10,
    hierarchy_tag: 'general',
    stage_position: 'center'
  },
  {
    id: 'table-12',
    table_number: 12,
    name: 'Bàn 12: (L) Friends - Jocelyn, Holly & Cayla',
    capacity: 10,
    hierarchy_tag: 'friends_bar',
    stage_position: 'near_bar'
  },
  {
    id: 'table-13',
    table_number: 13,
    name: 'Bàn 13: (L) Friends & Close Friends - Teresa & Jimmy',
    capacity: 10,
    hierarchy_tag: 'friends_bar',
    stage_position: 'near_bar'
  },
  {
    id: 'table-14',
    table_number: 14,
    name: 'Bàn 14: (A) Close Friends - Peter, Loredana, Chris & Trevor',
    capacity: 10,
    hierarchy_tag: 'friends_bar',
    stage_position: 'near_bar'
  },
  {
    id: 'table-15',
    table_number: 15,
    name: 'Bàn 15: (A) Close Friends - Daniel, Gary, Aaron & Bailey',
    capacity: 10,
    hierarchy_tag: 'friends_bar',
    stage_position: 'near_bar'
  },
  {
    id: 'table-16',
    table_number: 16,
    name: 'Bàn 16: (A) Friends - Abraham, Verenisse, Einar, Annet, Bertha',
    capacity: 10,
    hierarchy_tag: 'friends_bar',
    stage_position: 'near_bar'
  },
  {
    id: 'table-17',
    table_number: 17,
    name: 'Bàn 17: (A) Friends - Steven Awada, Carolina Franco, Ariadni, Arturo',
    capacity: 10,
    hierarchy_tag: 'friends_bar',
    stage_position: 'back'
  }
];

// 2. Structured Party & Table Assignment Definition (Total 162 Guests)
const PARTIES_PLAN = [
  // ==========================================
  // TABLE 1: VIP Parents & Trưởng Bối (7 guests, 3 open seats)
  // ==========================================
  {
    party_name: 'Bà Ngoại',
    code: 'VIP-NGOAI',
    total_invited: 1,
    table_id: 'table-1',
    tag: 'vip_family',
    notes: 'Elder VIP Table 1',
    guests: [{ first_name: 'Bà', last_name: 'Ngoại', is_primary: true }]
  },
  {
    party_name: 'Ba & Mẹ (Gia Đình Cô Dâu Trang)',
    code: 'VIP-BAME',
    total_invited: 2,
    table_id: 'table-1',
    tag: 'vip_family',
    notes: 'Parents of the Bride',
    guests: [
      { first_name: 'Ba', last_name: 'Nguyễn', is_primary: true },
      { first_name: 'Mẹ', last_name: 'Nguyễn', is_primary: false }
    ]
  },
  {
    party_name: 'Mùi',
    code: 'VIP-MUI',
    phone: '626-650-8371',
    total_invited: 1,
    table_id: 'table-1',
    tag: 'vip_family',
    guests: [{ first_name: 'Mùi', last_name: '', is_primary: true, phone: '626-650-8371' }]
  },
  {
    party_name: 'Bự',
    code: 'VIP-BU',
    phone: '626-758-0179',
    total_invited: 1,
    table_id: 'table-1',
    tag: 'vip_family',
    notes: 'Immediate VIP family. 10 friends seated at Table 3.',
    guests: [{ first_name: 'Bự', last_name: '', is_primary: true, phone: '626-758-0179' }]
  },
  {
    party_name: 'Ruben & Lucy Rossi',
    code: 'VIP-ROSSI',
    phone: '(714) 401-2160',
    total_invited: 2,
    table_id: 'table-1',
    tag: 'vip_family',
    notes: 'Parents of the Groom (Alfredo)',
    guests: [
      { first_name: 'Lucy', last_name: 'Rossi', is_primary: true, phone: '(714) 401-2160' },
      { first_name: 'Ruben', last_name: 'Rossi', is_primary: false, phone: '+1 (786) 426-9974' }
    ]
  },

  // ==========================================
  // TABLE 2: (A) Family - Alfredo Family & Cousins (10 guests)
  // ==========================================
  {
    party_name: 'Joel, Cathy, Jorge & Vanessa',
    code: 'FAM-ROSSI-02',
    phone: '+1 (323) 537-7994',
    total_invited: 4,
    table_id: 'table-2',
    tag: 'vip_family',
    notes: 'Alfredo Immediate Siblings & Family',
    guests: [
      { first_name: 'Joel', last_name: 'Rossi', is_primary: true, phone: '+1 (323) 537-7994' },
      { first_name: 'Cathy', last_name: 'Rossi', is_primary: false },
      { first_name: 'Jorge', last_name: 'Rossi', is_primary: false },
      { first_name: 'Vanessa', last_name: 'Rossi', is_primary: false }
    ]
  },
  {
    party_name: 'Cousin George',
    code: 'GEO-ROSSI-04',
    total_invited: 4,
    table_id: 'table-2',
    tag: 'vip_family',
    notes: 'Cousin George and family (4 seats reserved)',
    guests: [
      { first_name: 'George', last_name: 'Rossi (Cousin)', is_primary: true },
      { first_name: 'Guest 2', last_name: '(George Family)', is_primary: false },
      { first_name: 'Guest 3', last_name: '(George Family)', is_primary: false },
      { first_name: 'Guest 4', last_name: '(George Family)', is_primary: false }
    ]
  },
  {
    party_name: 'Cousin Sara',
    code: 'SARA-ROSSI-02',
    total_invited: 2,
    table_id: 'table-2',
    tag: 'vip_family',
    notes: 'Cousin Sara and plus-one (2 seats reserved)',
    guests: [
      { first_name: 'Sara', last_name: 'Rossi (Cousin)', is_primary: true },
      { first_name: 'Guest 2', last_name: '(Sara Plus-One)', is_primary: false }
    ]
  },

  // ==========================================
  // TABLE 3: Bu Friends (10 guests)
  // ==========================================
  {
    party_name: 'Bu Friends (Hội Bạn Bự)',
    code: 'BU-FRIENDS',
    phone: '626-758-0179',
    total_invited: 10,
    table_id: 'table-3',
    tag: 'friends_bar',
    notes: '10 slots dedicated for Bu friends',
    guests: Array.from({ length: 10 }, (_, i) => ({
      first_name: `Bu Friend #${i + 1}`,
      last_name: '',
      is_primary: i === 0
    }))
  },

  // ==========================================
  // TABLE 4: (D) Family - Sít Của & Relatives (10 guests)
  // ==========================================
  {
    party_name: 'Gia Đình Sít Của & Dượng Đạt',
    code: 'SITCUA-8287',
    phone: '626-409-8287',
    total_invited: 3,
    table_id: 'table-4',
    tag: 'extended_relatives',
    guests: [
      { first_name: 'Sít', last_name: 'Của', is_primary: true, phone: '626-409-8287' },
      { first_name: 'Dượng', last_name: 'Đạt', is_primary: false },
      { first_name: 'Guest 3', last_name: '(Sít Của Family)', is_primary: false }
    ]
  },
  {
    party_name: 'Leyna, Kenny & Sophia',
    code: 'LEYNA-KENNY',
    total_invited: 3,
    table_id: 'table-4',
    tag: 'extended_relatives',
    guests: [
      { first_name: 'Leyna', last_name: '', is_primary: true },
      { first_name: 'Kenny', last_name: '', is_primary: false },
      { first_name: 'Sophia', last_name: '', is_primary: false }
    ]
  },
  {
    party_name: 'Cindy',
    code: 'CINDY-02',
    total_invited: 2,
    table_id: 'table-4',
    tag: 'extended_relatives',
    guests: [
      { first_name: 'Cindy', last_name: '', is_primary: true },
      { first_name: 'Guest 2', last_name: '(Cindy Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: 'Kenny Mom and Dad',
    code: 'KENNY-PARENTS',
    total_invited: 2,
    table_id: 'table-4',
    tag: 'extended_relatives',
    guests: [
      { first_name: 'Kenny', last_name: 'Mom', is_primary: true },
      { first_name: 'Kenny', last_name: 'Dad', is_primary: false }
    ]
  },

  // ==========================================
  // TABLE 5: (D) Family - Bé Của, Mai Của & Kevin (10 guests)
  // ==========================================
  {
    party_name: 'Gia Đình Bé Của & Dượng Bửu',
    code: 'BECUA-5977',
    phone: '626-899-5977',
    total_invited: 4,
    table_id: 'table-5',
    tag: 'extended_relatives',
    guests: [
      { first_name: 'Bé', last_name: 'Của', is_primary: true, phone: '626-899-5977' },
      { first_name: 'Dượng', last_name: 'Bửu', is_primary: false },
      { first_name: 'David', last_name: '', is_primary: false },
      { first_name: 'Serena', last_name: '', is_primary: false }
    ]
  },
  {
    party_name: 'Mai Của & Chú Thanh',
    code: 'MAICUA-0917',
    phone: '626-566-0917',
    total_invited: 2,
    table_id: 'table-5',
    tag: 'extended_relatives',
    guests: [
      { first_name: 'Mai', last_name: 'Của', is_primary: true, phone: '626-566-0917' },
      { first_name: 'Chú', last_name: 'Thanh', is_primary: false }
    ]
  },
  {
    party_name: 'Kevin & My',
    code: 'KEVIN-2978',
    phone: '626-461-2978',
    total_invited: 2,
    table_id: 'table-5',
    tag: 'extended_relatives',
    guests: [
      { first_name: 'Kevin', last_name: '', is_primary: true, phone: '626-461-2978' },
      { first_name: 'My', last_name: '', is_primary: false }
    ]
  },
  {
    party_name: 'Día (Con của dì)',
    code: 'DIA-D5',
    total_invited: 1,
    table_id: 'table-5',
    tag: 'extended_relatives',
    guests: [{ first_name: 'Día', last_name: '(Con của dì)', is_primary: true }]
  },
  {
    party_name: 'Trịnh',
    code: 'TRINH-D1',
    total_invited: 1,
    table_id: 'table-5',
    tag: 'general',
    guests: [{ first_name: 'Trịnh', last_name: '', is_primary: true }]
  },

  // ==========================================
  // TABLE 6: (D) Family - Kẹo, Kim Của & Dượng Sơn (10 guests)
  // ==========================================
  {
    party_name: 'Gia Đình Kẹo & Nghĩa',
    code: 'KEO-0148',
    phone: '626-566-0148',
    total_invited: 5,
    table_id: 'table-6',
    tag: 'extended_relatives',
    guests: [
      { first_name: 'Kẹo', last_name: '', is_primary: true, phone: '626-566-0148' },
      { first_name: 'Nghĩa', last_name: '', is_primary: false },
      { first_name: 'Kẹo', last_name: 'In-law 1', is_primary: false },
      { first_name: 'Kẹo', last_name: 'In-law 2', is_primary: false },
      { first_name: 'Em', last_name: 'Nghĩa', is_primary: false }
    ]
  },
  {
    party_name: 'Kim Của & Chú Sơn',
    code: 'KIMCUA-SON',
    total_invited: 2,
    table_id: 'table-6',
    tag: 'extended_relatives',
    guests: [
      { first_name: 'Kim', last_name: 'Của', is_primary: true },
      { first_name: 'Chú', last_name: 'Sơn', is_primary: false }
    ]
  },
  {
    party_name: 'Dinh',
    code: 'DINH-02',
    total_invited: 2,
    table_id: 'table-6',
    tag: 'extended_relatives',
    guests: [
      { first_name: 'Dinh', last_name: '', is_primary: true },
      { first_name: 'Guest 2', last_name: '(Dinh Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: '(D) Friends Reserved Slot 1',
    code: 'DFRIEND-01',
    total_invited: 1,
    table_id: 'table-6',
    tag: 'general',
    guests: [{ first_name: 'Reserved Guest', last_name: '((D) Friend 1)', is_primary: true }]
  },

  // ==========================================
  // TABLE 7: (D) Family & Friends - Alex, Olivia & Friends (9 guests, 1 open)
  // ==========================================
  {
    party_name: 'Alex & Olivia Family',
    code: 'ALEX-5088',
    phone: '626-223-5088',
    total_invited: 6,
    table_id: 'table-7',
    tag: 'extended_relatives',
    guests: [
      { first_name: 'Alex', last_name: '', is_primary: true, phone: '626-223-5088' },
      { first_name: 'Olivia', last_name: '', is_primary: false },
      { first_name: 'Olivia', last_name: 'Mom', is_primary: false },
      { first_name: 'Olivia', last_name: 'Dad', is_primary: false },
      { first_name: 'Olivia', last_name: 'Sis 1', is_primary: false },
      { first_name: 'Olivia', last_name: 'Sis 2', is_primary: false }
    ]
  },
  {
    party_name: '(D) Friends Reserved Slots 2-4',
    code: 'DFRIEND-234',
    total_invited: 3,
    table_id: 'table-7',
    tag: 'general',
    guests: [
      { first_name: 'Reserved Guest', last_name: '((D) Friend 2)', is_primary: true },
      { first_name: 'Reserved Guest', last_name: '((D) Friend 3)', is_primary: false },
      { first_name: 'Reserved Guest', last_name: '((D) Friend 4)', is_primary: false }
    ]
  },

  // ==========================================
  // TABLE 8: (M) Family - Dì Minh, Dì Bảy & Relatives (10 guests)
  // ==========================================
  {
    party_name: 'Bé Nhi (Con Cô Ngọc)',
    code: 'BENHI-9067',
    phone: '(206) 741-9067',
    total_invited: 2,
    table_id: 'table-8',
    tag: 'extended_relatives',
    guests: [
      { first_name: 'Bé Nhi', last_name: '(Con Cô Ngọc)', is_primary: true, phone: '(206) 741-9067' },
      { first_name: 'Guest 2', last_name: '(Bé Nhi Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: 'Dì Minh & Anh Eddie',
    code: 'DIMINH-0696',
    phone: '(954) 552-0696',
    total_invited: 3,
    table_id: 'table-8',
    tag: 'extended_relatives',
    guests: [
      { first_name: 'Dì', last_name: 'Minh', is_primary: true, phone: '(954) 552-0696' },
      { first_name: 'Anh Eddie', last_name: '(Con Dì Minh)', is_primary: false, phone: '(954) 240-3242' },
      { first_name: 'Guest 3', last_name: '(Eddie Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: 'Dì Bảy',
    code: 'DIBAY-7570',
    phone: '(504) 451-7570',
    total_invited: 2,
    table_id: 'table-8',
    tag: 'extended_relatives',
    guests: [
      { first_name: 'Dì', last_name: 'Bảy', is_primary: true, phone: '(504) 451-7570' },
      { first_name: 'Guest 2', last_name: '(Dì Bảy Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: 'Dì Phượng',
    code: 'DIPHUONG-7338',
    phone: '(267) 344-7338',
    total_invited: 1,
    table_id: 'table-8',
    tag: 'extended_relatives',
    guests: [{ first_name: 'Dì', last_name: 'Phượng', is_primary: true, phone: '(267) 344-7338' }]
  },
  {
    party_name: 'Anh Khải',
    code: 'AKHAI-0413',
    phone: '(954) 991-0413',
    total_invited: 1,
    table_id: 'table-8',
    tag: 'extended_relatives',
    guests: [{ first_name: 'Anh', last_name: 'Khải', is_primary: true, phone: '(954) 991-0413' }]
  },
  {
    party_name: 'Việt',
    code: 'VIET-4855',
    phone: '(714) 260-4855',
    total_invited: 1,
    table_id: 'table-8',
    tag: 'general',
    guests: [{ first_name: 'Việt', last_name: '', is_primary: true, phone: '(714) 260-4855' }]
  },

  // ==========================================
  // TABLE 9: (M) Family - Anh Quang, Chị Phượng & Anh Thuận (10 guests)
  // ==========================================
  {
    party_name: 'Anh Quang',
    code: 'AQUANG-9267',
    phone: '(831) 889-9267',
    total_invited: 4,
    table_id: 'table-9',
    tag: 'extended_relatives',
    guests: [
      { first_name: 'Anh', last_name: 'Quang', is_primary: true, phone: '(831) 889-9267' },
      { first_name: 'Guest 2', last_name: '(Quang Family)', is_primary: false },
      { first_name: 'Guest 3', last_name: '(Quang Family)', is_primary: false },
      { first_name: 'Guest 4', last_name: '(Quang Family)', is_primary: false }
    ]
  },
  {
    party_name: 'Chị Phượng',
    code: 'CPHUONG-4362',
    phone: '(415) 902-4362',
    total_invited: 4,
    table_id: 'table-9',
    tag: 'extended_relatives',
    guests: [
      { first_name: 'Chị', last_name: 'Phượng', is_primary: true, phone: '(415) 902-4362' },
      { first_name: 'Guest 2', last_name: '(Phượng Family)', is_primary: false },
      { first_name: 'Guest 3', last_name: '(Phượng Family)', is_primary: false },
      { first_name: 'Guest 4', last_name: '(Phượng Family)', is_primary: false }
    ]
  },
  {
    party_name: 'Anh Thuận',
    code: 'ATHUAN-1491',
    phone: '(954) 830-1491',
    total_invited: 2,
    table_id: 'table-9',
    tag: 'extended_relatives',
    guests: [
      { first_name: 'Anh', last_name: 'Thuận', is_primary: true, phone: '(954) 830-1491' },
      { first_name: 'Guest 2', last_name: '(Thuận Plus-One)', is_primary: false }
    ]
  },

  // ==========================================
  // TABLE 10: (M) Family & Friends - Chị Bích & Tuyết Hawaii (10 guests)
  // ==========================================
  {
    party_name: 'Chị Bích',
    code: 'CBICH-6188',
    phone: '(954) 661-6188',
    total_invited: 5,
    table_id: 'table-10',
    tag: 'extended_relatives',
    guests: [
      { first_name: 'Chị', last_name: 'Bích', is_primary: true, phone: '(954) 661-6188' },
      { first_name: 'Guest 2', last_name: '(Bích Family)', is_primary: false },
      { first_name: 'Guest 3', last_name: '(Bích Family)', is_primary: false },
      { first_name: 'Guest 4', last_name: '(Bích Family)', is_primary: false },
      { first_name: 'Guest 5', last_name: '(Bích Family)', is_primary: false }
    ]
  },
  {
    party_name: 'Tuyết Hawaii',
    code: 'TUYET-6098',
    phone: '(808) 384-6098',
    total_invited: 4,
    table_id: 'table-10',
    tag: 'general',
    guests: [
      { first_name: 'Tuyết', last_name: 'Hawaii', is_primary: true, phone: '(808) 384-6098' },
      { first_name: 'Guest 2', last_name: '(Tuyết Group)', is_primary: false },
      { first_name: 'Guest 3', last_name: '(Tuyết Group)', is_primary: false },
      { first_name: 'Guest 4', last_name: '(Tuyết Group)', is_primary: false }
    ]
  },
  {
    party_name: 'Xuân',
    code: 'XUAN-8670',
    phone: '(714) 603-8670',
    total_invited: 1,
    table_id: 'table-10',
    tag: 'general',
    guests: [{ first_name: 'Xuân', last_name: '', is_primary: true, phone: '(714) 603-8670' }]
  },

  // ==========================================
  // TABLE 11: (M) Friends - Hội Bạn Mẹ (10 guests)
  // ==========================================
  {
    party_name: 'Tố Mai',
    code: 'TOMAI-2950',
    phone: '(310) 918-2950',
    total_invited: 2,
    table_id: 'table-11',
    tag: 'general',
    guests: [
      { first_name: 'Tố Mai', last_name: '', is_primary: true, phone: '(310) 918-2950' },
      { first_name: 'Guest 2', last_name: '(Tố Mai Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: 'Khanh',
    code: 'KHANH-7350',
    phone: '(909) 945-7350',
    total_invited: 2,
    table_id: 'table-11',
    tag: 'general',
    guests: [
      { first_name: 'Khanh', last_name: '', is_primary: true, phone: '(909) 945-7350' },
      { first_name: 'Guest 2', last_name: '(Khanh Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: 'Hạnh',
    code: 'HANH-5945',
    phone: '(310) 706-5945',
    total_invited: 2,
    table_id: 'table-11',
    tag: 'general',
    guests: [
      { first_name: 'Hạnh', last_name: '', is_primary: true, phone: '(310) 706-5945' },
      { first_name: 'Guest 2', last_name: '(Hạnh Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: 'Cô Bích',
    code: 'COBICH-7683',
    phone: '(626) 258-7683',
    total_invited: 2,
    table_id: 'table-11',
    tag: 'general',
    guests: [
      { first_name: 'Cô Bích', last_name: '', is_primary: true, phone: '(626) 258-7683' },
      { first_name: 'Guest 2', last_name: '(Cô Bích Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: 'Cô Mai Hàng Xóm',
    code: 'COMAI-5107',
    phone: '(626) 224-5107',
    total_invited: 2,
    table_id: 'table-11',
    tag: 'general',
    guests: [
      { first_name: 'Cô Mai', last_name: '(Hàng Xóm)', is_primary: true, phone: '(626) 224-5107' },
      { first_name: 'Guest 2', last_name: '(Cô Mai Plus-One)', is_primary: false }
    ]
  },

  // ==========================================
  // TABLE 12: (L) Friends - Jocelyn, Holly & Cayla (10 guests)
  // ==========================================
  {
    party_name: 'Jocelyn & Colby Family',
    code: 'JOCELYN-COLBY',
    total_invited: 4,
    table_id: 'table-12',
    tag: 'friends_bar',
    guests: [
      { first_name: 'Jocelyn', last_name: '', is_primary: true },
      { first_name: 'Colby', last_name: '', is_primary: false },
      { first_name: 'Jocelyn', last_name: 'Mom', is_primary: false },
      { first_name: 'Jocelyn', last_name: 'Stepdad', is_primary: false }
    ]
  },
  {
    party_name: 'Holly & Tony',
    code: 'HOLLY-0313',
    phone: '951-805-0313',
    total_invited: 2,
    table_id: 'table-12',
    tag: 'friends_bar',
    guests: [
      { first_name: 'Holly', last_name: '', is_primary: true, phone: '951-805-0313' },
      { first_name: 'Tony', last_name: '', is_primary: false }
    ]
  },
  {
    party_name: 'Cayla',
    code: 'CAYLA-6476',
    phone: '626-225-6476',
    total_invited: 2,
    table_id: 'table-12',
    tag: 'friends_bar',
    guests: [
      { first_name: 'Cayla', last_name: '', is_primary: true, phone: '626-225-6476' },
      { first_name: 'Guest 2', last_name: '(Cayla Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: 'Paul',
    code: 'PAUL-01',
    total_invited: 1,
    table_id: 'table-12',
    tag: 'friends_bar',
    guests: [{ first_name: 'Paul', last_name: '', is_primary: true }]
  },
  {
    party_name: 'Frankie',
    code: 'FRANKIE-01',
    total_invited: 1,
    table_id: 'table-12',
    tag: 'friends_bar',
    guests: [{ first_name: 'Frankie', last_name: '', is_primary: true }]
  },

  // ==========================================
  // TABLE 13: (L) Friends & Close Friends - Teresa & Jimmy (10 guests)
  // ==========================================
  {
    party_name: 'Teresa',
    code: 'TERESA-5207',
    phone: '626-246-5207',
    total_invited: 6,
    table_id: 'table-13',
    tag: 'friends_bar',
    guests: [
      { first_name: 'Teresa', last_name: '', is_primary: true, phone: '626-246-5207' },
      { first_name: 'Guest 2', last_name: '(Teresa Group)', is_primary: false },
      { first_name: 'Guest 3', last_name: '(Teresa Group)', is_primary: false },
      { first_name: 'Guest 4', last_name: '(Teresa Group)', is_primary: false },
      { first_name: 'Guest 5', last_name: '(Teresa Group)', is_primary: false },
      { first_name: 'Guest 6', last_name: '(Teresa Group)', is_primary: false }
    ]
  },
  {
    party_name: 'Jimmy',
    code: 'JIMMY-3563',
    phone: '+1 (626) 251-3563',
    total_invited: 2,
    table_id: 'table-13',
    tag: 'friends_bar',
    guests: [
      { first_name: 'Jimmy', last_name: '', is_primary: true, phone: '+1 (626) 251-3563' },
      { first_name: 'Guest 2', last_name: '(Jimmy Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: 'Marlon',
    code: 'MARLON-02',
    total_invited: 2,
    table_id: 'table-13',
    tag: 'friends_bar',
    guests: [
      { first_name: 'Marlon', last_name: '', is_primary: true },
      { first_name: 'Guest 2', last_name: '(Marlon Plus-One)', is_primary: false }
    ]
  },

  // ==========================================
  // TABLE 14: (A) Friends - Peter, Loredana, Chris & Trevor (10 guests)
  // ==========================================
  {
    party_name: 'Peter',
    code: 'PETER-4648',
    phone: '+1 (949) 444-4648',
    total_invited: 4,
    table_id: 'table-14',
    tag: 'friends_bar',
    guests: [
      { first_name: 'Peter', last_name: '', is_primary: true, phone: '+1 (949) 444-4648' },
      { first_name: 'Guest 2', last_name: '(Peter Group)', is_primary: false },
      { first_name: 'Guest 3', last_name: '(Peter Group)', is_primary: false },
      { first_name: 'Guest 4', last_name: '(Peter Group)', is_primary: false }
    ]
  },
  {
    party_name: 'Loredana',
    code: 'LOREDANA-4649',
    phone: '+1 (949) 444-4649',
    total_invited: 2,
    table_id: 'table-14',
    tag: 'friends_bar',
    guests: [
      { first_name: 'Loredana', last_name: '', is_primary: true, phone: '+1 (949) 444-4649' },
      { first_name: 'Guest 2', last_name: '(Loredana Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: 'Chris',
    code: 'CHRIS-8968',
    phone: '(626) 524-8968',
    total_invited: 2,
    table_id: 'table-14',
    tag: 'friends_bar',
    guests: [
      { first_name: 'Chris', last_name: '', is_primary: true, phone: '(626) 524-8968' },
      { first_name: 'Guest 2', last_name: '(Chris Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: 'Trevor',
    code: 'TREVOR-5829',
    phone: '+1 (626) 533-5829',
    total_invited: 2,
    table_id: 'table-14',
    tag: 'friends_bar',
    guests: [
      { first_name: 'Trevor', last_name: '', is_primary: true, phone: '+1 (626) 533-5829' },
      { first_name: 'Guest 2', last_name: '(Trevor Plus-One)', is_primary: false }
    ]
  },

  // ==========================================
  // TABLE 15: (A) Friends - Daniel, Gary, Aaron & Bailey (8 guests, 2 open)
  // ==========================================
  {
    party_name: 'Daniel & Carol',
    code: 'DANIEL-9818',
    phone: '+1 (857) 413-9818',
    total_invited: 2,
    table_id: 'table-15',
    tag: 'friends_bar',
    guests: [
      { first_name: 'Daniel', last_name: '', is_primary: true, phone: '+1 (857) 413-9818' },
      { first_name: 'Carol', last_name: "(Daniel's Wife)", is_primary: false }
    ]
  },
  {
    party_name: 'Gary & Valerie',
    code: 'GARY-6098',
    phone: '+1 (857) 399-6098',
    total_invited: 2,
    table_id: 'table-15',
    tag: 'friends_bar',
    guests: [
      { first_name: 'Gary', last_name: '', is_primary: true, phone: '+1 (857) 399-6098' },
      { first_name: 'Valerie', last_name: '(Gary GF)', is_primary: false }
    ]
  },
  {
    party_name: 'Aaron',
    code: 'AARON-3121',
    phone: '+1 (909) 538-3121',
    total_invited: 2,
    table_id: 'table-15',
    tag: 'friends_bar',
    guests: [
      { first_name: 'Aaron', last_name: '', is_primary: true, phone: '+1 (909) 538-3121' },
      { first_name: 'Guest 2', last_name: '(Aaron Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: 'Bailey',
    code: 'BAILEY-5686',
    phone: '936-777-5686',
    total_invited: 2,
    table_id: 'table-15',
    tag: 'friends_bar',
    guests: [
      { first_name: 'Bailey', last_name: '', is_primary: true, phone: '936-777-5686' },
      { first_name: 'Guest 2', last_name: '(Bailey Plus-One)', is_primary: false }
    ]
  },

  // ==========================================
  // TABLE 16: (A) Friends - Abraham, Verenisse, Einar, Annet, Bertha (10 guests)
  // ==========================================
  {
    party_name: 'Abraham',
    code: 'ABRAHAM-7994',
    phone: '+1 (323) 537-7994',
    total_invited: 2,
    table_id: 'table-16',
    tag: 'friends_bar',
    notes: 'Alfredo close friend group',
    guests: [
      { first_name: 'Abraham', last_name: '', is_primary: true, phone: '+1 (323) 537-7994' },
      { first_name: 'Guest 2', last_name: '(Abraham Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: 'Verenisse',
    code: 'VERENISSE-9065',
    phone: '(619) 490-9065',
    total_invited: 2,
    table_id: 'table-16',
    tag: 'friends_bar',
    notes: 'Alfredo close friend group',
    guests: [
      { first_name: 'Verenisse', last_name: '', is_primary: true, phone: '(619) 490-9065' },
      { first_name: 'Guest 2', last_name: '(Verenisse Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: 'Einar',
    code: 'EINAR-9400',
    phone: '(323) 745-9400',
    total_invited: 2,
    table_id: 'table-16',
    tag: 'friends_bar',
    notes: 'Alfredo close friend group',
    guests: [
      { first_name: 'Einar', last_name: '', is_primary: true, phone: '(323) 745-9400' },
      { first_name: 'Guest 2', last_name: '(Einar Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: 'Annet',
    code: 'ANNET-3212',
    phone: '(562) 500-3212',
    total_invited: 2,
    table_id: 'table-16',
    tag: 'friends_bar',
    notes: 'Alfredo close friend group',
    guests: [
      { first_name: 'Annet', last_name: '', is_primary: true, phone: '(562) 500-3212' },
      { first_name: 'Guest 2', last_name: '(Annet Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: 'Bertha',
    code: 'BERTHA-0122',
    phone: '(619) 638-0122',
    total_invited: 2,
    table_id: 'table-16',
    tag: 'friends_bar',
    notes: 'Alfredo close friend group',
    guests: [
      { first_name: 'Bertha', last_name: '', is_primary: true, phone: '(619) 638-0122' },
      { first_name: 'Guest 2', last_name: '(Bertha Plus-One)', is_primary: false }
    ]
  },

  // ==========================================
  // TABLE 17: (A) Friends - Steven Awada, Carolina Franco, Ariadni, Arturo (8 guests, 2 open)
  // ==========================================
  {
    party_name: 'Steven Awada',
    code: 'STEVEN-4937',
    phone: '+1 (562) 805-4937',
    total_invited: 2,
    table_id: 'table-17',
    tag: 'friends_bar',
    guests: [
      { first_name: 'Steven', last_name: 'Awada', is_primary: true, phone: '+1 (562) 805-4937' },
      { first_name: 'Guest 2', last_name: '(Steven Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: 'Carolina Franco',
    code: 'CAROLINA-0007',
    phone: '+1 (814) 935-0007',
    total_invited: 2,
    table_id: 'table-17',
    tag: 'friends_bar',
    guests: [
      { first_name: 'Carolina', last_name: 'Franco', is_primary: true, phone: '+1 (814) 935-0007' },
      { first_name: 'Guest 2', last_name: '(Carolina Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: 'Ariadni',
    code: 'ARIADNI-9586',
    phone: '(747) 243-9586',
    total_invited: 2,
    table_id: 'table-17',
    tag: 'friends_bar',
    guests: [
      { first_name: 'Ariadni', last_name: '', is_primary: true, phone: '(747) 243-9586' },
      { first_name: 'Guest 2', last_name: '(Ariadni Plus-One)', is_primary: false }
    ]
  },
  {
    party_name: 'Arturo Seijas',
    code: 'ARTURO-5352',
    phone: '+1 (219) 323-5352',
    total_invited: 2,
    table_id: 'table-17',
    tag: 'friends_bar',
    guests: [
      { first_name: 'Arturo', last_name: 'Seijas', is_primary: true, phone: '+1 (219) 323-5352' },
      { first_name: 'Guest 2', last_name: '(Arturo Plus-One)', is_primary: false }
    ]
  }
];

async function runIngestion() {
  console.log('====================================================');
  console.log('  WEDDING GUEST LIST INGESTION & SEATING PIPELINE   ');
  console.log('====================================================');

  // Verify Counts
  let totalPartiesPlanned = PARTIES_PLAN.length;
  let totalGuestsPlanned = PARTIES_PLAN.reduce((sum, p) => sum + p.guests.length, 0);
  let totalSeatsPlanned = PARTIES_PLAN.reduce((sum, p) => sum + p.total_invited, 0);

  console.log(`Parties to create: ${totalPartiesPlanned}`);
  console.log(`Guests to create:  ${totalGuestsPlanned}`);
  console.log(`Total Invited:     ${totalSeatsPlanned}`);

  if (totalGuestsPlanned !== 162 || totalSeatsPlanned !== 162) {
    console.error(`ERROR: Planned total (${totalGuestsPlanned}) does not match 162!`);
    process.exit(1);
  }

  // Check table capacities
  const tableCounts = {};
  PARTIES_PLAN.forEach(p => {
    tableCounts[p.table_id] = (tableCounts[p.table_id] || 0) + p.guests.length;
  });

  console.log('\n[AUDIT] Seat Allocations per Table:');
  for (const t of TABLES_CONFIG) {
    const c = tableCounts[t.id] || 0;
    console.log(`  ${t.id.padEnd(10)}: ${c}/10 seats | ${c === 10 ? 'FULL' : `${10 - c} open`} | ${t.name}`);
    if (c > 10) {
      console.error(`ERROR: Table ${t.id} exceeds capacity of 10! (${c})`);
      process.exit(1);
    }
  }

  // 1. Sync Tables in Supabase
  console.log('\n[STEP 1] Syncing 17 Tables to Supabase...');
  // Delete existing tables to guarantee clean table_number ordering
  await supabase.from('guests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('parties').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('tables').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const { error: tErr } = await supabase.from('tables').insert(TABLES_CONFIG);
  if (tErr) {
    console.error('Failed to insert tables:', tErr);
    process.exit(1);
  }
  console.log('✓ Successfully created 17 tables in Supabase.');

  // 2. Insert Parties and Guests
  console.log('\n[STEP 2] Ingesting Parties & Seating Guests...');
  const now = new Date().toISOString();
  const dbParties = [];
  const dbGuests = [];

  const tableSeatTrackers = {};

  PARTIES_PLAN.forEach((p, pIdx) => {
    const partyId = `party-${String(pIdx + 1).padStart(3, '0')}`;
    dbParties.push({
      id: partyId,
      primary_guest_name: p.party_name,
      invitation_code: p.code,
      total_invited: p.total_invited,
      contact_phone: p.phone || null,
      contact_email: p.email || null,
      notes: p.notes || null,
      created_at: now
    });

    p.guests.forEach((g, gIdx) => {
      const guestId = `guest-${String(pIdx + 1).padStart(3, '0')}-${gIdx + 1}`;
      tableSeatTrackers[p.table_id] = (tableSeatTrackers[p.table_id] || 0) + 1;
      const seatNumber = tableSeatTrackers[p.table_id];

      dbGuests.push({
        id: guestId,
        party_id: partyId,
        first_name: g.first_name,
        last_name: g.last_name,
        phone: g.phone || (g.is_primary ? p.phone : null) || null,
        email: g.email || (g.is_primary ? p.email : null) || null,
        rsvp_status: 'pending',
        headcount: 1,
        dietary_restrictions: [],
        dietary_notes: null,
        song_request: null,
        notes: null,
        table_id: p.table_id,
        table_seat_number: seatNumber,
        is_primary_contact: !!g.is_primary,
        relationship_tag: p.tag || 'general',
        plus_one_names: [],
        created_at: now,
        updated_at: now
      });
    });
  });

  // Batch insert parties
  const { error: pErr } = await supabase.from('parties').insert(dbParties);
  if (pErr) {
    console.error('Failed to insert parties:', pErr);
    process.exit(1);
  }
  console.log(`✓ Inserted ${dbParties.length} Parties into Supabase.`);

  // Batch insert guests (in chunks of 50 to avoid size limits)
  const chunkSize = 50;
  for (let i = 0; i < dbGuests.length; i += chunkSize) {
    const chunk = dbGuests.slice(i, i + chunkSize);
    const { error: gErr } = await supabase.from('guests').insert(chunk);
    if (gErr) {
      console.error(`Failed to insert guests chunk ${i}:`, gErr);
      process.exit(1);
    }
  }
  console.log(`✓ Inserted ${dbGuests.length} Guests into Supabase.`);

  // 3. Update Local Cache (.data/db.json)
  const localDbPath = path.join(process.cwd(), '.data', 'db.json');
  if (fs.existsSync(localDbPath)) {
    try {
      const localState = JSON.parse(fs.readFileSync(localDbPath, 'utf-8'));
      localState.tables = TABLES_CONFIG;
      localState.parties = dbParties;
      localState.guests = dbGuests;
      fs.writeFileSync(localDbPath, JSON.stringify(localState, null, 2), 'utf-8');
      console.log('✓ Updated local cache in .data/db.json.');
    } catch (e) {
      console.warn('Could not update .data/db.json:', e);
    }
  }

  // 4. Verification Check
  console.log('\n[STEP 3] Verifying Live Cloud Records...');
  const { count: partyCount } = await supabase.from('parties').select('*', { count: 'exact', head: true });
  const { count: guestCount } = await supabase.from('guests').select('*', { count: 'exact', head: true });
  const { count: tableCount } = await supabase.from('tables').select('*', { count: 'exact', head: true });

  console.log(`  - Parties in DB: ${partyCount}`);
  console.log(`  - Guests in DB:  ${guestCount}`);
  console.log(`  - Tables in DB:  ${tableCount}`);

  console.log('\nSample Invitation Links:');
  const samples = [dbParties[0], dbParties[1], dbParties[4], dbParties[5], dbParties[18], dbParties[dbParties.length - 1]];
  samples.forEach(p => {
    console.log(`  • ${p.primary_guest_name} [${p.invitation_code}]: https://wedding.au-tomato.com/rsvp?invite=${p.invitation_code}`);
  });

  console.log('\n====================================================');
  console.log('     INGESTION & SEATING SETUP COMPLETE (100%)      ');
  console.log('====================================================');
}

runIngestion().catch(console.error);
