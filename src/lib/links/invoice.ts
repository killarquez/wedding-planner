import { LinkCategory } from '../types';

export interface ExtractedInvoiceData {
  is_invoice_or_contract: boolean;
  vendor_name: string;
  total_amount: number | null;
  deposit_paid: number | null;
  balance_due: number | null;
  payment_due_date: string | null;
  category: LinkCategory;
  contract_terms?: string | null;
  summary?: string;
  line_items?: Array<{ description: string; amount: number }>;
}

export class InvoiceAnalysisEngine {
  /**
   * Fast check whether a file or message looks like an invoice, quote, or contract
   */
  public static isInvoiceOrContract(filename?: string, contentType?: string, text?: string): boolean {
    const fn = (filename || '').toLowerCase();
    const ct = (contentType || '').toLowerCase();
    const t = (text || '').toLowerCase();

    if (ct === 'application/pdf' || fn.endsWith('.pdf')) {
      return true;
    }

    const keywords = [
      'invoice',
      'receipt',
      'contract',
      'agreement',
      'quote',
      'estimate',
      'deposit',
      'banquet contract',
      'catering quote',
      'bill',
      'due date',
      'balance due',
      'total due'
    ];

    return keywords.some(k => fn.includes(k) || t.includes(k));
  }

  /**
   * Analyzes an invoice or contract document buffer (PDF or Image) using Gemini 3.6 Flash
   * Keeps token usage minimal by enforcing concise output schema.
   */
  public static async analyzeDocument(params: {
    buffer: Buffer;
    contentType: string;
    filename?: string;
    messageText?: string;
  }): Promise<ExtractedInvoiceData | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not found in environment, using fallback parser');
      return this.fallbackTextParser(params.messageText || params.filename || '');
    }

    try {
      // Normalize mimeType for Gemini
      let mimeType = params.contentType || 'application/pdf';
      if (params.filename?.toLowerCase().endsWith('.pdf')) {
        mimeType = 'application/pdf';
      } else if (params.filename?.toLowerCase().endsWith('.png')) {
        mimeType = 'image/png';
      } else if (params.filename?.toLowerCase().match(/\.jpe?g$/)) {
        mimeType = 'image/jpeg';
      } else if (params.filename?.toLowerCase().endsWith('.webp')) {
        mimeType = 'image/webp';
      }

      const base64Data = params.buffer.toString('base64');
      const prompt = `You are a wedding planner AI analyzing an invoice, contract, or receipt for Alfredo & Trang's wedding.
${params.messageText ? `User caption: "${params.messageText}"` : ''}

Extract the financial terms into this exact JSON:
{
  "is_invoice_or_contract": true,
  "vendor_name": "Vendor/Company name or 'Unknown Vendor'",
  "total_amount": 1000.00,
  "deposit_paid": 300.00,
  "balance_due": 700.00,
  "payment_due_date": "YYYY-MM-DD" or null,
  "category": "venue" | "attire" | "drinks" | "decor" | "photo_video" | "music" | "favors_misc",
  "contract_terms": "Brief 1-2 sentence highlight of corkage rules, guest count deadlines, or cancellation policies, or empty string",
  "summary": "Short 1-line item description"
}
If this is NOT an invoice/contract/receipt/quote, return: {"is_invoice_or_contract": false}`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Gemini API error (HTTP ${response.status}):`, errText);
        return this.fallbackTextParser(params.messageText || params.filename || '');
      }

      const result = await response.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        console.warn('Empty response from Gemini Vision API');
        return this.fallbackTextParser(params.messageText || params.filename || '');
      }

      // Parse JSON from code fence or raw string
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, rawText];
      const parsed: any = JSON.parse(jsonMatch[1].trim());

      // Validate is_invoice_or_contract
      const isInvOrContract =
        parsed.is_invoice_or_contract === true ||
        (typeof parsed.is_invoice_or_contract === 'string' &&
          parsed.is_invoice_or_contract.toLowerCase() !== 'false');

      // Fuzzy map category to 6 wedding categories
      const rawCat = (parsed.category || '').toLowerCase();
      let mappedCat: LinkCategory = 'favors_misc';
      if (rawCat.includes('photo') || rawCat.includes('video') || rawCat.includes('booth')) {
        mappedCat = 'photo_video';
      } else if (rawCat.includes('venue') || rawCat.includes('banquet') || rawCat.includes('cater') || rawCat.includes('food')) {
        mappedCat = 'venue';
      } else if (rawCat.includes('drink') || rawCat.includes('bar') || rawCat.includes('wine') || rawCat.includes('cognac') || rawCat.includes('corkage')) {
        mappedCat = 'drinks';
      } else if (rawCat.includes('attire') || rawCat.includes('dress') || rawCat.includes('suit') || rawCat.includes('tux') || rawCat.includes('ao dai')) {
        mappedCat = 'attire';
      } else if (rawCat.includes('decor') || rawCat.includes('flower') || rawCat.includes('floral')) {
        mappedCat = 'decor';
      } else if (rawCat.includes('music') || rawCat.includes('dj') || rawCat.includes('band') || rawCat.includes('sound') || rawCat.includes('audio')) {
        mappedCat = 'music';
      }

      return {
        is_invoice_or_contract: isInvOrContract,
        vendor_name: parsed.vendor_name || 'Vendor',
        total_amount: parsed.total_amount !== undefined && parsed.total_amount !== null ? Number(parsed.total_amount) : null,
        deposit_paid: parsed.deposit_paid !== undefined && parsed.deposit_paid !== null ? Number(parsed.deposit_paid) : null,
        balance_due: parsed.balance_due !== undefined && parsed.balance_due !== null ? Number(parsed.balance_due) : null,
        payment_due_date: parsed.payment_due_date || null,
        category: mappedCat,
        contract_terms: parsed.contract_terms || '',
        summary: parsed.summary || ''
      };
    } catch (e: any) {
      console.error('Failed to parse invoice with Gemini Flash:', e.message);
      return this.fallbackTextParser(params.messageText || params.filename || '');
    }
  }

  /**
   * Deterministic fallback parser when no AI key is present or on API error
   */
  public static fallbackTextParser(text: string): ExtractedInvoiceData {
    const t = text.toLowerCase();
    let total: number | null = null;
    let deposit: number | null = null;

    const totalMatch = t.match(/(?:total|amount|invoiced|spent|paid|sum|due)\s*[:$]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    if (totalMatch) {
      total = parseFloat(totalMatch[1].replace(/,/g, ''));
    }

    const depositMatch = t.match(/(?:deposit|down\s*payment)\s*[:$]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    if (depositMatch) {
      deposit = parseFloat(depositMatch[1].replace(/,/g, ''));
    }

    let category: LinkCategory = 'favors_misc';
    if (t.includes('venue') || t.includes('banquet') || t.includes('hall') || t.includes('catering')) category = 'venue';
    else if (t.includes('flower') || t.includes('floral') || t.includes('decor')) category = 'decor';
    else if (t.includes('photo') || t.includes('video')) category = 'photo_video';
    else if (t.includes('dress') || t.includes('ao dai') || t.includes('suit') || t.includes('tux')) category = 'attire';
    else if (t.includes('wine') || t.includes('cognac') || t.includes('bar') || t.includes('corkage')) category = 'drinks';
    else if (t.includes('dj') || t.includes('music') || t.includes('band')) category = 'music';

    return {
      is_invoice_or_contract: true,
      vendor_name: 'Wedding Vendor',
      total_amount: total,
      deposit_paid: deposit,
      balance_due: total && deposit ? Math.max(0, total - deposit) : null,
      payment_due_date: null,
      category,
      summary: 'Wedding vendor invoice/contract'
    };
  }
}
