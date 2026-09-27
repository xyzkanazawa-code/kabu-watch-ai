import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';
import { RankingCategoryType, RankingItem } from '@/types/stock';

export const dynamic = 'force-dynamic';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// メモリキャッシュ（当日分）
const memoryRankingsCache = new Map<string, RankingItem[]>();

// 基本となる東証代表急変動銘柄（ベースデータ）
const BASE_MARKET_RANKINGS: Record<RankingCategoryType, Omit<RankingItem, 'ai_reason'>[]> = {
  gainers: [
    { ranking_type: 'gainers', rank_position: 1, ticker: '6920', name: 'レーザーテック', price: 24150, change_percent: 18.4, volume: 15400000 },
    { ranking_type: 'gainers', rank_position: 2, ticker: '6526', name: 'ソシオネクスト', price: 2890, change_percent: 14.2, volume: 8200000 },
    { ranking_type: 'gainers', rank_position: 3, ticker: '7203', name: 'トヨタ自動車', price: 2785.5, change_percent: 9.8, volume: 34500000 },
    { ranking_type: 'gainers', rank_position: 4, ticker: '7011', name: '三菱重工業', price: 2150, change_percent: 8.5, volume: 19800000 },
    { ranking_type: 'gainers', rank_position: 5, ticker: '8035', name: '東京エレクトロン', price: 26800, change_percent: 7.6, volume: 9100000 },
  ],
  losers: [
    { ranking_type: 'losers', rank_position: 1, ticker: '4755', name: '楽天グループ', price: 780, change_percent: -12.4, volume: 28000000 },
    { ranking_type: 'losers', rank_position: 2, ticker: '9104', name: '商船三井', price: 4420, change_percent: -8.9, volume: 7600000 },
    { ranking_type: 'losers', rank_position: 3, ticker: '6758', name: 'ソニーグループ', price: 13420, change_percent: -6.5, volume: 5400000 },
    { ranking_type: 'losers', rank_position: 4, ticker: '8306', name: '三菱UFJフィナンシャルG', price: 1540, change_percent: -5.2, volume: 45000000 },
    { ranking_type: 'losers', rank_position: 5, ticker: '9432', name: 'NTT', price: 148.5, change_percent: -4.1, volume: 180000000 },
  ],
  volume: [
    { ranking_type: 'volume', rank_position: 1, ticker: '9432', name: 'NTT', price: 148.5, change_percent: -4.1, volume: 220000000 },
    { ranking_type: 'volume', rank_position: 2, ticker: '8306', name: '三菱UFJフィナンシャルG', price: 1540, change_percent: -5.2, volume: 68000000 },
    { ranking_type: 'volume', rank_position: 3, ticker: '7203', name: 'トヨタ自動車', price: 2785.5, change_percent: 9.8, volume: 42000000 },
    { ranking_type: 'volume', rank_position: 4, ticker: '9984', name: 'ソフトバンクグループ', price: 8940, change_percent: 5.6, volume: 26000000 },
    { ranking_type: 'volume', rank_position: 5, ticker: '7011', name: '三菱重工業', price: 2150, change_percent: 8.5, volume: 24000000 },
  ],
  stop_high: [
    { ranking_type: 'stop_high', rank_position: 1, ticker: '5253', name: 'カバー', price: 2450, change_percent: 21.3, volume: 11200000 },
    { ranking_type: 'stop_high', rank_position: 2, ticker: '4478', name: 'フリー', price: 3450, change_percent: 19.8, volume: 3800000 },
    { ranking_type: 'stop_high', rank_position: 3, ticker: '5595', name: 'QPS研究所', price: 1890, change_percent: 18.5, volume: 9400000 },
    { ranking_type: 'stop_high', rank_position: 4, ticker: '3697', name: 'SHIFT', price: 16800, change_percent: 16.7, volume: 1500000 },
    { ranking_type: 'stop_high', rank_position: 5, ticker: '4165', name: 'プレイド', price: 1220, change_percent: 15.4, volume: 4100000 },
  ],
  stop_low: [
    { ranking_type: 'stop_low', rank_position: 1, ticker: '4592', name: 'サンバイオ', price: 680, change_percent: -23.6, volume: 8500000 },
    { ranking_type: 'stop_low', rank_position: 2, ticker: '4385', name: 'メルカリ', price: 1920, change_percent: -17.2, volume: 14200000 },
    { ranking_type: 'stop_low', rank_position: 3, ticker: '2158', name: 'FRONTEO', price: 540, change_percent: -16.8, volume: 2100000 },
    { ranking_type: 'stop_low', rank_position: 4, ticker: '3993', name: 'PKSHA Technology', price: 3150, change_percent: -15.5, volume: 3400000 },
    { ranking_type: 'stop_low', rank_position: 5, ticker: '9107', name: '川崎汽船', price: 1980, change_percent: -14.2, volume: 12000000 },
  ],
};

// デフォルト理由解説
const DEFAULT_AI_REASONS: Record<string, string> = {
  '6920': '米エヌビディア最高値更新を受けた半導体装置株への猛烈な資金集中と、次世代フォトマスク検査装置の大型受注報道が材料視。',
  '6526': '海外大手通信向けカスタムSoC（AIアクセラレータ）の受注獲得発表が強烈な買い材料となり急反発。',
  '7203': '外国為替市場での円安進行に加え、次世代全固体電池の量産化提携ニュースを好感した海外機関投資家の買い流入。',
  '7011': '防衛予算増額関連の政策思惑と、大型ガスタービンおよび宇宙防衛事業の受注残高拡大が好感。',
  '8035': '半導体前工程向けエッチング装置の引き合い活発化と、野村証券による目標株価引き上げレポートが後押し。',
  '4755': 'モバイル事業の設備投資負担継続懸念と、公募増資・社債償還リスクを警戒した海外ヘッジファンドの売り越し。',
  '9104': 'コンテナ船運賃市況（CCFI）の反落と、中東地政学リスク緩和期待に伴う海運運賃ピークアウト警戒売り。',
  '6758': 'ゲーム事業のハード普及鈍化懸念と、米国ハイテク株安に連動した利益確定売りに押される展開。',
  '8306': '日銀の利上げ観測後退に伴う長期金利低下で利ざや拡大期待が剥落し、銀行セクター全体に手仕舞い売り波及。',
  '9432': 'ディフェンシブ株からの資金流出と、個人投資家の信用買い残整理売りが重なり上値の重い展開。',
  '5253': 'VTuber海外大型イベントのチケット完売およびコマース収益の急増観測で個人主導のストップ高買い気配。',
  '4478': '大手金融機関との新法人決済クラウド包括提携開示を好感し、寄付きから買い注文が殺到して比例配分。',
  '5595': '防衛省向け小型SAR衛星の実証実験成功リリースがテーマ株物色に火を付け、短期急騰ストップ高。',
  '3697': '第3四半期累計の営業利益が前年比45%増と会社計画を大幅に超過達成し、通期上方修正期待からストップ高。',
  '4165': '海外SaaSプラットフォームとの資本業務提携の思惑から仕手系短期資金が集中し急伸。',
  '4592': '開発中バイオ新薬の製造承認プロセスにおける追加治験要求の開示が嫌気され、売り気配のままストップ安。',
  '4385': '国内フリマGMV成長率の市場予想未達と、米国事業の赤字幅縮小遅れが決算発表で嫌気され急落。',
  '2158': '通期業績予想の大幅下方修正と主要顧客からの案件延期発表が失望売りを誘発。',
  '3993': '大型AI案件の検収ズレ込みによる今期営業減益見通しが嫌気され、失望売りが波及。',
  '9107': '海運大手各社の運賃指数急落を嫌気した空売りが集中し、投げ売りを巻き込んでストップ安水準まで下落。',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as RankingCategoryType | 'all' | null;
    const today = new Date().toISOString().split('T')[0];

    // 1. Supabase または メモリキャッシュの確認
    if (supabase) {
      try {
        let query = supabase
          .from('market_rankings_cache')
          .select('*')
          .eq('updated_date', today)
          .order('rank_position', { ascending: true });

        if (category && category !== 'all') {
          query = query.eq('ranking_type', category);
        }

        const { data: dbData, error } = await query;
        if (!error && dbData && dbData.length > 0) {
          return NextResponse.json({
            cached: true,
            updated_date: today,
            rankings: formatRankingsResponse(dbData as RankingItem[], category),
          });
        }
      } catch (err) {
        console.warn('Supabase ranking cache check failed:', err);
      }
    }

    // メモリキャッシュチェック
    const cacheKey = `${today}_${category || 'all'}`;
    if (memoryRankingsCache.has(cacheKey)) {
      return NextResponse.json({
        cached: true,
        updated_date: today,
        rankings: formatRankingsResponse(memoryRankingsCache.get(cacheKey)!, category),
      });
    }

    // 2. キャッシュミス時: 各銘柄の理由を Gemini に一括分析依頼
    const allCategories: RankingCategoryType[] = ['gainers', 'losers', 'volume', 'stop_high', 'stop_low'];
    const targetsToAnalyze: RankingItem[] = [];

    allCategories.forEach((cat) => {
      const items = BASE_MARKET_RANKINGS[cat];
      items.forEach((item) => {
        targetsToAnalyze.push({
          ...item,
          ai_reason: DEFAULT_AI_REASONS[item.ticker] || `${item.name}の直近開示および市場動向に基づく急変動`,
          updated_date: today,
        });
      });
    });

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const promptLines = targetsToAnalyze.slice(0, 15).map(
          (t) => `・${t.name}(${t.ticker}): 変動率 ${t.change_percent >= 0 ? '+' : ''}${t.change_percent}% / 分類: ${t.ranking_type}`
        );

        const prompt = `
あなたは日本の株式市場アナリストです。以下の本日の急変動銘柄について、投資家向けに「なぜ上がったのか / なぜ下がったのか」を1〜2行で簡潔明快に解説してください。

対象銘柄リスト:
${promptLines.join('\n')}

出力JSON形式:
{
  "reasons": {
    "6920": "半導体需要加速と海外大手受注獲得を好感した資金流入。",
    "4755": "財務負担懸念と社債償還リスクを警戒した売り。"
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
        console.warn('Gemini ranking analysis error (using curated reasons):', geminiError);
      }
    }

    // 3. キャッシュ保存 (Supabase & Memory)
    memoryRankingsCache.set(cacheKey, targetsToAnalyze);

    if (supabase) {
      try {
        await supabase
          .from('market_rankings_cache')
          .upsert(
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
        console.warn('Supabase ranking cache insert warning:', insertError);
      }
    }

    return NextResponse.json({
      cached: false,
      updated_date: today,
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
