import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getCachedAnalysis, setCachedAnalysis } from '@/lib/supabase';
import { generateNewsComprehensiveAnalysis } from '@/lib/gemini';

/**
 * URL または (ticker + title) から SHA-256 ハッシュ値を計算
 */
function computeContentHash(url?: string, ticker?: string, title?: string): string {
  // URLが有効なhttpリンクであればURLをキーに、なければ (ticker + title) をキーにする
  const seed = (url && (url.startsWith('http://') || url.startsWith('https://')))
    ? url.trim()
    : `${(ticker || '').trim()}_${(title || '').trim()}`;

  return crypto.createHash('sha256').update(seed).digest('hex');
}

/**
 * ニュース・適時開示 AI分析APIルート (/api/analyze-news)
 * 共有AIキャッシュ層（Supabase + In-Memory Fallback）により、
 * 同一のニュース/開示に対するGeminiリクエストは全世界で最初の1回のみに制限。
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const headerKey = request.headers.get('x-gemini-api-key') || '';
    const { url, title, body, ticker, type, apiKey } = payload;
    const effectiveApiKey = apiKey || headerKey || '';

    if (!title && !url) {
      return NextResponse.json(
        { error: 'title or url is required' },
        { status: 400 }
      );
    }

    const contentHash = computeContentHash(url, ticker, title);
    const safeTicker = (ticker || 'OTHER').toUpperCase().trim();
    const safeTitle = (title || '開示・ニュース').trim();

    // 1. 共有キャッシュの照会 (Supabase / In-Memory)
    const cachedRecord = await getCachedAnalysis(contentHash);
    if (cachedRecord) {
      return NextResponse.json({
        cached: true,
        cached_at: cachedRecord.created_at,
        content_hash: cachedRecord.content_hash,
        ticker: cachedRecord.ticker,
        title: cachedRecord.title,
        category: cachedRecord.category,
        importance_score: cachedRecord.importance_score,
        summary: cachedRecord.summary,
        market_impact: cachedRecord.market_impact,
        partner_details: cachedRecord.partner_details,
      });
    }

    // 2. キャッシュミス時のみ Gemini API (gemini-1.5-flash) を呼び出し
    const analysis = await generateNewsComprehensiveAnalysis(
      safeTitle,
      body || safeTitle,
      safeTicker,
      type,
      effectiveApiKey
    );

    // 3. キャッシュへ保存
    const savedRecord = await setCachedAnalysis({
      content_hash: contentHash,
      ticker: safeTicker,
      title: safeTitle,
      category: analysis.category || type || '一般開示',
      importance_score: analysis.importance_score || 3,
      summary: analysis.summary,
      market_impact: analysis.market_impact,
      partner_details: analysis.partner_details,
    });

    // 4. レスポンス返却 (cached: false)
    return NextResponse.json({
      cached: false,
      cached_at: savedRecord.created_at,
      content_hash: savedRecord.content_hash,
      ticker: savedRecord.ticker,
      title: savedRecord.title,
      category: savedRecord.category,
      importance_score: savedRecord.importance_score,
      summary: savedRecord.summary,
      market_impact: savedRecord.market_impact,
      partner_details: savedRecord.partner_details,
    });
  } catch (error: any) {
    console.error('Error in /api/analyze-news POST:', error);
    return NextResponse.json(
      { error: error.message || 'Analysis cache server error' },
      { status: 500 }
    );
  }
}

/**
 * GETリクエスト対応 (SWRやprefetch等で直接クエリ可能)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url') || undefined;
    const title = searchParams.get('title') || undefined;
    const ticker = searchParams.get('ticker') || undefined;
    const type = searchParams.get('type') || undefined;

    if (!title && !url) {
      return NextResponse.json(
        { error: 'title or url parameter is required' },
        { status: 400 }
      );
    }

    const contentHash = computeContentHash(url, ticker, title);
    const safeTicker = (ticker || 'OTHER').toUpperCase().trim();
    const safeTitle = (title || '開示・ニュース').trim();

    // キャッシュ照会
    const cachedRecord = await getCachedAnalysis(contentHash);
    if (cachedRecord) {
      return NextResponse.json({
        cached: true,
        cached_at: cachedRecord.created_at,
        content_hash: cachedRecord.content_hash,
        ticker: cachedRecord.ticker,
        title: cachedRecord.title,
        category: cachedRecord.category,
        importance_score: cachedRecord.importance_score,
        summary: cachedRecord.summary,
        market_impact: cachedRecord.market_impact,
        partner_details: cachedRecord.partner_details,
      });
    }

    const headerKey = request.headers.get('x-gemini-api-key') || '';

    // キャッシュミス時
    const analysis = await generateNewsComprehensiveAnalysis(
      safeTitle,
      safeTitle,
      safeTicker,
      type,
      headerKey
    );

    const savedRecord = await setCachedAnalysis({
      content_hash: contentHash,
      ticker: safeTicker,
      title: safeTitle,
      category: analysis.category || type || '一般開示',
      importance_score: analysis.importance_score || 3,
      summary: analysis.summary,
      market_impact: analysis.market_impact,
      partner_details: analysis.partner_details,
    });

    return NextResponse.json({
      cached: false,
      cached_at: savedRecord.created_at,
      content_hash: savedRecord.content_hash,
      ticker: savedRecord.ticker,
      title: savedRecord.title,
      category: savedRecord.category,
      importance_score: savedRecord.importance_score,
      summary: savedRecord.summary,
      market_impact: savedRecord.market_impact,
      partner_details: savedRecord.partner_details,
    });
  } catch (error: any) {
    console.error('Error in /api/analyze-news GET:', error);
    return NextResponse.json(
      { error: error.message || 'Analysis cache server error' },
      { status: 500 }
    );
  }
}
