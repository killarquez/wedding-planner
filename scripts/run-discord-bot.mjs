/**
 * Standalone Discord Gateway Bot Runner
 * Listens to #link-inbox in real-time and auto-categorizes links into #wedding-vault
 */

import fs from 'fs';
import path from 'path';

// Read .env.local if not already in process.env
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

const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN is missing in environment variables.');
  process.exit(1);
}
const INBOX_CHANNEL_ID = process.env.DISCORD_INBOX_CHANNEL_ID || '1546744623295234048';
const VAULT_FORUM_ID = process.env.DISCORD_VAULT_FORUM_ID || '1546744809832841306';

console.log('----------------------------------------------------');
console.log('🤖 STARTING TRANG & ALFREDO WEDDING DISCORD LINK BOT');
console.log(`📥 Inbox Channel: ${INBOX_CHANNEL_ID}`);
console.log(`💒 Vault Forum:   ${VAULT_FORUM_ID}`);
console.log('----------------------------------------------------');

let heartbeatInterval = null;
let lastSequence = null;
let ws = null;

function connectGateway() {
  const gatewayUrl = 'wss://gateway.discord.gg/?v=10&encoding=json';
  ws = new WebSocket(gatewayUrl);

  ws.onopen = () => {
    console.log('🔌 Connected to Discord Gateway WebSocket!');
  };

  ws.onmessage = async (event) => {
    try {
      const payload = JSON.parse(event.data);
      const { op, d, s, t } = payload;

      if (s !== null && s !== undefined) {
        lastSequence = s;
      }

      // OP 10: Hello -> Start Heartbeat & Identify
      if (op === 10) {
        const intervalMs = d.heartbeat_interval;
        console.log(`💓 Gateway Heartbeat interval: ${intervalMs}ms`);

        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ op: 1, d: lastSequence }));
          }
        }, intervalMs);

        // Identify
        const identifyPayload = {
          op: 2,
          d: {
            token: TOKEN,
            intents: (1 << 0) | (1 << 9) | (1 << 15), // GUILDS (1) | GUILD_MESSAGES (512) | MESSAGE_CONTENT (32768)
            properties: {
              os: process.platform,
              browser: 'wedding-bot',
              device: 'wedding-bot'
            }
          }
        };
        ws.send(JSON.stringify(identifyPayload));
      }

      // OP 11: Heartbeat ACK
      if (op === 11) {
        // Heartbeat acknowledged
      }

      // OP 0: Dispatch Events
      if (op === 0) {
        if (t === 'READY') {
          console.log(`✅ Bot logged in as ${d.user.username}#${d.user.discriminator} (ID: ${d.user.id})`);
          console.log(`👀 Actively listening for links in channel ${INBOX_CHANNEL_ID}...`);
        }

        if (t === 'MESSAGE_CREATE') {
          await handleMessageCreate(d);
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  };

  ws.onclose = (event) => {
    console.warn(`⚠️ Discord Gateway connection closed (code ${event.code}). Reconnecting in 5s...`);
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    setTimeout(connectGateway, 5000);
  };

  ws.onerror = (err) => {
    console.error('Gateway WebSocket error:', err);
  };
}

async function handleMessageCreate(msg) {
  // Only monitor the specified inbox channel
  if (msg.channel_id !== INBOX_CHANNEL_ID) return;

  // Ignore bot messages
  if (msg.author && msg.author.bot) return;

  const content = (msg.content || '').trim();
  const attachments = (msg.attachments || []).map(a => ({
    url: a.url,
    content_type: a.content_type,
    filename: a.filename
  }));

  if (!content && attachments.length === 0) return;

  const authorName = msg.member?.nick || msg.author?.global_name || msg.author?.username || 'Alfredo';
  const hasUrl = /https?:\/\/[^\s]+/g.test(content);
  const hasImage = attachments.some(a => a.content_type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|heic)$/i.test(a.url || ''));
  console.log(`\n📨 ${hasUrl ? 'Link' : (hasImage ? 'Receipt/Photo Upload' : 'Written Note')} received from ${authorName}: "${(content || '[Photo Attachment]').slice(0, 100)}"`);

  // Forward to API endpoint (prioritizing production site if set, with localhost fallback)
  const bodyPayload = JSON.stringify({
    message_id: msg.id,
    channel_id: msg.channel_id,
    author_name: authorName,
    content: content,
    attachments: attachments,
    bot_token: TOKEN
  });

  const primaryBase = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const primaryUrl = `${primaryBase.replace(/\/$/, '')}/api/links`;
  const fallbackUrl = 'http://localhost:3000/api/links';

  let handled = false;
  try {
    console.log(`📡 Forwarding to primary API (${primaryUrl})...`);
    const res = await fetch(primaryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyPayload
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`🎉 Processed & saved ${data.links?.length || 1} link(s) to CRM & Discord Forum via ${primaryUrl}!`);
      handled = true;
    } else {
      const errText = await res.text();
      console.warn(`⚠️ Primary API returned status ${res.status}:`, errText.slice(0, 150));
    }
  } catch (err) {
    console.warn(`⚠️ Could not reach primary API (${primaryUrl}):`, err.message);
  }

  if (!handled && primaryUrl !== fallbackUrl) {
    try {
      console.log(`📡 Forwarding to fallback local API (${fallbackUrl})...`);
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyPayload
      });

      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        console.log(`🎉 Processed & saved ${data.links?.length || 1} link(s) to CRM & Discord Forum via fallback!`);
      } else {
        const errText = await fallbackRes.text();
        console.error('Fallback API error:', fallbackRes.status, errText);
      }
    } catch (fallbackErr) {
      console.error('❌ All API endpoints failed to process message:', fallbackErr.message);
    }
  }
}

connectGateway();
