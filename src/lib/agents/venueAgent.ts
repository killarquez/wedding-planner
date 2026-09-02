import { VenueSourcingResult } from '../types';
import { WeddingDB } from '../db';

export interface VenueSearchCriteria {
  city: string;
  expectedGuests: number;
  tablesNeeded: number;
  hostSuppliedDrinks: boolean;
  asianBanquetCourses: number; // 8 or 10
  requireAvStage: boolean;
  budgetPerTableMax: number;
}

export class VenueSourcingAgent {
  public static async searchAndRankVenues(criteria: VenueSearchCriteria): Promise<VenueSourcingResult[]> {
    // Sourcing database / heuristic engine
    const candidates: Array<Omit<VenueSourcingResult, 'score' | 'inquiry_email_draft_en' | 'inquiry_email_draft_vi'>> = [
      {
        id: `venue-${Date.now()}-1`,
        name: 'The Grand Pearl Palace & Pavilion',
        location: `${criteria.city || 'Westminster'}, CA (Little Saigon Hub)`,
        max_capacity_guests: 350,
        ten_top_tables_capacity: 35,
        allows_host_supplied_alcohol: true,
        corkage_policy: '$15/bottle or $250 flat unlimited per table package; glassware & ice service included',
        asian_banquet_capable: true,
        menu_starting_price_per_table: 720,
        av_stage_included: true,
        notes: 'Exceptional 8-10 course Cantonese/Vietnamese banquet chef, majestic chandeliers, stage with LED backdrop.',
        contact_email: 'banquets@grandpearlpalace.com',
        contact_phone: '+1 (714) 898-8888'
      },
      {
        id: `venue-${Date.now()}-2`,
        name: 'Dragon Palace Imperial Banquet Hall',
        location: 'Garden Grove, CA',
        max_capacity_guests: 400,
        ten_top_tables_capacity: 40,
        allows_host_supplied_alcohol: true,
        corkage_policy: '$20/bottle corkage fee; complimentary champagne flute service',
        asian_banquet_capable: true,
        menu_starting_price_per_table: 680,
        av_stage_included: true,
        notes: 'Renowned for live lobster and seafood banquet courses, spacious dance floor.',
        contact_email: 'events@dragonpalaceoc.com',
        contact_phone: '+1 (714) 539-9988'
      },
      {
        id: `venue-${Date.now()}-3`,
        name: 'The Crown Pavilion & Garden Ballroom',
        location: 'Costa Mesa, CA',
        max_capacity_guests: 250,
        ten_top_tables_capacity: 25,
        allows_host_supplied_alcohol: true,
        corkage_policy: '$30/bottle corkage fee; outside catering kitchen fee applicable',
        asian_banquet_capable: true,
        menu_starting_price_per_table: 950,
        av_stage_included: false,
        notes: 'Modern luxury aesthetic with outdoor cocktail garden terrace, requires outside Asian catering partner.',
        contact_email: 'weddings@crownpavilionoc.com',
        contact_phone: '+1 (949) 755-1234'
      },
      {
        id: `venue-${Date.now()}-4`,
        name: 'Seafood Cove Prime Banquet Center',
        location: 'Westminster / Fountain Valley, CA',
        max_capacity_guests: 300,
        ten_top_tables_capacity: 30,
        allows_host_supplied_alcohol: true,
        corkage_policy: '$12/bottle flat rate; couples allowed to bring Hennessy XO and wine cases directly',
        asian_banquet_capable: true,
        menu_starting_price_per_table: 700,
        av_stage_included: true,
        notes: 'High-pacing banquet service, famous Peking Duck & Walnut Shrimp, great acoustics for live DJ.',
        contact_email: 'banquets@seafoodcoveprime.com',
        contact_phone: '+1 (714) 531-3800'
      }
    ];

    // Score candidates based on constraints
    const rankedResults: VenueSourcingResult[] = candidates.map(venue => {
      let score = 70;
      if (venue.asian_banquet_capable) score += 10;
      if (venue.allows_host_supplied_alcohol) score += 10;
      if (venue.av_stage_included === criteria.requireAvStage) score += 5;
      if (venue.ten_top_tables_capacity >= criteria.tablesNeeded) score += 5;
      if (venue.menu_starting_price_per_table <= criteria.budgetPerTableMax) score += 5;

      const emailEn = `Subject: Banquet Inquiry for Sequel Wedding (Dec 5, 2026) - Trang & Alfredo\n\nDear ${venue.name} Event Team,\n\nWe are planning our Sequel Wedding Celebration on Saturday, December 5, 2026 for approximately ${criteria.expectedGuests} guests (${criteria.tablesNeeded} ten-top round tables).\n\nWe would like to request detailed package options for your ${criteria.asianBanquetCourses}-Course Grand Banquet menu. As we are supplying our own premium spirits (Hennessy XO table toasting bottles and fine wine), please confirm your corkage arrangements (${venue.corkage_policy}), glassware provision, and bartending service.\n\nCould you also share your banquet pacing timeline, audio/visual setup options, and available booking dates?\n\nWarm regards,\nTrang & Alfredo\nContact: wedding@trangandalfredo.com | +1 (714) 555-0100`;

      const emailVi = `Tiêu đề: Đặt Tiệc Báo Hỷ Ngày 05/12/2026 - Trang & Alfredo\n\nKính gửi Ban Quản Lý Yến Tiệc ${venue.name},\n\nChúng tôi dự kiến tổ chức Dạ Tiệc Báo Hỷ vào Thứ Bảy, ngày 05/12/2026 với quy mô khoảng ${criteria.expectedGuests} khách (${criteria.tablesNeeded} bàn tròn 10 người).\n\nChúng tôi rất quan tâm đến thực đơn Dạ Yến ${criteria.asianBanquetCourses} món Á Đông cao cấp. Do gia đình sẽ tự chuẩn bị rượu ngoại (Hennessy XO để Chào Bàn và rượu vang), kính mong Quý Nhà Hàng thông tin chi tiết về chính sách phí phục vụ đồ uống, thời gian lên món và hỗ trợ sân khấu âm thanh.\n\nTrân trọng cảm ơn,\nTrang & Alfredo`;

      return {
        ...venue,
        score: Math.min(100, score),
        inquiry_email_draft_en: emailEn,
        inquiry_email_draft_vi: emailVi
      };
    });

    // Sort descending by score
    rankedResults.sort((a, b) => b.score - a.score);

    // Save top result to DB
    WeddingDB.addAgentLog('Venue Sourcing Agent', `Sourced and evaluated ${rankedResults.length} venues for ${criteria.tablesNeeded} tables in ${criteria.city}`);

    return rankedResults;
  }
}
