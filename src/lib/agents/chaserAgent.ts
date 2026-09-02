import { Guest, DailyBriefing } from '../types';
import { WeddingDB } from '../db';

export interface ChaserNudgePayload {
  guestId: string;
  guestName: string;
  contactEmail?: string;
  contactPhone?: string;
  nudgeStage: 'T-21' | 'T-7';
  emailSubjectEn: string;
  emailBodyEn: string;
  emailSubjectVi: string;
  emailBodyVi: string;
  smsEn: string;
  smsVi: string;
  directRsvpLink: string;
}

export interface ChaserExecutionReport {
  executionTimestamp: string;
  pendingGuestsScanned: number;
  t21NudgesGenerated: ChaserNudgePayload[];
  t7NudgesGenerated: ChaserNudgePayload[];
  briefing: DailyBriefing;
  statusMessage: string;
}

export class DeadlinesChaserAgent {
  public static async runChaserAndBriefingSimulation(): Promise<ChaserExecutionReport> {
    const guests = WeddingDB.getGuests();
    const pendingPrimaryGuests = guests.filter(g => g.rsvp_status === 'pending' && g.is_primary_contact);

    const t21Nudges: ChaserNudgePayload[] = [];
    const t7Nudges: ChaserNudgePayload[] = [];

    // Cutoff reference: 2026-11-05
    const rsvpCutoffDate = 'November 5, 2026';

    pendingPrimaryGuests.forEach((guest, index) => {
      // Alternate between T-21 and T-7 for demonstration
      const stage: 'T-21' | 'T-7' = index % 2 === 0 ? 'T-21' : 'T-7';
      const daysTextEn = stage === 'T-21' ? '3 weeks' : '7 days';
      const daysTextVi = stage === 'T-21' ? '3 tuần nữa' : '7 ngày nữa';

      const emailSubjectEn = `Friendly Reminder: RSVP for Trang & Alfredo's Wedding (Cutoff ${rsvpCutoffDate})`;
      const emailBodyEn = `Dear ${guest.first_name},\n\nWe hope you are having a wonderful week! We are in the final stages of locking in our 10-top round banquet tables and 8-course dining menu for our Sequel Wedding on December 5, 2026.\n\nThe RSVP deadline is in ${daysTextEn} (${rsvpCutoffDate}). Please let us know if you and your party will be attending so we can reserve your banquet seats and table placement!\n\nRSVP Online in 60 seconds: https://wedding.trangandalfredo.com/#rsvp?code=${guest.party_id}\n\nWarmly,\nTrang & Alfredo`;

      const emailSubjectVi = `Nhắc Nhở Thân Tình: Xác Nhận Tham Dự Tiệc Báo Hỷ Trang & Alfredo (Hạn ${rsvpCutoffDate})`;
      const emailBodyVi = `Kính gửi ${guest.first_name},\n\nChúng mình đang hoàn tất danh sách bàn tròn 10 người và khẩu phần yến tiệc 8 món cho đêm tiệc 05/12/2026 sắp tới.\n\nThời hạn chốt danh sách chỉ còn ${daysTextVi} (${rsvpCutoffDate}). Kính mong bạn dành chút thời gian xác nhận để chúng mình tiện sắp xếp bàn tiệc đón tiếp chu đáo nhất!\n\nXác nhận nhanh tại: https://wedding.trangandalfredo.com/#rsvp?code=${guest.party_id}\n\nThân ái,\nTrang & Alfredo`;

      const smsEn = `Hi ${guest.first_name}! Friendly reminder to RSVP for Trang & Alfredo's Wedding (Dec 5, 2026) by ${rsvpCutoffDate}. Reply YES or NO, or visit https://wedding.trangandalfredo.com/#rsvp`;
      const smsVi = `Chào ${guest.first_name}! Nhắc hẹn thân tình xác nhận tham dự Tiệc Báo Hỷ Trang & Alfredo ngày 05/12/2026 trước ngày ${rsvpCutoffDate}. Vui lòng phản hồi tại https://wedding.trangandalfredo.com/#rsvp`;

      const nudge: ChaserNudgePayload = {
        guestId: guest.id,
        guestName: `${guest.first_name} ${guest.last_name}`.trim(),
        contactEmail: guest.email,
        contactPhone: guest.phone,
        nudgeStage: stage,
        emailSubjectEn,
        emailBodyEn,
        emailSubjectVi,
        emailBodyVi,
        smsEn,
        smsVi,
        directRsvpLink: `https://wedding.trangandalfredo.com/#rsvp?code=${guest.party_id}`
      };

      if (stage === 'T-21') {
        t21Nudges.push(nudge);
      } else {
        t7Nudges.push(nudge);
      }
    });

    const briefing = WeddingDB.generateDailyBriefing();

    WeddingDB.addAgentLog(
      'Deadlines & Chaser Agent',
      `Executed daily scan: ${pendingPrimaryGuests.length} pending parties scanned. Generated ${t21Nudges.length} T-21 nudges, ${t7Nudges.length} T-7 nudges, and refreshed Executive Briefing.`
    );

    return {
      executionTimestamp: new Date().toISOString(),
      pendingGuestsScanned: pendingPrimaryGuests.length,
      t21NudgesGenerated: t21Nudges,
      t7NudgesGenerated: t7Nudges,
      briefing,
      statusMessage: `Successfully executed chaser scan for ${pendingPrimaryGuests.length} pending guests and compiled daily executive briefing.`
    };
  }
}
