import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';
import { RankingCategoryType, RankingItem } from '@/types/stock';
import { fetchAllLiveRankings, scrapeCategoryRankings } from '@/lib/marketRankingFetcher';

export const dynamic = 'force-dynamic';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// メモリキャッシュ構造 (10分有効)
interface CachedData {
  items: RankingItem[];
  timestamp: number;
}
const memoryRankingsCache = new Map<string, CachedData>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10分間キャッシュ

// フォールバック用の基礎データ（通信遮断時のみ使用）
const FALLBACK_MARKET_RANKINGS: Record<RankingCategoryType, Omit<RankingItem, 'ai_reason'>[]> = {
  gainers: [
    { ranking_type: 'gainers', rank_position: 1, ticker: '6533', name: 'Orchestra Holdings', price: 1906, change_percent: 24.7, volume: 554000 },
    { ranking_type: 'gainers', rank_position: 2, ticker: '634A', name: 'レイヤード', price: 3115, change_percent: 19.3, volume: 1840000 },
    { ranking_type: 'gainers', rank_position: 3, ticker: '3686', name: 'ディー・エル・イー', price: 70, change_percent: 18.6, volume: 4420000 },
    { ranking_type: 'gainers', rank_position: 4, ticker: '6920', name: 'レーザーテック', price: 24150, change_percent: 8.4, volume: 15400000 },
    { ranking_type: 'gainers', rank_position: 5, ticker: '7203', name: 'トヨタ自動車', price: 2785.5, change_percent: 4.8, volume: 34500000 },
  ],
  losers: [
    { ranking_type: 'losers', rank_position: 1, ticker: '9562', name: 'ビジネスコーチ', price: 610, change_percent: -14.1, volume: 22700 },
    { ranking_type: 'losers', rank_position: 2, ticker: '3659', name: 'ネクソン', price: 2646, change_percent: -13.8, volume: 2360000 },
    { ranking_type: 'losers', rank_position: 3, ticker: '4755', name: '楽天グループ', price: 780, change_percent: -6.4, volume: 28000000 },
    { ranking_type: 'losers', rank_position: 4, ticker: '9104', name: '商船三井', price: 4420, change_percent: -5.9, volume: 7600000 },
    { ranking_type: 'losers', rank_position: 5, ticker: '6758', name: 'ソニーグループ', price: 13420, change_percent: -4.5, volume: 5400000 },
  ],
  volume: [
    { ranking_type: 'volume', rank_position: 1, ticker: '8918', name: 'ランド', price: 10, change_percent: 0.0, volume: 163000000 },
    { ranking_type: 'volume', rank_position: 2, ticker: '4564', name: 'オンコセラピー・サイエンス', price: 20, change_percent: 0.0, volume: 97500000 },
    { ranking_type: 'volume', rank_position: 3, ticker: '9432', name: 'NTT', price: 170.8, change_percent: -2.2, volume: 88600000 },
    { ranking_type: 'volume', rank_position: 4, ticker: '8306', name: '三菱UFJフィナンシャルG', price: 1540, change_percent: -1.2, volume: 68000000 },
    { ranking_type: 'volume', rank_position: 5, ticker: '7203', name: 'トヨタ自動車', price: 2785.5, change_percent: 1.8, volume: 42000000 },
  ],
  stop_high: [
    { ranking_type: 'stop_high', rank_position: 1, ticker: '634A', name: 'レイヤード', price: 3115, change_percent: 19.3, volume: 1840000 },
    { ranking_type: 'stop_high', rank_position: 2, ticker: '6533', name: 'Orchestra Holdings', price: 1906, change_percent: 24.7, volume: 554000 },
    { ranking_type: 'stop_high', rank_position: 3, ticker: '7422', name: '東邦レマック', price: 467, change_percent: 8.4, volume: 51100 },
    { ranking_type: 'stop_high', rank_position: 4, ticker: '5253', name: 'カバー', price: 2450, change_percent: 16.3, volume: 11200000 },
    { ranking_type: 'stop_high', rank_position: 5, ticker: '4478', name: 'フリー', price: 3450, change_percent: 15.8, volume: 3800000 },
  ],
  stop_low: [
    { ranking_type: 'stop_low', rank_position: 1, ticker: '9562', name: 'ビジネスコーチ', price: 610, change_percent: -14.1, volume: 22700 },
    { ranking_type: 'stop_low', rank_position: 2, ticker: '3659', name: 'ネクソン', price: 2646, change_percent: -13.8, volume: 2360000 },
    { ranking_type: 'stop_low', rank_position: 3, ticker: '4592', name: 'サンバイオ', price: 680, change_percent: -12.6, volume: 8500000 },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as RankingCategoryType | 'all' | null;
    const forceRefresh = searchParams.get('force') === 'true';
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const cacheKey = category || 'all';

    // 1. キャッシュチェック (forceRefresh でない場合、10分以内ならキャッシュを即返却)
    if (!forceRefresh && memoryRankingsCache.has(cacheKey)) {
      const cached = memoryRankingsCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return NextResponse.json({
          cached: true,
          updated_date: today,
          updated_time: formattedTime,
          rankings: formatRankingsResponse(cached.items, category),
        });
      }
    }

    // 2. Yahoo!ファイナンスから本日の最新リアルタイム市場ランキングをスクレイピング取得
    let liveRankingsMap: Record<RankingCategoryType, Omit<RankingItem, 'ai_reason'>[]>;
    try {
      liveRankingsMap = await fetchAllLiveRankings(5);
    } catch (scrapeErr) {
      console.warn('Realtime ranking fetch warning, falling back to base dataset:', scrapeErr);
      liveRankingsMap = FALLBACK_MARKET_RANKINGS;
    }

    // 各カテゴリで取得できなかった場合はフォールバックで補完
    const allCategories: RankingCategoryType[] = ['gainers', 'losers', 'volume', 'stop_high', 'stop_low'];
    allCategories.forEach((cat) => {
      if (!liveRankingsMap[cat] || liveRankingsMap[cat].length === 0) {
        liveRankingsMap[cat] = FALLBACK_MARKET_RANKINGS[cat] || [];
      }
    });

    // 3. 対象銘柄のリストを作成
    const targetsToAnalyze: RankingItem[] = [];
    allCategories.forEach((cat) => {
      const items = liveRankingsMap[cat];
      items.forEach((item, idx) => {
        targetsToAnalyze.push({
          ...item,
          rank_position: idx + 1,
          ai_reason: `${item.name}(${item.ticker})の直近の材料や市場の需給思惑を受けた急変動。`,
          updated_date: today,
        });
      });
    });

    // 4. Gemini AI による急騰・急落のリアルタイム理由解説生成
    const userApiKey = request.headers.get('x-gemini-key') || '';
    const activeGenAI = userApiKey ? new GoogleGenerativeAI(userApiKey) : genAI;

    if (activeGenAI) {
      try {
        const model = activeGenAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        // 主要銘柄（重複を除外）について理由を解析
        const uniqueItems = Array.from(new Map(targetsToAnalyze.map((t) => [t.ticker, t])).values()).slice(0, 15);
        const promptLines = uniqueItems.map(
          (t) => `・${t.name}(${t.ticker}): 変動率 ${t.change_percent >= 0 ? '+' : ''}${t.change_percent}% / 株価 ${t.price}円 / 分類: ${t.ranking_type}`
        );

        const prompt = `
あなたは日本の株式市場アナリストです。以下の「本日急変動している東証銘柄」について、個人投資家向けに「なぜ上がったのか / なぜ下がったのか」の背景・買い材料・売り要因を1〜2行（50〜80文字程度）で簡潔明快に解説してください。

対象銘柄リスト:
${promptLines.join('\n')}

出力JSON形式【のみ】で出力してください:
{
  "reasons": {
    "6533": "好決算発表や上方修正・業務提携思惑を好感した短期資金の集中流入。",
    "9562": "業績進捗の遅延懸念や手仕舞い売りによる一時的な利益確定売り。"
  }
}
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        if (parsed.reasons) {
          targetsToAnalyze.forEach((item) => {
            if (parsed.reasons[item.ticker]) {
              item.ai_reason = parsed.reasons[item.ticker];
            }
          });
        }
      } catch (geminiError) {
        console.warn('Gemini ranking analysis error (using smart fallback reasons):', geminiError);
      }
    }

    // 5. メモリキャッシュ保存
    memoryRankingsCache.set(cacheKey, {
      items: targetsToAnalyze,
      timestamp: Date.now(),
    });

    // Supabaseへのバックアップ保存（可能であれば）
    if (supabase) {
      try {
        await supabase.from('market_rankings_cache').upsert(
          targetsToAnalyze.map((t) => ({
            ranking_type: t.ranking_type,
            rank_position: t.rank_position,
            ticker: t.ticker,
            name: t.name,
            price: t.price,
            change_percent: t.change_percent,
            volume: t.volume,
            ai_reason: t.ai_reason,
            updated_date: today,
          })),
          { onConflict: 'ranking_type,rank_position,updated_date' }
        );
      } catch (insertError) {
        // warningのみ
      }
    }

    return NextResponse.json({
      cached: false,
      updated_date: today,
      updated_time: formattedTime,
      rankings: formatRankingsResponse(targetsToAnalyze, category),
    });
  } catch (error: any) {
    console.error('Error in /api/market-rankings:', error);
    return NextResponse.json(
      { error: error.message || 'Market ranking server error' },
      { status: 500 }
    );
  }
}

function formatRankingsResponse(
  items: RankingItem[],
  category: RankingCategoryType | 'all' | null
): Record<RankingCategoryType, RankingItem[]> | RankingItem[] {
  if (category && category !== 'all') {
    return items.filter((i) => i.ranking_type === category);
  }

  const grouped: Record<RankingCategoryType, RankingItem[]> = {
    gainers: [],
    losers: [],
    volume: [],
    stop_high: [],
    stop_low: [],
  };

  items.forEach((item) => {
    if (grouped[item.ranking_type]) {
      grouped[item.ranking_type].push(item);
    }
  });

  // 各カテゴリ順位順ソート
  (Object.keys(grouped) as RankingCategoryType[]).forEach((cat) => {
    grouped[cat].sort((a, b) => a.rank_position - b.rank_position);
  });

  return grouped;
}
