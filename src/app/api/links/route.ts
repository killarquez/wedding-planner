import { NextRequest, NextResponse } from 'next/server';
import { WeddingDB } from '@/lib/db';
import { DiscordBotService } from '@/lib/discord/bot';
import { scrapeUrlMetadata } from '@/lib/links/scraper';
import { classifyWeddingLink, DISCORD_FORUM_TAG_MAP } from '@/lib/links/classifier';
import { LinkCategory } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;

    const links = await WeddingDB.getLinks(category, status);
    const allLinks = await WeddingDB.getLinks();

    // Category count aggregations
    const counts: Record<string, number> = {
      all: allLinks.length,
      attire: 0,
      drinks: 0,
      venue: 0,
      decor: 0,
      photo_video: 0,
      music: 0,
      favors_misc: 0
    };

    allLinks.forEach(l => {
      if (counts[l.category] !== undefined) {
        counts[l.category]++;
      }
    });

    return NextResponse.json({
      success: true,
      links,
      total: links.length,
      counts
    });
  } catch (error: any) {
    console.error('Error fetching inspiration links:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Ingestion from Discord Bot WebSocket event
    if (body.message_id && body.content) {
      const token = body.bot_token || process.env.DISCORD_BOT_TOKEN;
      const saved = await DiscordBotService.processRawMessage({
        messageId: body.message_id,
        channelId: body.channel_id,
        authorName: body.author_name || 'Alfredo',
        content: body.content,
        token
      });

      return NextResponse.json({ success: true, links: saved });
    }

    // 2. Direct creation from Couple CRM UI
    const { url, title, notes, submitted_by, category } = body;
    const hasUrl = url && url.trim().length > 0;
    const contentText = (notes || title || url || '').trim();

    if (!hasUrl && !contentText) {
      return NextResponse.json({ error: 'Please provide either a URL or a written idea note.' }, { status: 400 });
    }

    if (!hasUrl) {
      // Written Idea from CRM
      const ideaTitle = title?.trim() || contentText.split(/[.!?\n]/)[0].slice(0, 60) || 'Wedding Idea';
      const categoryMeta = category && DISCORD_FORUM_TAG_MAP[category as LinkCategory]
        ? DISCORD_FORUM_TAG_MAP[category as LinkCategory]
        : classifyWeddingLink('', ideaTitle, contentText, contentText);

      const forumResult = await DiscordBotService.createForumPost({
        title: `💡 Idea: ${ideaTitle}`,
        url: 'https://wedding.au-tomato.com/admin',
        description: `📝 "${contentText}"`,
        imageUrl: null,
        siteName: 'Brainstorm Note',
        category: categoryMeta,
        submittedBy: submitted_by || 'Alfredo',
        notes: contentText
      });

      const newLink = await WeddingDB.createLink({
        url: '',
        title: ideaTitle,
        description: contentText,
        image_url: null,
        site_name: 'Written Idea',
        category: categoryMeta.category,
        submitted_by: submitted_by || 'Alfredo',
        notes: contentText,
        status: 'saved',
        discord_thread_id: forumResult?.id || null,
        discord_thread_url: forumResult?.threadUrl || null
      });

      return NextResponse.json({ success: true, link: newLink });
    }

    const meta = await scrapeUrlMetadata(url.trim());
    const categoryMeta = category && DISCORD_FORUM_TAG_MAP[category as LinkCategory]
      ? DISCORD_FORUM_TAG_MAP[category as LinkCategory]
      : classifyWeddingLink(url.trim(), meta.title, meta.description, notes || '');

    // Cross-post to Discord Forum
    const forumResult = await DiscordBotService.createForumPost({
      title: meta.title,
      url: meta.url,
      description: meta.description,
      imageUrl: meta.image_url,
      siteName: meta.site_name,
      category: categoryMeta,
      submittedBy: submitted_by || 'Alfredo',
      notes: notes || ''
    });

    const newLink = await WeddingDB.createLink({
      url: meta.url,
      title: meta.title,
      description: meta.description,
      image_url: meta.image_url,
      site_name: meta.site_name,
      category: categoryMeta.category,
      submitted_by: submitted_by || 'Alfredo',
      notes: notes || '',
      status: 'saved',
      discord_thread_id: forumResult?.id || null,
      discord_thread_url: forumResult?.threadUrl || null
    });

    return NextResponse.json({ success: true, link: newLink });
  } catch (error: any) {
    console.error('Error saving inspiration link:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    // A. Convert Link to Budget Expense
    if (body.action === 'convert_to_expense') {
      const { id, expenseData } = body;
      if (!id || !expenseData) {
        return NextResponse.json({ error: 'Link id and expenseData are required' }, { status: 400 });
      }

      const result = await WeddingDB.convertLinkToExpense(id, expenseData);
      return NextResponse.json({ success: true, ...result });
    }

    // B. Standard field updates
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: 'Link id is required' }, { status: 400 });
    }

    const updated = await WeddingDB.updateLink(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, link: updated });
  } catch (error: any) {
    console.error('Error updating link:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Link id is required' }, { status: 400 });
    }

    const deleted = await WeddingDB.deleteLink(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    console.error('Error deleting link:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
