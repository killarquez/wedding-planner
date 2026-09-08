import { LinkCategory } from '../types';

export interface CategoryMetadata {
  category: LinkCategory;
  discordTagId: string;
  discordTagName: string;
  emoji: string;
  labelEn: string;
  labelVi: string;
  badgeClass: string;
}

export const DISCORD_FORUM_TAG_MAP: Record<LinkCategory, CategoryMetadata> = {
  attire: {
    category: 'attire',
    discordTagId: '1546744990514815026',
    discordTagName: '👗 Attire & Áo Dài',
    emoji: '👗',
    labelEn: 'Attire & Áo Dài',
    labelVi: 'Áo Dài & Trang Phục',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-200'
  },
  drinks: {
    category: 'drinks',
    discordTagId: '1546745020827181136',
    discordTagName: '🍷 Bar & Cognac',
    emoji: '🍷',
    labelEn: 'Bar, Cognac & Drinks',
    labelVi: 'Rượu Ngoại & Đồ Uống',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-200'
  },
  venue: {
    category: 'venue',
    discordTagId: '1546745048627154984',
    discordTagName: '🍽 Venue & Banquet',
    emoji: '🍽',
    labelEn: 'Venue & Banquet',
    labelVi: 'Nhà Hàng & Tiệc 8 Món',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-200'
  },
  decor: {
    category: 'decor',
    discordTagId: '1546745070210916402',
    discordTagName: '🌸 Decor & Floral',
    emoji: '🌸',
    labelEn: 'Decor & Floral',
    labelVi: 'Trang Trí & Hoa Tươi',
    badgeClass: 'bg-pink-100 text-pink-900 border-pink-200'
  },
  photo_video: {
    category: 'photo_video',
    discordTagId: '1546745093250359346',
    discordTagName: '📸 Photo & Video',
    emoji: '📸',
    labelEn: 'Photo & Video',
    labelVi: 'Quay Phim & Chụp Ảnh',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-200'
  },
  music: {
    category: 'music',
    discordTagId: '1546745112761991198',
    discordTagName: '🎵 Music & DJ',
    emoji: '🎵',
    labelEn: 'Music & DJ',
    labelVi: 'Âm Nhạc, DJ & MC',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-200'
  },
  favors_misc: {
    category: 'favors_misc',
    discordTagId: '1546745134736089098',
    discordTagName: '🎁 Favors & Misc',
    emoji: '🎁',
    labelEn: 'Favors & Details',
    labelVi: 'Quà Tặng & Chi Tiết Khác',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200'
  }
};

const CATEGORY_KEYWORDS: Record<LinkCategory, string[]> = {
  attire: [
    'áo dài', 'ao dai', 'dress', 'gown', 'tuxedo', 'suit', 'vest', 'veil', 'jewelry', 'cufflinks',
    'tailor', 'ninh khương', 'fitting', 'wedding dress', 'bridal', 'groom', 'bride', 'tiara',
    'heels', 'shoes', 'silk', 'embroidery', 'khăn đóng', 'khan dong'
  ],
  drinks: [
    'hennessy', 'cognac', 'whiskey', 'whisky', 'scotch', 'macallan', 'wine', 'corkage', 'bar',
    'bevmo', 'total wine', 'cocktail', 'cocktails', 'liquor', 'boba', 'chào bàn', 'chao ban', 'tequila',
    'champagne', 'prosecco', 'beer', 'bartender', 'shots', 'pour', 'alcohol', 'vsop', 'xo',
    'rum', 'ron', 'bottle', 'bottles', 'spirits', 'vodka', 'gin', 'diplomatico', 'santa teresa',
    'open bar', 'beverage', 'drinks', 'drink', 'drinking', 'toast', 'toasting', 'mocktail'
  ],
  venue: [
    'venue', 'banquet', 'restaurant', 'hall', 'ballroom', 'catering', 'palace', 'pavilion',
    'grand harbor', 'seafood', 'menu', 'lobster', 'peking duck', 'tasting', 'reception',
    'course menu', 'chinese banquet', 'vietnamese banquet', 'dim sum', 'room rental',
    'banquet table', 'table layout', 'floor plan', 'banquet hall'
  ],
  decor: [
    'flower', 'floral', 'decor', 'decoration', 'backdrop', 'arch', 'centerpiece', 'sweetheart table',
    'linen', 'candle', 'lighting', 'uplighting', 'welcome sign', 'easel', 'drapes', 'chuppah',
    'orchid', 'rose', 'peony', 'garland', 'neon sign', 'table runner', 'seat cover'
  ],
  photo_video: [
    'photo', 'photography', 'photographer', 'videography', 'video', 'cinematography', 'cinema',
    'album', 'recap', 'film', 'booth', 'photobooth', 'portrait', 'highlight reel', 'drone',
    'shoot', 'camera', 'lens', 'lumiere'
  ],
  music: [
    'dj', 'playlist', 'song', 'music', 'sound', 'speaker', 'mic', 'microphone', 'mc',
    'bilingual mc', 'dance', 'spotify', 'soundcloud', 'youtube', 'remix', 'vpop', 'bolero',
    'first dance', 'audio', 'lighting show'
  ],
  favors_misc: [
    'favor', 'gift', 'bao lì xì', 'li xi', 'red envelope', 'tea ceremony', 'chopsticks',
    'invitation', 'invitations', 'invites', 'invite', 'stationery', 'signage', 'place card', 'program',
    'guestbook', 'fan', 'treats', 'cookie', 'box', 'ribbon', 'stamps', 'postage', 'envelope', 'envelopes',
    'wax seal', 'paper', 'calligraphy', 'printing', 'print', 'menu card', 'thank you card', 'welcome bag'
  ]
};

export interface PriceIntentResult {
  detectedPrice: number | null;
  isExpenseReceipt: boolean;
  itemDescription: string | null;
  suggestedTitle: string | null;
}

export function extractPriceAndIntent(text: string): PriceIntentResult {
  if (!text || !text.trim()) {
    return { detectedPrice: null, isExpenseReceipt: false, itemDescription: null, suggestedTitle: null };
  }

  const trimmed = text.trim();

  // Check for expense action keywords: spent, paid, bought, receipt, invoice, deposit, cost
  const expenseActionRegex = /(?:spent|paid|bought|cost|charged|total|deposit|receipt|invoice)\b/i;
  const isExpenseReceipt = expenseActionRegex.test(trimmed);

  // Pattern A: "bought (item) for $?400"
  const boughtForMatch = trimmed.match(/bought\s+(.*?)\s+for\s+\$?(\d+[\d,]*(?:\.\d{1,2})?)/i);
  if (boughtForMatch) {
    const item = boughtForMatch[1]?.trim();
    const priceNum = parseFloat(boughtForMatch[2].replace(/,/g, ''));
    if (!isNaN(priceNum) && priceNum > 0) {
      const capItem = item ? item.charAt(0).toUpperCase() + item.slice(1) : 'Wedding Item';
      return {
        detectedPrice: priceNum,
        isExpenseReceipt: true,
        itemDescription: item,
        suggestedTitle: `Receipt: ${capItem} ($${priceNum.toLocaleString()})`
      };
    }
  }

  // Pattern B: "spent/paid/cost/deposit $?300 on/for (item)"
  const actionWithItemMatch = trimmed.match(
    /(?:spent|paid|cost|charged|deposit)\s*(?:of\s*)?\$?\s*(\d+[\d,]*(?:\.\d{1,2})?)\s*(?:on|for|in)?\s*(.*)/i
  );

  if (actionWithItemMatch && actionWithItemMatch[1]) {
    const priceNum = parseFloat(actionWithItemMatch[1].replace(/,/g, ''));
    if (!isNaN(priceNum) && priceNum > 0) {
      let item = actionWithItemMatch[2]?.trim() || '';
      item = item.replace(/^(?:the|some|our|a|an)\s+/i, '');
      const capItem = item ? item.charAt(0).toUpperCase() + item.slice(1) : 'Wedding Expense';
      return {
        detectedPrice: priceNum,
        isExpenseReceipt: true,
        itemDescription: item || null,
        suggestedTitle: `Receipt: ${capItem} ($${priceNum.toLocaleString()})`
      };
    }
  }

  // Pattern C: "receipt/invoice (from/for) (item) $?300"
  const receiptDollarMatch = trimmed.match(/(?:receipt|invoice)\s+(?:from|for)?\s*(.*?)\s*\$?\s*(\d+[\d,]*(?:\.\d{1,2})?)/i);
  if (receiptDollarMatch) {
    const item = receiptDollarMatch[1]?.trim();
    const priceNum = parseFloat(receiptDollarMatch[2].replace(/,/g, ''));
    if (!isNaN(priceNum) && priceNum > 0) {
      const capItem = item ? item.charAt(0).toUpperCase() + item.slice(1) : 'Receipt';
      return {
        detectedPrice: priceNum,
        isExpenseReceipt: true,
        itemDescription: item,
        suggestedTitle: `Receipt: ${capItem} ($${priceNum.toLocaleString()})`
      };
    }
  }

  // Pattern D: Explicit dollar match e.g. "$211" or "$300.50"
  const dollarMatch = trimmed.match(/\$\s*(\d+[\d,]*(?:\.\d{1,2})?)/);
  if (dollarMatch && dollarMatch[1]) {
    const priceNum = parseFloat(dollarMatch[1].replace(/,/g, ''));
    if (!isNaN(priceNum) && priceNum > 0) {
      return {
        detectedPrice: priceNum,
        isExpenseReceipt,
        itemDescription: null,
        suggestedTitle: null
      };
    }
  }

  // Pattern E: "300 dollars", "250 bucks"
  const wordDollarMatch = trimmed.match(/(\d+[\d,]*(?:\.\d{1,2})?)\s*(?:dollars|bucks)/i);
  if (wordDollarMatch && wordDollarMatch[1]) {
    const priceNum = parseFloat(wordDollarMatch[1].replace(/,/g, ''));
    if (!isNaN(priceNum) && priceNum > 0) {
      return {
        detectedPrice: priceNum,
        isExpenseReceipt,
        itemDescription: null,
        suggestedTitle: null
      };
    }
  }

  return {
    detectedPrice: null,
    isExpenseReceipt,
    itemDescription: null,
    suggestedTitle: null
  };
}

export function classifyWeddingLink(
  url: string,
  title: string,
  description: string,
  userNote: string = ''
): CategoryMetadata {
  const combined = `${userNote.toLowerCase()} ${url.toLowerCase()} ${title.toLowerCase()} ${description.toLowerCase()}`;

  // Direct Domain Overrides
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('spotify.com') || host.includes('soundcloud.com')) {
      return DISCORD_FORUM_TAG_MAP.music;
    }
    if (host.includes('totalwine.com') || host.includes('bevmo.com')) {
      return DISCORD_FORUM_TAG_MAP.drinks;
    }
  } catch (e) {
    // Ignore URL parse error
  }

  // Scoring engine
  const scores: Record<LinkCategory, number> = {
    attire: 0,
    drinks: 0,
    venue: 0,
    decor: 0,
    photo_video: 0,
    music: 0,
    favors_misc: 0
  };

  (Object.keys(CATEGORY_KEYWORDS) as LinkCategory[]).forEach(category => {
    const keywords = CATEGORY_KEYWORDS[category];
    keywords.forEach(kw => {
      // Extra weight for match in user note
      if (userNote.toLowerCase().includes(kw)) {
        scores[category] += 5;
      }
      if (title.toLowerCase().includes(kw)) {
        scores[category] += 3;
      }
      if (description.toLowerCase().includes(kw)) {
        scores[category] += 1.5;
      }
      if (url.toLowerCase().includes(kw)) {
        scores[category] += 2;
      }
    });
  });

  // Find category with highest score
  let maxScore = 0;
  let bestCategory: LinkCategory = 'decor'; // Default fallback

  (Object.keys(scores) as LinkCategory[]).forEach(cat => {
    if (scores[cat] > maxScore) {
      maxScore = scores[cat];
      bestCategory = cat;
    }
  });

  return DISCORD_FORUM_TAG_MAP[bestCategory];
}
