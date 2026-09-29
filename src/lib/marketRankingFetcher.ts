import { RankingCategoryType, RankingItem } from '@/types/stock';

interface RawRankingScrapedItem {
  rank: number;
  ticker: string;
  name: string;
  price: number;
  change: string;
  changePercent: number;
  volume: number;
}

const CATEGORY_URLS: Record<RankingCategoryType, string> = {
  gainers: 'https://finance.yahoo.co.jp/stocks/ranking/up?market=all&term=daily',
  losers: 'https://finance.yahoo.co.jp/stocks/ranking/down?market=all&term=daily',
  volume: 'https://finance.yahoo.co.jp/stocks/ranking/volume?market=all&term=daily',
  stop_high: 'https://finance.yahoo.co.jp/stocks/ranking/stopHigh?market=all&term=daily',
  stop_low: 'https://finance.yahoo.co.jp/stocks/ranking/stopLow?market=all&term=daily',
};

// 企業名の簡易クレンジング（(株)などの除去・整形）
function cleanCompanyName(name: string): string {
  return name
    .replace(/\(株\)/g, '')
    .replace(/（株）/g, '')
    .replace(/株式会社/g, '')
    .trim();
}

/**
 * Yahoo!ファイナンスから指定カテゴリのランキングをリアルタイム取得
 */
export async function scrapeCategoryRankings(
  category: RankingCategoryType,
  limit: number = 5
): Promise<Omit<RankingItem, 'ai_reason'>[]> {
  const url = CATEGORY_URLS[category];
  if (!url) return [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
      next: { revalidate: 300 }, // 5分間キャッシュ
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`Yahoo ranking fetch failed for ${category} with status ${res.status}`);
      return [];
    }

    const html = await res.text();
    const trMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
    const results: Omit<RankingItem, 'ai_reason'>[] = [];

    // ヘッダー行をスキップして各行を走査
    for (const tr of trMatches) {
      if (results.length >= limit) break;

      // 順位
      const rankMatch = tr.match(/<th[^>]*>([0-9]+)<\/th>/);
      // ティッカーコード (例: 6533.T)
      const tickerMatch = tr.match(/href="https:\/\/finance\.yahoo\.co\.jp\/quote\/([0-9A-Za-z]{4})\.T"/);
      // 銘柄名
      const nameMatch = tr.match(/data-cl-params="_cl_link:name[^"]*">([^<]+)<\/a>/);
      // 数値群（株価、前日比、騰落率、出来高など）
      const numbers = [...tr.matchAll(/class="StyledNumber__value[^"]*">([+\-0-9,.]+)<\/span>/g)].map(
        (m) => m[1]
      );

      if (tickerMatch) {
        const ticker = tickerMatch[1];
        const rawName = nameMatch ? nameMatch[1].trim() : `銘柄(${ticker})`;
        const name = cleanCompanyName(rawName);
        const rank = rankMatch ? parseInt(rankMatch[1], 10) : results.length + 1;

        const price = numbers[0] ? parseFloat(numbers[0].replace(/,/g, '')) : 0;
        let changePercent = 0;
        let volume = 0;

        if (category === 'gainers' || category === 'losers') {
          // numbers[0]: 株価, numbers[1]: 前日比, numbers[2]: 騰落率, numbers[3]: 出来高
          changePercent = numbers[2] ? parseFloat(numbers[2].replace(/,/g, '')) : 0;
          volume = numbers[3] ? parseInt(numbers[3].replace(/,/g, ''), 10) : 0;
        } else if (category === 'volume') {
          // 出来高ランキング: numbers[0]: 株価, numbers[1]: 前日比, numbers[2]: 騰落率, numbers[3]: 出来高
          changePercent = numbers[2] ? parseFloat(numbers[2].replace(/,/g, '')) : 0;
          volume = numbers[3] ? parseInt(numbers[3].replace(/,/g, ''), 10) : 0;
        } else if (category === 'stop_high' || category === 'stop_low') {
          // ストップ高・安: numbers[0]: 株価, numbers[1]: 前日比, numbers[2]: 騰落率
          changePercent = numbers[2] ? parseFloat(numbers[2].replace(/,/g, '')) : 0;
          volume = numbers[3] ? parseInt(numbers[3].replace(/,/g, ''), 10) : 0;
        }

        results.push({
          ranking_type: category,
          rank_position: rank,
          ticker,
          name,
          price,
          change_percent: changePercent,
          volume,
        });
      }
    }

    return results;
  } catch (error) {
    console.error(`Error scraping category ranking for ${category}:`, error);
    return [];
  }
}

/**
 * 全カテゴリの最新リアルタイムランキングを一括取得
 */
export async function fetchAllLiveRankings(limit: number = 5): Promise<Record<RankingCategoryType, Omit<RankingItem, 'ai_reason'>[]>> {
  const categories: RankingCategoryType[] = ['gainers', 'losers', 'volume', 'stop_high', 'stop_low'];
  const data: Record<RankingCategoryType, Omit<RankingItem, 'ai_reason'>[]> = {
    gainers: [],
    losers: [],
    volume: [],
    stop_high: [],
    stop_low: [],
  };

  await Promise.all(
    categories.map(async (cat) => {
      const items = await scrapeCategoryRankings(cat, limit);
      data[cat] = items;
    })
  );

  return data;
}
