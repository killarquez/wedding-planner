import { Party, Guest, Expense, WeddingSettings } from '../types';

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

// ==========================================
// 3. WEDDING LEDGER & BUDGET NOTIFICATIONS
// ==========================================

function getLedgerWebhookUrl(): string | undefined {
  return process.env.DISCORD_LEDGER_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
}

const fmtUsd = (amt: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amt);

export async function sendDiscordBudgetSetupAlert(
  settings: WeddingSettings,
  metrics?: any
): Promise<boolean> {
  const webhookUrl = getLedgerWebhookUrl();
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return false;
  }

  const targetCap = settings.target_budget_cap || 35000;
  const guestCount = settings.target_guest_count || 100;
  const tableCount = settings.target_table_count || 10;
  const perGuest = Math.round(targetCap / (guestCount || 1));

  const cats = settings.categories || {};
  let totalEstimated = 0;
  let totalPaid = 0;
  const catBreakdown: string[] = [];

  const catEmojiMap: Record<string, string> = {
    venue_banquet: '🍽️',
    host_beverages_corkage: '🍷',
    attire: '👰',
    photography_video: '📸',
    stage_av_dj: '🎵',
    decor_floral: '🌸',
    gifts_favors: '🎁',
    misc: '🛡️'
  };

  const catNameMap: Record<string, string> = {
    venue_banquet: 'Banquet & Food',
    host_beverages_corkage: 'Bar & Hennessy Corkage',
    attire: 'Attire & Wedding Bands',
    photography_video: 'Photo & Video',
    stage_av_dj: 'DJ, MC & Sound/Lighting',
    decor_floral: 'Floral & Stage Decor',
    gifts_favors: 'Favors & Invitations',
    misc: 'Emergency Buffer / Legal'
  };

  Object.entries(cats).forEach(([key, cat]) => {
    const est = Number(cat.estimated_cost || 0);
    const paid = Number(cat.deposit_paid || 0);
    totalEstimated += est;
    totalPaid += paid;
    if (est > 0 || paid > 0) {
      const emoji = catEmojiMap[key] || '📌';
      const catName = catNameMap[key] || key;
      catBreakdown.push(`${emoji} **${catName}**: ${fmtUsd(est)} (Paid: ${fmtUsd(paid)})`);
    }
  });

  const remainingBalance = Math.max(0, totalEstimated - totalPaid);
  const variance = targetCap - totalEstimated;
  const isUnder = variance >= 0;

  const fields = [
    {
      name: '🎯 Target Budget Cap',
      value: `**${fmtUsd(targetCap)}**`,
      inline: true
    },
    {
      name: '👥 Target Headcount',
      value: `**${guestCount} Guests** (~${fmtUsd(perGuest)}/guest)`,
      inline: true
    },
    {
      name: '🪑 10-Top Tables',
      value: `**${tableCount} Banquet Tables**`,
      inline: true
    },
    {
      name: '💰 Initial Estimated Commitments',
      value: `**${fmtUsd(totalEstimated)}**`,
      inline: true
    },
    {
      name: '💳 Deposits Logged',
      value: `**${fmtUsd(totalPaid)}**`,
      inline: true
    },
    {
      name: '⏳ Balance Due',
      value: `**${fmtUsd(remainingBalance)}**`,
      inline: true
    },
    {
      name: '⚖️ Budget Cap Variance',
      value: isUnder
        ? `✅ **${fmtUsd(variance)} Under Target Cap**`
        : `⚠️ **${fmtUsd(Math.abs(variance))} Exceeds Target Cap**`,
      inline: false
    }
  ];

  if (catBreakdown.length > 0) {
    fields.push({
      name: '🏛️ 8 Master Budget Pillars Breakdown',
      value: catBreakdown.join('\n'),
      inline: false
    });
  }

  const embed = {
    title: '💍 Wedding Budget Baseline Configured!',
    description: `Alfredo & Trang have established their initial budget & vendor targets for **Sunday, Dec 20, 2026** at **Grand Harbor Restaurant**.`,
    color: isUnder ? 0xD4AF37 : 0xEF4444, // Gold or Red
    fields,
    footer: {
      text: 'Wedding Operations Hub • Executive Ledger & CFO Agent'
    },
    timestamp: new Date().toISOString()
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Wedding CFO & Ledger',
        embeds: [embed]
      })
    });
    return res.ok;
  } catch (err) {
    console.error('[Discord Ledger Alert] Error posting budget setup alert:', err);
    return false;
  }
}

export async function sendDiscordLedgerAlert(params: {
  action: 'created' | 'updated' | 'paid' | 'deleted';
  expense: Partial<Expense>;
  metrics?: any;
}): Promise<boolean> {
  const webhookUrl = getLedgerWebhookUrl();
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return false;
  }

  const { action, expense, metrics } = params;
  const vendor = expense.vendor_name || 'Vendor';
  const category = expense.category || 'General';
  const invoiced = Number(expense.actual_invoiced || expense.estimated_cost || 0);
  const paid = Number(expense.deposit_paid || 0);
  const balance = Number(expense.remaining_balance || Math.max(0, invoiced - paid));
  const dueDate = expense.payment_due_date || 'TBD';
  const status = expense.payment_status || 'pending';

  let title = `🧾 Expense Update: ${vendor}`;
  let color = 0x3B82F6; // Blue default
  let desc = `Expense item updated in the wedding ledger.`;

  if (action === 'paid' || status === 'paid' || (action === 'updated' && paid > 0)) {
    title = `💳 Payment Logged: ${vendor} (${fmtUsd(paid)})`;
    color = 0x10B981; // Emerald green
    desc = `A deposit or balance payment has been recorded for **${vendor}** (${category}).`;
  } else if (action === 'created') {
    title = `➕ New Expense Added: ${vendor} (${fmtUsd(invoiced)})`;
    color = 0x3B82F6; // Blue
    desc = `A new vendor/expense commitment was added to the **${category}** category.`;
  } else if (action === 'deleted') {
    title = `🗑️ Expense Removed: ${vendor}`;
    color = 0xEF4444; // Red
    desc = `An expense entry was removed from the ledger.`;
  }

  const fields: Array<{ name: string; value: string; inline: boolean }> = [
    {
      name: '🏷️ Category & Vendor',
      value: `**${category}** — ${vendor}`,
      inline: true
    },
    {
      name: '💵 Invoiced / Estimated',
      value: fmtUsd(invoiced),
      inline: true
    },
    {
      name: '💳 Paid So Far',
      value: `**${fmtUsd(paid)}**`,
      inline: true
    },
    {
      name: '⏳ Remaining Balance',
      value: `**${fmtUsd(balance)}**`,
      inline: true
    },
    {
      name: '📅 Payment Due Date',
      value: dueDate,
      inline: true
    },
    {
      name: '📌 Payment Status',
      value: status.toUpperCase(),
      inline: true
    }
  ];

  if (expense.notes && expense.notes.trim()) {
    fields.push({
      name: '📝 Vendor Notes / Contract Terms',
      value: expense.notes.trim(),
      inline: false
    });
  }

  if (metrics && metrics.total_budget_estimated !== undefined) {
    fields.push({
      name: '📊 Overall Wedding Budget Status',
      value: `Total Committed: **${fmtUsd(metrics.total_budget_estimated || 0)}** • Paid: **${fmtUsd(metrics.total_deposit_paid || 0)}** • Balance Due: **${fmtUsd(metrics.remaining_balance_due || 0)}**`,
      inline: false
    });
  }

  const embed = {
    title,
    description: desc,
    color,
    fields,
    footer: {
      text: 'Trang & Alfredo Wedding Ledger • Grand Harbor'
    },
    timestamp: new Date().toISOString()
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Wedding Ledger Bot',
        embeds: [embed]
      })
    });
    return res.ok;
  } catch (err) {
    console.error('[Discord Ledger Alert] Error posting ledger alert:', err);
    return false;
  }
}
