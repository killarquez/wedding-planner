import { Resend } from 'resend';
import { Party, Guest } from '../types';
import { generateWeddingIcsFile } from '../calendar';

let resendInstance: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export interface SendRsvpEmailParams {
  party: Party;
  primaryGuest: Guest;
  allGuests: Guest[];
  attendingCount: number;
  recipientEmail: string;
}

export async function sendRsvpConfirmationEmail(params: SendRsvpEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const resend = getResendClient();
  if (!resend) {
    console.log('[Email Dispatcher] Resend API key not configured. Skipping email.');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const { party, primaryGuest, allGuests, attendingCount, recipientEmail } = params;
  if (!recipientEmail || !recipientEmail.includes('@')) {
    return { success: false, error: 'Invalid recipient email' };
  }

  const isAttending = attendingCount > 0;
  const primaryName = `${primaryGuest.first_name || ''} ${primaryGuest.last_name || ''}`.trim() || party.primary_guest_name;
  const attendingGuests = allGuests.filter(g => g.rsvp_status === 'attending');
  const attendingNames = attendingGuests.map(g => `${g.first_name || ''} ${g.last_name || ''}`.trim()).filter(Boolean);

  // Subject line
  const subject = isAttending
    ? `RSVP Confirmed: See You Dec 20, 2026! | Trang & Alfredo's Wedding`
    : `Thank You for Letting Us Know | Trang & Alfredo's Wedding`;

  // Generate .ics calendar data
  const icsContent = generateWeddingIcsFile(primaryName);
  const icsBase64 = Buffer.from(icsContent).toString('base64');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wedding.au-tomato.com';
  const rsvpLink = `${siteUrl}/rsvp?invite=${encodeURIComponent(party.invitation_code)}`;

  // High-End Luxury HTML Email Template
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #F6F3EE; font-family: 'Georgia', 'Times New Roman', serif; color: #1C1917;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 2px solid #C59A3F; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08);">
    <!-- Crimson Header Ribbon -->
    <tr>
      <td style="background: linear-gradient(135deg, #881328 0%, #600817 100%); padding: 28px 24px; text-align: center; border-bottom: 2px solid #D4AF37;">
        <div style="font-size: 26px; color: #E7C878; font-weight: bold; margin-bottom: 4px;">囍</div>
        <h1 style="margin: 0; color: #FFF8E7; font-size: 22px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
          Trang & Alfredo's Wedding
        </h1>
        <p style="margin: 6px 0 0 0; color: #FFD4D8; font-size: 13px; font-family: sans-serif; letter-spacing: 0.5px;">
          Sunday, December 20, 2026 • Temple City, California
        </p>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px 28px;">
        <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #781A2D; text-align: center;">
          ${isAttending ? "You're Confirmed! / Đã Nhận Xác Nhận!" : "We Will Miss You! / Cảm Ơn Phản Hồi Của Bạn"}
        </h2>

        <p style="font-size: 15px; line-height: 1.6; color: #333333; margin-bottom: 20px;">
          Dear <strong>${primaryName}</strong>,
        </p>

        <p style="font-size: 15px; line-height: 1.6; color: #333333; margin-bottom: 24px;">
          ${isAttending 
            ? "We are overjoyed to celebrate our wedding banquet with you! Your party attendance has been recorded in our reservation system. Below are your event details and attached calendar invite."
            : "Thank you for letting us know that you won't be able to make it. While we will dearly miss your presence on December 20, we truly appreciate your warm thoughts and heartfelt blessings!"}
        </p>

        ${isAttending ? `
        <!-- Party Details Box -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF6EE; border: 1px solid #E5D8B8; border-radius: 12px; margin-bottom: 24px; padding: 18px 20px;">
          <tr>
            <td style="padding-bottom: 10px; font-size: 12px; font-family: sans-serif; color: #8C6D23; font-weight: bold; text-transform: uppercase;">
              Party Reservation Pass
            </td>
            <td style="padding-bottom: 10px; font-size: 12px; font-family: monospace; color: #78350F; font-weight: bold; text-align: right;">
              CODE: ${party.invitation_code}
            </td>
          </tr>
          <tr>
            <td colspan="2" style="border-top: 1px dashed #D9C59B; padding-top: 12px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 14px; font-family: sans-serif;">
                <tr>
                  <td style="color: #666666; width: 40%;">Confirmed Headcount:</td>
                  <td style="color: #065F46; font-weight: bold;">✓ ${attendingCount} Guest${attendingCount > 1 ? 's' : ''} Attending</td>
                </tr>
                <tr>
                  <td style="color: #666666; vertical-align: top;">Party Attendees:</td>
                  <td style="color: #1F2937; font-weight: 600;">${attendingNames.join(', ') || primaryName}</td>
                </tr>
                <tr>
                  <td style="color: #666666;">Date & Time:</td>
                  <td style="color: #1F2937; font-weight: 600;">Dec 20, 2026 @ 5:30 PM Reception</td>
                </tr>
                <tr>
                  <td style="color: #666666; vertical-align: top;">Banquet Venue:</td>
                  <td style="color: #1F2937; font-weight: 600;">
                    <a href="https://www.google.com/maps/search/?api=1&query=Grand+Harbor+Restaurant,+5733+Rosemead+Blvd,+Temple+City,+CA+91780" target="_blank" rel="noopener noreferrer" style="color: #881328; text-decoration: underline; font-weight: bold;">
                      Grand Harbor Restaurant ↗
                    </a><br>
                    <span style="font-size: 12px; color: #666666; font-weight: normal;">5733 Rosemead Blvd., Temple City, CA 91780</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        ` : ''}

        <!-- Call to Action Button -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
          <tr>
            <td align="center">
              <a href="${rsvpLink}" style="display: inline-block; background: #881328; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: bold; font-family: sans-serif; padding: 14px 28px; border-radius: 10px; border: 1px solid #D4AF37; box-shadow: 0 4px 10px rgba(136,19,40,0.25);">
                View Your Digital Invitation Pass →
              </a>
            </td>
          </tr>
        </table>

        <!-- Bilingual Vietnamese Note -->
        <div style="background-color: #FBF9F5; border-left: 3px solid #C59A3F; padding: 14px 16px; border-radius: 4px; font-size: 13px; color: #555555; line-height: 1.5; font-style: italic;">
          ${isAttending 
            ? "Chúng mình rất mong chờ được đón tiếp và nâng ly chúc mừng cùng bạn và gia đình vào Chủ Nhật, 20/12/2026 tại Nhà Hàng Grand Harbor! File lịch (.ics) đã được đính kèm để bạn tiện lưu vào điện thoại."
            : "Trang và Alfredo xin chân thành cảm ơn phản hồi của bạn. Chúng mình luôn trân quý tình cảm và lời chúc phúc của bạn!"}
        </div>

        <p style="margin-top: 28px; font-size: 14px; color: #78350F; text-align: center; font-style: italic;">
          With all our love & gratitude,<br>
          <strong style="font-size: 16px; color: #881328; font-style: normal;">Trang & Alfredo</strong>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #F8F5EE; padding: 18px 24px; text-align: center; border-top: 1px solid #E5D6B5; font-family: sans-serif; font-size: 11px; color: #78716C;">
        Trang & Alfredo's Wedding Celebration • December 20, 2026<br>
        If you have any questions, feel free to reply directly to this email!
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // Try configured sender, with graceful fallback to onboarding@resend.dev if domain not yet verified
  const fromAddresses = [
    process.env.RESEND_FROM_EMAIL || 'Trang & Alfredo <wedding@au-tomato.com>',
    'Trang & Alfredo <onboarding@resend.dev>'
  ];

  for (const fromAddr of fromAddresses) {
    try {
      const attachments = isAttending ? [
        {
          filename: `Trang_Alfredo_Wedding_${party.invitation_code}.ics`,
          content: icsBase64
        }
      ] : [];

      const { data, error } = await resend.emails.send({
        from: fromAddr,
        to: [recipientEmail],
        subject: subject,
        html: html,
        attachments: attachments
      });

      if (error) {
        console.warn(`[Email Dispatcher] Failed with sender ${fromAddr}:`, error.message);
        // If domain verification error, loop to try onboarding@resend.dev fallback
        if (error.message.includes('domain') || error.message.includes('verify')) {
          continue;
        }
        return { success: false, error: error.message };
      }

      console.log(`[Email Dispatcher] Successfully sent RSVP confirmation to ${recipientEmail} via ${fromAddr}. ID: ${data?.id}`);
      return { success: true, messageId: data?.id };
    } catch (e: any) {
      console.warn(`[Email Dispatcher] Exception sending with ${fromAddr}:`, e.message);
    }
  }

  return { success: false, error: 'Could not deliver email with available senders' };
}
