import { Guest, Party, SongRequest } from '../types';
import { WeddingDB } from '../db';
import { generateWeddingIcsFile } from '../calendar';

export interface RsvpAgentResponse {
  emailConfirmation: {
    subjectEn: string;
    bodyEn: string;
    subjectVi: string;
    bodyVi: string;
  };
  smsNotification: {
    messageEn: string;
    messageVi: string;
  };
  icsData: string;
  dietaryAlertRouted: boolean;
  dietaryAlertDetails?: string[];
  djSongQueued: boolean;
  djSongTitle?: string;
  suggestedTableTag: string;
}

export class RsvpPipelineAgent {
  public static async processRsvpSubmission(
    party: Party,
    primaryGuest: Guest,
    plusOnes: Guest[]
  ): Promise<RsvpAgentResponse> {
    const isAttending = primaryGuest.rsvp_status === 'attending';
    const totalGuests = 1 + plusOnes.length;
    const guestNames = [
      `${primaryGuest.first_name} ${primaryGuest.last_name}`.trim(),
      ...plusOnes.map(p => `${p.first_name} ${p.last_name}`.trim())
    ];

    // 1. Dietary Alert Routing to Banquet Module
    const allDietary = [
      ...primaryGuest.dietary_restrictions,
      ...plusOnes.flatMap(p => p.dietary_restrictions)
    ];
    const dietaryNotes = [primaryGuest.dietary_notes, ...plusOnes.map(p => p.dietary_notes)].filter(Boolean);
    const hasDietaryAlerts = allDietary.length > 0 || dietaryNotes.length > 0;

    if (hasDietaryAlerts && isAttending) {
      WeddingDB.addAgentLog(
        'RSVP Pipeline Agent',
        `Dietary Alert routed to Banquet Kitchen for party "${party.primary_guest_name}": ${allDietary.join(', ')} ${dietaryNotes.join('; ')}`
      );
    }

    // 2. DJ Cue Routing
    const hasSong = !!(primaryGuest.song_request && primaryGuest.song_request.trim());
    if (hasSong && isAttending) {
      WeddingDB.addAgentLog(
        'RSVP Pipeline Agent',
        `DJ Song Queued from ${primaryGuest.first_name}: "${primaryGuest.song_request}"`
      );
    }

    // 3. Draft Confirmation Copies
    const subjectEn = isAttending
      ? `RSVP Confirmed: See You Dec 20, 2026! | Trang & Alfredo's Wedding Celebration`
      : `Thank You for Your RSVP | Trang & Alfredo's Wedding Celebration`;

    const bodyEn = isAttending
      ? `Dear ${primaryGuest.first_name},\n\nWe are overjoyed to confirm your RSVP for Trang & Alfredo's Wedding Celebration on Sunday, December 20, 2026!\n\nParty Details:\n- Primary Guest: ${primaryGuest.first_name} ${primaryGuest.last_name}\n- Confirmed Headcount: ${totalGuests} guest(s) (${guestNames.join(', ')})\n- Seating Section: ${primaryGuest.relationship_tag.replace('_', ' ').toUpperCase()}\n- Venue: Grand Harbor Restaurant, 5733 Rosemead Blvd., Temple City, CA 91780\n- Schedule: 5:30 PM Welcome Reception | 6:30 PM Banquet & Wedding Program\n- Dress Code: Traditional Áo Dài, Festive Glam, or Semi-Formal\n- Drinks: Full Host-Supplied Bar & Table Toasting Cognac\n\nYour calendar invite (.ics) is attached. We cannot wait to raise a glass with you!\n\nWith love,\nTrang & Alfredo`
      : `Dear ${primaryGuest.first_name},\n\nThank you for letting us know that you won't be able to make it. While we will deeply miss your presence on December 20, 2026, we appreciate your warm thoughts and wishes!\n\nWith warmest regards,\nTrang & Alfredo`;

    const subjectVi = isAttending
      ? `Xác Nhận Tham Dự: Hẹn Gặp Bạn Ngày 20/12/2026! | Tiệc Cưới Trang & Alfredo`
      : `Cảm Ơn Phản Hồi Của Quý Khách | Tiệc Cưới Trang & Alfredo`;

    const bodyVi = isAttending
      ? `Kính gửi ${primaryGuest.first_name},\n\nTrang và Alfredo rất vui mừng và vinh hạnh nhận được xác nhận tham dự của bạn cho Dạ Tiệc Cưới vào Chủ Nhật, ngày 20/12/2026!\n\nThông Tin Đặt Bàn:\n- Đại diện: ${primaryGuest.first_name} ${primaryGuest.last_name}\n- Số lượng: ${totalGuests} khách (${guestNames.join(', ')})\n- Địa điểm: Nhà Hàng Grand Harbor, 5733 Rosemead Blvd., Temple City, CA 91780\n- Thời gian: 17:30 Đón Khách & Chụp Ảnh | 18:30 Khai Tiệc & Chương Trình Hôn Lễ\n- Đồ uống & Rượu: Do cô dâu chú rể chiêu đãi trọn vẹn\n\nFile lịch (.ics) đã được đính kèm để bạn tiện lưu vào điện thoại. Hẹn gặp bạn trong đêm tiệc tràn đầy niềm vui!\n\nThân ái,\nTrang & Alfredo`
      : `Kính gửi ${primaryGuest.first_name},\n\nCảm ơn bạn đã phản hồi. Dù rất tiếc không thể đón tiếp bạn trong ngày vui 20/12/2026, chúng mình luôn trân trọng tình cảm và lời chúc của bạn!\n\nThân mến,\nTrang & Alfredo`;

    const smsEn = isAttending
      ? `Hi ${primaryGuest.first_name}! You're confirmed for Trang & Alfredo's Wedding on Dec 20, 2026 (${totalGuests} guest(s)). Can't wait to celebrate with you!`
      : `Hi ${primaryGuest.first_name}, thank you for letting us know about your RSVP. You will be in our thoughts as we celebrate! - Trang & Alfredo`;

    const smsVi = isAttending
      ? `Chào ${primaryGuest.first_name}! Đã nhận xác nhận tham dự Tiệc Cưới Trang & Alfredo ngày 20/12/2026 (${totalGuests} người). Hẹn gặp bạn!`
      : `Chào ${primaryGuest.first_name}, cảm ơn bạn đã báo tin. Chúc bạn luôn an vui và nhiều may mắn! - Trang & Alfredo`;

    const icsData = generateWeddingIcsFile(`${primaryGuest.first_name} ${primaryGuest.last_name}`);

    return {
      emailConfirmation: { subjectEn, bodyEn, subjectVi, bodyVi },
      smsNotification: { messageEn: smsEn, messageVi: smsVi },
      icsData,
      dietaryAlertRouted: hasDietaryAlerts,
      dietaryAlertDetails: allDietary.concat(dietaryNotes.filter(Boolean) as string[]),
      djSongQueued: hasSong,
      djSongTitle: primaryGuest.song_request,
      suggestedTableTag: primaryGuest.relationship_tag
    };
  }
}
