import { Party, Guest } from '../types';

export interface DiscordRsvpAlertParams {
  party: Party;
  primaryGuest: Guest;
  allGuests: Guest[];
  attendingCount: number;
  declinedCount: number;
  specialMessage?: string;
  songRequest?: string;
}

export async function sendDiscordRsvpAlert(params: DiscordRsvpAlertParams): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    console.log('[Discord Alert] DISCORD_WEBHOOK_URL not configured. Skipping Discord push.');
    return false;
  }

  const {
    party,
    primaryGuest,
    allGuests,
    attendingCount,
    declinedCount,
    specialMessage,
    songRequest
  } = params;

  const isAttending = attendingCount > 0;
  const primaryName = `${primaryGuest.first_name || ''} ${primaryGuest.last_name || ''}`.trim() || party.primary_guest_name;

  const attendingGuests = allGuests.filter(g => g.rsvp_status === 'attending');
  const attendingNames = attendingGuests.map(g => `${g.first_name || ''} ${g.last_name || ''}`.trim()).filter(Boolean);

  // Collect all dietary restrictions
  const dietaryItems: string[] = [];
  allGuests.forEach(g => {
    const name = `${g.first_name || ''} ${g.last_name || ''}`.trim();
    if (g.dietary_restrictions && g.dietary_restrictions.length > 0) {
      dietaryItems.push(`${name}: ${g.dietary_restrictions.join(', ')}`);
    }
    if (g.dietary_notes) {
      dietaryItems.push(`${name} note: ${g.dietary_notes}`);
    }
  });

  const fields = [
    {
      name: '👤 Primary Guest',
      value: primaryName,
      inline: true
    },
    {
      name: '🎟️ Invite Code',
      value: `\`${party.invitation_code}\``,
      inline: true
    },
    {
      name: '👥 Attendance Status',
      value: isAttending 
        ? `✅ **ATTENDING** (${attendingCount} guest${attendingCount > 1 ? 's' : ''})` 
        : `❌ **DECLINED** (${declinedCount} guest${declinedCount > 1 ? 's' : ''})`,
      inline: true
    }
  ];

  if (isAttending && attendingNames.length > 0) {
    fields.push({
      name: '📋 Attending Roster',
      value: attendingNames.map(n => `• ${n}`).join('\n'),
      inline: false
    });
  }

  if (dietaryItems.length > 0) {
    fields.push({
      name: '🍽️ Dietary & Allergy Flags',
      value: `⚠️ ${dietaryItems.join('\n⚠️ ')}`,
      inline: false
    });
  }

  const song = songRequest || primaryGuest.song_request;
  if (song && song.trim()) {
    fields.push({
      name: '🎵 Requested DJ Track',
      value: `♫ *"${song.trim()}"*`,
      inline: false
    });
  }

  const note = specialMessage || party.special_message;
  if (note && note.trim()) {
    fields.push({
      name: '💬 Message for Trang & Alfredo',
      value: `*"${note.trim()}"*`,
      inline: false
    });
  }

  const contactInfo: string[] = [];
  if (party.contact_phone || primaryGuest.phone) {
    contactInfo.push(`📞 ${party.contact_phone || primaryGuest.phone}`);
  }
  if (party.contact_email || primaryGuest.email) {
    contactInfo.push(`✉️ ${party.contact_email || primaryGuest.email}`);
  }
  if (contactInfo.length > 0) {
    fields.push({
      name: '📱 Contact Information',
      value: contactInfo.join('  •  '),
      inline: false
    });
  }

  const embed = {
    title: isAttending 
      ? `🎉 New RSVP: ${primaryName} is Attending! (${attendingCount} Guests)`
      : `💌 RSVP Update: ${primaryName} Regretfully Cannot Attend`,
    description: `Party **${party.primary_guest_name}** has confirmed their RSVP for **Sunday, Dec 20, 2026** at **Grand Harbor Restaurant**.`,
    color: isAttending ? 0x10B981 : 0x64748B, // Emerald Green or Slate
    fields,
    footer: {
      text: "Trang & Alfredo's Wedding Operations Hub • Grand Harbor"
    },
    timestamp: new Date().toISOString()
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: "Wedding RSVP Assistant",
        avatar_url: "https://wedding.au-tomato.com/favicon.ico",
        embeds: [embed]
      })
    });

    if (!res.ok) {
      console.warn('[Discord Alert] Webhook call returned non-OK status:', res.status);
      return false;
    }

    console.log(`[Discord Alert] Successfully dispatched RSVP alert for ${primaryName} to Discord.`);
    return true;
  } catch (err: any) {
    console.error('[Discord Alert] Failed to post to Discord webhook:', err?.message || err);
    return false;
  }
}

export async function sendDiscordCheckinAlert(params: {
  partyName: string;
  invitationCode: string;
  headcount: number;
  tableInfo: string;
  greeterName?: string;
}): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return false;
  }

  const { partyName, invitationCode, headcount, tableInfo, greeterName } = params;

  const embed = {
    title: `🛎️ Guest Arrival & Check-In: ${partyName}`,
    description: `**${partyName}** (${headcount} guest${headcount > 1 ? 's' : ''}) has arrived at the reception desk!`,
    color: 0xD4AF37, // Gold
    fields: [
      { name: '🎟️ Invite Code', value: `\`${invitationCode}\``, inline: true },
      { name: '🪑 Assigned Table', value: `**${tableInfo}**`, inline: true },
      { name: '👥 Headcount', value: `✓ **${headcount} Present**`, inline: true },
      { name: '📋 Verified By', value: greeterName || 'Reception Greeter Desk', inline: false }
    ],
    footer: {
      text: "Reception Desk • Grand Harbor Banquet Check-In"
    },
    timestamp: new Date().toISOString()
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: "Reception Check-In Bot",
        embeds: [embed]
      })
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}
