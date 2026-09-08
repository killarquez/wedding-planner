/**
 * Discord Bot Service for Link Ingestion & Forum Card Creation
 * Connects to Discord REST API v10 and Gateway WebSocket
 */

import { scrapeUrlMetadata, ScrapedMetadata } from '../links/scraper';
import { classifyWeddingLink, CategoryMetadata } from '../links/classifier';
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
   * Fully processes a text message containing link(s) from Alfredo or Trang
   */
  public static async processRawMessage(params: {
    messageId: string;
    channelId: string;
    authorName: string;
    authorId?: string;
    content: string;
    token?: string;
  }): Promise<InspirationLink[]> {
    const { messageId, channelId, authorName, content, token } = params;

    // Extract all URLs
    const urlMatches = content.match(/https?:\/\/[^\s]+/g);

    // Determine submitter: Check if author name/display name indicates Trang, otherwise Alfredo
    const lowerAuthor = authorName.toLowerCase();
    const submitter = lowerAuthor.includes('trang') ? 'Trang' : 'Alfredo';

    const savedLinks: InspirationLink[] = [];

    // CASE 1: Written Idea / Brainstorm Note (No URL in message)
    if (!urlMatches || urlMatches.length === 0) {
      const trimmedText = content.trim();
      if (!trimmedText) return [];

      // Extract a punchy title from the first sentence or first 70 characters
      const firstLine = trimmedText.split('\n')[0].trim();
      const firstSentence = firstLine.split(/[.!?]/)[0].trim();
      const ideaTitle = firstSentence.length > 70
        ? `${firstSentence.slice(0, 67)}...`
        : (firstSentence || trimmedText.slice(0, 70));

      // Auto-classify the category based on the text content
      const categoryMeta = classifyWeddingLink('', ideaTitle, trimmedText, trimmedText);

      // Create Forum Thread Card in #wedding-vault
      const forumResult = await this.createForumPost({
        title: `💡 Idea: ${ideaTitle}`,
        url: 'https://wedding.au-tomato.com/admin',
        description: `📝 "${trimmedText}"`,
        imageUrl: null,
        siteName: 'Brainstorm Note',
        category: categoryMeta,
        submittedBy: submitter,
        notes: trimmedText,
        token
      });

      // Persist into WeddingDB
      const linkRecord = await WeddingDB.createLink({
        url: '',
        title: ideaTitle,
        description: trimmedText,
        image_url: null,
        site_name: 'Written Idea',
        category: categoryMeta.category,
        submitted_by: submitter,
        notes: trimmedText,
        status: 'saved',
        discord_thread_id: forumResult?.id || null,
        discord_message_id: messageId,
        discord_thread_url: forumResult?.threadUrl || null
      });

      savedLinks.push(linkRecord);

      // Discord reactions & confirmation
      await this.reactToMessage(channelId, messageId, '💡', token);
      await this.reactToMessage(channelId, messageId, '✅', token);

      const confirmationMsg = `💡 **Idea saved to ${categoryMeta.discordTagName}**\nNote posted in <#${DISCORD_CONFIG.vaultForumId}> and synced to Couple CRM!`;
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
      // 1. Scrape metadata
      const meta: ScrapedMetadata = await scrapeUrlMetadata(rawUrl);

      // 2. Classify into one of the 7 wedding categories & match to Discord Forum tag ID
      const categoryMeta = classifyWeddingLink(rawUrl, meta.title, meta.description, userNote);

      // 3. Create Forum Card in #wedding-vault
      const forumResult = await this.createForumPost({
        title: meta.title,
        url: meta.url,
        description: meta.description,
        imageUrl: meta.image_url,
        siteName: meta.site_name,
        category: categoryMeta,
        submittedBy: submitter,
        notes: userNote,
        token
      });

      // 4. Persist into WeddingDB
      const linkRecord = await WeddingDB.createLink({
        url: meta.url,
        title: meta.title,
        description: meta.description,
        image_url: meta.image_url,
        site_name: meta.site_name,
        category: categoryMeta.category,
        submitted_by: submitter,
        notes: userNote,
        status: 'saved',
        discord_thread_id: forumResult?.id || null,
        discord_message_id: messageId,
        discord_thread_url: forumResult?.threadUrl || null
      });

      savedLinks.push(linkRecord);

      // 5. Provide feedback on Discord
      await this.reactToMessage(channelId, messageId, '✅', token);
      await this.reactToMessage(channelId, messageId, '💒', token);

      const confirmationMsg = `✨ **Sorted into ${categoryMeta.discordTagName}**\nCard posted in <#${DISCORD_CONFIG.vaultForumId}> and synced to Couple CRM!`;
      await this.replyInInbox(channelId, messageId, confirmationMsg, token);
    }

    return savedLinks;
  }
}
