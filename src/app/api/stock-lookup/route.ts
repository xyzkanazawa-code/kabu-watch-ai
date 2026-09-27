import { NextRequest, NextResponse } from 'next/server';
import { STOCK_MASTER } from '@/lib/dataFetcher';

export const dynamic = 'force-dynamic';

// サーバー内メモリキャッシュ (ティッカー毎に10分間キャッシュ)
interface CacheEntry {
  data: {
    ticker: string;
    name: string;
    sector: string;
    price: number;
    changePercent: number;
    isRealLookup: boolean;
  };
  timestamp: number;
}

const lookupCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10分

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawTicker = searchParams.get('ticker') || '';
    const ticker = rawTicker.trim().toUpperCase();

    if (!ticker) {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    // キャッシュチェック
    const cached = lookupCache.get(ticker);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ ...cached.data, cached: true });
    }

    // 1. STOCK_MASTER をチェック
    if (STOCK_MASTER[ticker]) {
      const s = STOCK_MASTER[ticker];
      const result = {
        ticker: s.ticker,
        name: s.name,
        sector: s.sector,
        price: s.price,
        changePercent: s.changePercent,
        pts: s.pts,
        isRealLookup: true,
      };
      lookupCache.set(ticker, { data: result, timestamp: Date.now() });
      return NextResponse.json(result);
    }


    // 2. Yahoo!ファイナンス (国内東証) から正式企業名と株価を取得
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://finance.yahoo.co.jp/quote/${ticker}.T`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const html = await res.text();

        // 社名の抽出 (タイトルタグ優先、なければh1)
        let extractedName = '';

        // 例: <title>(株)ソシオネクスト【6526】：株価・株式情報（夜間PTS含む） - Yahoo!ファイナンス</title>
        const titleMatch = html.match(/<title>([^<]+)<\/title>/);
        if (titleMatch && titleMatch[1]) {
          const fullTitle = titleMatch[1];
          const cleanName = fullTitle
            .replace(/【[0-9A-Za-z]+】.*$/, '')
            .replace(/^[0-9A-Za-z]{4}\s*/, '')
            .replace(/：.*$/, '')
            .replace(/- Yahoo!ファイナンス.*$/, '')
            .trim();
          if (cleanName && !cleanName.includes('エラー') && !cleanName.includes('見つかりません')) {
            extractedName = cleanName;
          }
        }

        // タイトルで取れなかった場合のh1フォールバック
        if (!extractedName) {
          const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
          if (h1Match && h1Match[1]) {
            extractedName = h1Match[1]
              .replace(/の株価.*$/, '')
              .replace(/【[0-9A-Za-z]+】.*$/, '')
              .trim();
          }
        }

        // 株価の抽出
        const priceMatch = html.match(/_CommonPriceBoard[\s\S]*?_StyledNumber__value[^\"]*">([0-9,.]+)/) ||
                           html.match(/<span class="[^"]*price[^"]*">([0-9,.]+)<\/span>/i);
        const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

        // 前日比の抽出
        const changeMatch = html.match(/_PriceChangeLabel__primary[\s\S]*?_StyledNumber__value[^\"]*">([+\-0-9,.]+)/);
        const change = changeMatch ? parseFloat(changeMatch[1].replace(/,/g, '')) : 0;
        const changePercent = price > 0 && change !== 0 ? parseFloat(((change / (price - change)) * 100).toFixed(2)) : 0;

        // 🌙 夜間PTS取引情報の抽出
        let pts: { price: number; change: number; changePercent: number; time?: string } | undefined = undefined;
        const ptsBlockMatch = html.match(/ptsPriceRow[\s\S]*?(?=<\/div><\/div>|<time|$)/);
        if (ptsBlockMatch) {
          const ptsHtml = ptsBlockMatch[0];
          const ptsPriceMatch = ptsHtml.match(/ptsPrice[^\"]*\">[\s\S]*?_StyledNumber__value[^\"]*\">([0-9,.]+)/);
          if (ptsPriceMatch && ptsPriceMatch[1]) {
            const ptsPrice = parseFloat(ptsPriceMatch[1].replace(/,/g, ''));
            let ptsChange = 0;
            let ptsChangePercent = 0;

            const ptsChangeMatch = ptsHtml.match(/_PriceChangeLabel__primary[^\"]*\">[\s\S]*?_StyledNumber__value[^\"]*\">([+\-0-9,.]+)/);
            if (ptsChangeMatch && ptsChangeMatch[1]) {
              ptsChange = parseFloat(ptsChangeMatch[1].replace(/,/g, ''));
            }

            const ptsPercentMatch = ptsHtml.match(/_PriceChangeLabel__secondary[^\"]*\">[\s\S]*?_StyledNumber__value[^\"]*\">([+\-0-9,.]+)/);
            if (ptsPercentMatch && ptsPercentMatch[1]) {
              ptsChangePercent = parseFloat(ptsPercentMatch[1].replace(/,/g, ''));
            } else if (price > 0 && ptsPrice > 0) {
              ptsChangePercent = parseFloat((((ptsPrice - price) / price) * 100).toFixed(2));
            }

            const timeMatch = html.match(/ptsTime[^\"]*\">([^<]+)<\/time>/);
            const ptsTime = timeMatch ? timeMatch[1].trim() : undefined;

            if (ptsPrice > 0) {
              pts = {
                price: ptsPrice,
                change: ptsChange,
                changePercent: ptsChangePercent,
                time: ptsTime,
              };
            }
          }
        }

        if (extractedName) {
          const result = {
            ticker,
            name: extractedName,
            sector: '東証上場銘柄',
            price: price > 0 ? price : 1000,
            changePercent,
            pts,
            isRealLookup: true,
          };
          lookupCache.set(ticker, { data: result, timestamp: Date.now() });
          return NextResponse.json(result);
        }

      }
    } catch (scrapeErr) {
      console.warn(`[stock-lookup API] Yahoo finance fetch failed for ${ticker}:`, scrapeErr);
    }

    // 3. フォールバック
    const fallbackResult = {
      ticker,
      name: `東証銘柄 (${ticker})`,
      sector: '東証上場銘柄',
      price: 1000,
      changePercent: 0,
      isRealLookup: false,
    };
    return NextResponse.json(fallbackResult);
  } catch (error: any) {
    console.error('[stock-lookup API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Lookup failed' },
      { status: 500 }
    );
  }
}
