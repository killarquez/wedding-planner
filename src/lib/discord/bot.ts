/**
 * Discord Bot Service for Link Ingestion & Forum Card Creation
 * Connects to Discord REST API v10 and Gateway WebSocket
 */

import { scrapeUrlMetadata, ScrapedMetadata } from '../links/scraper';
import { classifyWeddingLink, CategoryMetadata, extractPriceAndIntent } from '../links/classifier';
import { WeddingDB } from '../db';
import { InspirationLink } from '../types';

export const DISCORD_CONFIG = {
  token: process.env.DISCORD_BOT_TOKEN || '',
  inboxChannelId: process.env.DISCORD_INBOX_CHANNEL_ID || '1546744623295234048',
  vaultForumId: process.env.DISCORD_VAULT_FORUM_ID || '1546744809832841306'
};

const DISCORD_API_BASE = 'https://discord.com/api/v10';

export class DiscordBotService {
  private static getHeaders(tokenOverride?: string) {
    const token = tokenOverride || DISCORD_CONFIG.token;
    return {
      'Authorization': `Bot ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Creates a tagged Thread Post in the #wedding-vault Forum Channel
   */
  public static async createForumPost(params: {
    title: string;
    url: string;
    description: string;
    imageUrl?: string | null;
    siteName: string;
    category: CategoryMetadata;
    submittedBy: string;
    notes?: string;
    estimatedCost?: number | null;
    token?: string;
  }): Promise<{ id: string; threadUrl: string } | null> {
    try {
      // Truncate title to 95 chars (Discord forum thread title limit is 100)
      const threadTitle = `${params.category.emoji} ${params.title}`.slice(0, 95);

      const embedDescription = params.description
        ? (params.description.length > 300 ? `${params.description.slice(0, 297)}...` : params.description)
        : `Idea saved from ${params.siteName}`;

      const fields: Array<{ name: string; value: string; inline: boolean }> = [
        { name: 'Category', value: params.category.discordTagName, inline: true },
        { name: 'Saved By', value: params.submittedBy, inline: true }
      ];

      if (params.estimatedCost !== undefined && params.estimatedCost !== null && params.estimatedCost > 0) {
        fields.push({
          name: '💰 Amount / Cost',
          value: `$${params.estimatedCost.toLocaleString()}`,
          inline: true
        });
      }

      if (params.notes && params.notes.trim()) {
        fields.push({ name: 'Couple Notes', value: params.notes.trim(), inline: false });
      }

      fields.push({
        name: 'Links & Actions',
        value: `[🔗 Visit Website / Post](${params.url}) • [💒 Open Couple CRM](https://wedding.au-tomato.com/admin)`,
        inline: false
      });

      const embed: any = {
        title: params.title.slice(0, 250),
        url: params.url,
        description: embedDescription,
        color: 0xc41e3a, // Crimson & Gold theme
        fields,
        footer: {
          text: `Trang & Alfredo's Wedding Vault • Dec 20, 2026`
        },
        timestamp: new Date().toISOString()
      };

      if (params.imageUrl && params.imageUrl.startsWith('http')) {
        embed.image = { url: params.imageUrl };
      }

      const body = {
        name: threadTitle,
        applied_tags: [params.category.discordTagId],
        message: {
          content: `**New Wedding Inspiration Saved!**\n> Shared by **${params.submittedBy}** into <#${DISCORD_CONFIG.inboxChannelId}>`,
          embeds: [embed]
        }
      };

      const res = await fetch(`${DISCORD_API_BASE}/channels/${DISCORD_CONFIG.vaultForumId}/threads`, {
        method: 'POST',
        headers: this.getHeaders(params.token),
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Discord createForumPost error:', res.status, errorText);
        return null;
      }

      const thread = await res.json();
      const threadUrl = `https://discord.com/channels/${thread.guild_id || '@me'}/${thread.id}`;
      return { id: thread.id, threadUrl };
    } catch (e) {
      console.error('Failed to create forum thread:', e);
      return null;
    }
  }

  /**
   * Adds an emoji reaction to a message in Discord
   */
  public static async reactToMessage(channelId: string, messageId: string, emoji: string = '✅', token?: string): Promise<void> {
    try {
      const encodedEmoji = encodeURIComponent(emoji);
      await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}/@me`, {
        method: 'PUT',
        headers: this.getHeaders(token)
      });
    } catch (e) {
      // Non-blocking
    }
  }

  /**
   * Sends a confirmation reply in the inbox channel
   */
  public static async replyInInbox(channelId: string, messageId: string, content: string, token?: string): Promise<void> {
    try {
      await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({
          content,
          message_reference: { message_id: messageId }
        })
      });
    } catch (e) {
      // Non-blocking
    }
  }

  /**
   * Fully processes a text message containing link(s) or written ideas/receipts from Alfredo, Trang, or wedding helpers
   */
  public static async processRawMessage(params: {
    messageId: string;
    channelId: string;
    authorName: string;
    authorId?: string;
    content: string;
    attachments?: Array<{ url: string; content_type?: string; filename?: string }>;
    token?: string;
  }): Promise<InspirationLink[]> {
    const { messageId, channelId, authorName, content, attachments, token } = params;

    // Extract all URLs
    const urlMatches = content.match(/https?:\/\/[^\s]+/g);

    // Extract any photo/screenshot attachment (e.g. receipt photo from phone)
    let attachmentImageUrl: string | null = null;
    if (attachments && attachments.length > 0) {
      const img = attachments.find(a =>
        a.content_type?.startsWith('image/') ||
        /\.(png|jpe?g|webp|gif|heic|bmp)$/i.test(a.url || a.filename || '')
      );
      if (img) attachmentImageUrl = img.url;
    }

    // Determine submitter: recognizes Trang, Alfredo, or wedding party helpers (e.g. "Lindsie")
    const lowerAuthor = authorName.toLowerCase();
    let submitter = 'Alfredo';
    if (lowerAuthor.includes('trang')) {
      submitter = 'Trang';
    } else if (lowerAuthor.includes('alfredo') || lowerAuthor.includes('killarquez')) {
      submitter = 'Alfredo';
    } else if (authorName.trim()) {
      // Capitalize first letter of helper's name
      submitter = authorName.trim().charAt(0).toUpperCase() + authorName.trim().slice(1);
    }

    // Extract price and intent from message text
    const priceIntent = extractPriceAndIntent(content);
    const savedLinks: InspirationLink[] = [];

    // CASE 1: Written Idea / Brainstorm Note / Expense Receipt (No URL in message)
    if (!urlMatches || urlMatches.length === 0) {
      const trimmedText = content.trim();
      if (!trimmedText && !attachmentImageUrl) return [];

      const isReceipt = priceIntent.isExpenseReceipt || !!attachmentImageUrl;
      const initialStatus = (priceIntent.isExpenseReceipt || priceIntent.detectedPrice) ? 'reviewing' : 'saved';

      // Title determination
      const firstLine = (trimmedText || 'Receipt Photo').split('\n')[0].trim();
      const firstSentence = firstLine.split(/[.!?]/)[0].trim();
      const defaultIdeaTitle = firstSentence.length > 70
        ? `${firstSentence.slice(0, 67)}...`
        : (firstSentence || trimmedText.slice(0, 70) || 'Wedding Receipt');

      const finalTitle = priceIntent.suggestedTitle || (isReceipt ? `Receipt: ${defaultIdeaTitle}` : defaultIdeaTitle);

      // Auto-classify category based on text and item description
      const textToClassify = `${priceIntent.itemDescription || ''} ${trimmedText}`.trim();
      const categoryMeta = classifyWeddingLink('', finalTitle, textToClassify, textToClassify);

      const siteName = attachmentImageUrl ? 'Receipt Upload' : (priceIntent.isExpenseReceipt ? 'Expense Log' : 'Brainstorm Note');

      // Create Forum Thread Card in #wedding-vault
      const forumResult = await this.createForumPost({
        title: `${isReceipt ? '🧾' : '💡'} ${finalTitle}`,
        url: 'https://wedding.au-tomato.com/admin',
        description: `📝 "${trimmedText || 'Receipt photo attached'}"`,
        imageUrl: attachmentImageUrl,
        siteName,
        category: categoryMeta,
        submittedBy: submitter,
        notes: trimmedText,
        estimatedCost: priceIntent.detectedPrice,
        token
      });

      // Persist into WeddingDB & Supabase
      const linkRecord = await WeddingDB.createLink({
        url: '',
        title: finalTitle,
        description: trimmedText,
        image_url: attachmentImageUrl,
        site_name: siteName,
        category: categoryMeta.category,
        submitted_by: submitter,
        notes: trimmedText,
        status: initialStatus,
        estimated_cost: priceIntent.detectedPrice,
        discord_thread_id: forumResult?.id || null,
        discord_message_id: messageId,
        discord_thread_url: forumResult?.threadUrl || null
      });

      savedLinks.push(linkRecord);

      // Discord reactions
      if (isReceipt) {
        await this.reactToMessage(channelId, messageId, '🧾', token);
      } else {
        await this.reactToMessage(channelId, messageId, '💡', token);
      }
      await this.reactToMessage(channelId, messageId, '✅', token);

      // Confirmation response
      let confirmationMsg = '';
      if (priceIntent.detectedPrice) {
        confirmationMsg = `🧾 **Receipt & Expense Noted: $${priceIntent.detectedPrice.toLocaleString()}**\nSaved to **${categoryMeta.discordTagName}** by **${submitter}** and placed in **Reviewing Queue** for tonight's CRM review!`;
      } else {
        confirmationMsg = `💡 **Idea saved to ${categoryMeta.discordTagName}** by **${submitter}**\nNote posted in <#${DISCORD_CONFIG.vaultForumId}> and synced to Couple CRM!`;
      }
      await this.replyInInbox(channelId, messageId, confirmationMsg, token);

      return savedLinks;
    }

    // CASE 2: Message contains one or more URLs
    let userNote = content;
    urlMatches.forEach(u => {
      userNote = userNote.replace(u, '');
    });
    userNote = userNote.trim();

    for (const rawUrl of urlMatches) {
      // 1. Scrape metadata (including price)
      const meta: ScrapedMetadata = await scrapeUrlMetadata(rawUrl);

      // Price: Priority to user-typed price, then page e-commerce scraped price
      const detectedCost = priceIntent.detectedPrice || meta.price || null;
      const initialStatus = (priceIntent.isExpenseReceipt || detectedCost) ? 'reviewing' : 'saved';
      const displayImage = meta.image_url || attachmentImageUrl || null;

      // 2. Classify into wedding category
      const categoryMeta = classifyWeddingLink(rawUrl, meta.title, meta.description, userNote);

      // 3. Create Forum Card in #wedding-vault
      const forumResult = await this.createForumPost({
        title: meta.title,
        url: meta.url,
        description: meta.description,
        imageUrl: displayImage,
        siteName: meta.site_name,
        category: categoryMeta,
        submittedBy: submitter,
        notes: userNote,
        estimatedCost: detectedCost,
        token
      });

      // 4. Persist into WeddingDB
      const linkRecord = await WeddingDB.createLink({
        url: meta.url,
        title: meta.title,
        description: meta.description,
        image_url: displayImage,
        site_name: meta.site_name,
        category: categoryMeta.category,
        submitted_by: submitter,
        notes: userNote,
        status: initialStatus,
        estimated_cost: detectedCost,
        discord_thread_id: forumResult?.id || null,
        discord_message_id: messageId,
        discord_thread_url: forumResult?.threadUrl || null
      });

      savedLinks.push(linkRecord);

      // 5. Provide feedback on Discord
      await this.reactToMessage(channelId, messageId, '✅', token);
      if (detectedCost) {
        await this.reactToMessage(channelId, messageId, '💰', token);
      } else {
        await this.reactToMessage(channelId, messageId, '💒', token);
      }

      const priceTag = detectedCost ? ` (Auto-detected: **$${detectedCost.toLocaleString()}**)` : '';
      const confirmationMsg = `✨ **Sorted into ${categoryMeta.discordTagName}**${priceTag}\nCard posted in <#${DISCORD_CONFIG.vaultForumId}> and synced to Couple CRM!`;
      await this.replyInInbox(channelId, messageId, confirmationMsg, token);
    }

    return savedLinks;
  }
}
