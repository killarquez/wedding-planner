export type RsvpStatus = 'attending' | 'declined' | 'pending';

export type TableHierarchy = 'vip_family' | 'extended_relatives' | 'friends_bar' | 'general';

export interface Guest {
  id: string;
  party_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  rsvp_status: RsvpStatus;
  headcount: number;
  dietary_restrictions: string[]; // e.g. ['Vegetarian', 'Nut Allergy', 'Shellfish Allergy', 'Halal']
  dietary_notes?: string;
  song_request?: string;
  notes?: string;
  table_id?: string | null;
  table_seat_number?: number | null;
  is_primary_contact: boolean;
  relationship_tag: TableHierarchy;
  plus_one_names?: string[];
  created_at: string;
  updated_at: string;
}

export interface Party {
  id: string;
  primary_guest_name: string;
  invitation_code: string;
  total_invited: number;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  created_at: string;
}

export interface Table {
  id: string;
  table_number: number;
  name: string; // e.g., "Table 1: Trưởng Bối & VIP Family"
  capacity: number; // standard 10
  hierarchy_tag: TableHierarchy;
  stage_position: 'stage_front_left' | 'stage_front_right' | 'center' | 'near_bar' | 'back';
  assigned_count?: number;
  guests?: Guest[];
}

export type ExpenseCategory =
  | 'venue_banquet'
  | 'host_beverages_corkage'
  | 'attire'
  | 'stage_av_dj'
  | 'decor_floral'
  | 'photography_video'
  | 'gifts_favors'
  | 'misc';

export type PaymentStatus = 'pending' | 'paid' | 'overdue';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  vendor_name: string;
  item_description: string;
  estimated_cost: number;
  actual_invoiced: number;
  deposit_paid: number;
  remaining_balance: number;
  payment_due_date: string; // YYYY-MM-DD
  payment_status: PaymentStatus;
  notes?: string;
  created_at: string;
}

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';
export type MilestonePriority = 'low' | 'medium' | 'high' | 'critical';

export interface Milestone {
  id: string;
  title_en: string;
  title_vi: string;
  category: 'venue' | 'attire' | 'guest_rsvp' | 'logistics' | 'beverage' | 'ceremony';
  target_date: string; // YYYY-MM-DD
  status: MilestoneStatus;
  priority: MilestonePriority;
  dependencies?: string[];
  assignee: 'Alfredo & Partner' | 'Best Man / Groomsmen' | 'Maid of Honor / Bridesmaids' | 'Family Elders';
  cultural_notes?: string;
  updated_at: string;
}

export interface SongRequest {
  id: string;
  guest_name: string;
  song_title: string;
  artist: string;
  genre: 'vpop' | 'edm_dance' | 'romantic_ballad' | 'viet_bolero' | 'hiphop_rnb' | '90s_2000s_classics' | 'other';
  notes?: string;
  status: 'queued' | 'played' | 'banned';
  created_at: string;
}

export interface VenueSourcingResult {
  id: string;
  name: string;
  location: string;
  max_capacity_guests: number;
  ten_top_tables_capacity: number;
  allows_host_supplied_alcohol: boolean;
  corkage_policy: string; // e.g. "$15/bottle or $250 flat table fee, includes glassware & bartenders"
  asian_banquet_capable: boolean; // 8-10 course menus
  menu_starting_price_per_table: number; // e.g., 680 - 1200 / table
  av_stage_included: boolean;
  score: number; // 0-100
  notes: string;
  contact_email: string;
  contact_phone: string;
  inquiry_email_draft_en: string;
  inquiry_email_draft_vi: string;
}

export interface DailyBriefing {
  date: string;
  days_until_wedding: number;
  rsvp_summary: {
    total_invited: number;
    confirmed_attending: number;
    declined: number;
    pending: number;
    total_parties: number;
  };
  banquet_math: {
    confirmed_headcount: number;
    required_10_top_tables: number;
    empty_seats: number;
    fill_rate_percent: number;
  };
  financial_alerts: {
    total_budget: number;
    total_invoiced: number;
    total_paid: number;
    remaining_balance: number;
    due_within_7_days: Expense[];
    due_within_14_days: Expense[];
    due_within_30_days: Expense[];
  };
  critical_milestones: {
    overdue: Milestone[];
    upcoming_sprint: Milestone[];
  };
  agent_actions_taken: string[];
  chaser_recommendations: {
    pending_guest_count: number;
    t21_candidates: Guest[];
    t7_candidates: Guest[];
  };
}
