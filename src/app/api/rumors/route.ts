import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_RUMORS, EXTRA_RUMOR_POOL } from '@/lib/rumorData';
import { RumorItem } from '@/types/rumor';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { scrapeCategoryRankings } from '@/lib/marketRankingFetcher';

export const dynamic = 'force-dynamic';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// メモリキャッシュ (30分間有効)
let cachedRumors: RumorItem[] | null = null;
let lastRumorsFetch = 0;
const RUMORS_CACHE_TTL = 30 * 60 * 1000;

// スキャン時に順次ローテーションするためのインデックス
let poolScanIndex = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('force') === 'true';

    const now = new Date();
    const todayStr = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`;
    const todayTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // キャッシュが有効な場合はそのまま返却 (force時は強制再スキャン)
    if (!forceRefresh && cachedRumors && Date.now() - lastRumorsFetch < RUMORS_CACHE_TTL) {
      return NextResponse.json({
        cached: true,
        updatedDate: todayStr,
        updatedTime: todayTimeStr,
        rumors: cachedRumors,
        scannedCount: 0,
      });
    }

    // 1. 本日の急騰・出来高急増銘柄をリアルタイム取得（トピックのタネとする）
    let hotStocks: { ticker: string; name: string; price: number; changePercent: number }[] = [];
    try {
      const gainers = await scrapeCategoryRankings('gainers', 3);
      hotStocks = gainers.map((g) => ({
        ticker: g.ticker,
        name: g.name,
        price: g.price,
        changePercent: g.change_percent,
      }));
    } catch (e) {
      console.warn('Could not scrape hot stocks for rumor generation:', e);
    }

    // 2. Gemini AI による本日最新の「ネット・SNS噂・思惑ファクトチェック」の動的生成
    let dynamicRumors: RumorItem[] = [];
    const userApiKey = request.headers.get('x-gemini-key') || '';
    const activeGenAI = userApiKey ? new GoogleGenerativeAI(userApiKey) : genAI;

    if (activeGenAI && hotStocks.length > 0) {
      try {
        const model = activeGenAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const targetsInfo = hotStocks
          .map((s) => `・${s.name}(${s.ticker}) 株価${s.price}円 (変動率: +${s.changePercent}%)`)
          .join('\n');

        const prompt = `
あなたは日本の株式市場・SNS仕手筋・IRファクトチェックに精通したAIアナリストです。
本日東証で急動意・急騰している以下の銘柄について、投資家SNS（X/旧Twitterや掲示板）で囁かれている「思惑・噂・買い材料」を1件特定し、AIファクトチェック検証結果を作成してください。

本日急騰中の銘柄:
${targetsInfo}

以下のJSONフォーマット配列【のみ】で厳密に出力してください（1〜2件程度作成）:
[
  {
    "id": "dynamic-rumor-1",
    "ticker": "銘柄コード",
    "stockName": "銘柄名",
    "market": "プライム または スタンダード または グロース",
    "sector": "業種",
    "title": "SNSで囁かれる噂や思惑のタイトル（例: ○○社との大型業務提携および新AI機能の電撃発表の思惑）",
    "category": "new_product | partnership | ma_takeover | earnings_leak | patent_pharma | sns_hype",
    "buzzLevel": "🔥 過熱・大バズ" または "⚡ 急上昇",
    "sourceMedia": "X（旧Twitter）投資インフルエンサー ＆ 掲示板",
    "rumorSummary": "噂の具体的な内容を2行程度で記述",
    "whyBuzzing": {
      "origin": "噂の発端",
      "spreadPath": "拡散ルート",
      "marketReaction": "本日の株価の初動反応"
    },
    "aiVerdict": {
      "verdict": "highly_credible | caution_speculative | fake_warning | officially_denied",
      "credibilityScore": 75,
      "fakeRiskScore": 25,
      "headline": "【AI総括】見出し（例: 【要検証・思惑先行】直近開示の余波はあるが、SNSでの買い煽りはやや過熱気味）",
      "factCheckPoints": {
        "officialStatus": "適時開示状況",
        "sourceReliability": "情報の出処の信頼性",
        "technicalFeasibility": "実現可能性"
      },
      "aiWarning": "投資家への具体的な注意・助言",
      "recommendedAction": "catalyst_watch"
    }
  }
]
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        if (Array.isArray(parsed) && parsed.length > 0) {
          dynamicRumors = parsed.map((item, idx) => {
            const stock = hotStocks.find((s) => s.ticker === item.ticker) || hotStocks[0];
            return {
              ...item,
              id: `scanned-${Date.now()}-${idx}`,
              price: stock ? stock.price : 1000,
              change: stock ? Math.round((stock.price * stock.changePercent) / 100) : 50,
              changePercent: stock ? stock.changePercent : 5.0,
              detectedDate: `${todayStr} ${todayTimeStr}`,
            };
          });
        }
      } catch (geminiErr) {
        console.warn('Gemini dynamic rumor generation error:', geminiErr);
      }
    }

    // 3. Geminiの生成がない場合、EXTRA_RUMOR_POOL から未掲載の思惑噂をスキャン結果として確実に発掘
    if (dynamicRumors.length === 0 && EXTRA_RUMOR_POOL.length > 0) {
      // スキャンごとにローテーションして2件発掘
      const pick1 = EXTRA_RUMOR_POOL[poolScanIndex % EXTRA_RUMOR_POOL.length];
      const pick2 = EXTRA_RUMOR_POOL[(poolScanIndex + 1) % EXTRA_RUMOR_POOL.length];
      poolScanIndex = (poolScanIndex + 2) % EXTRA_RUMOR_POOL.length;

      const picks = [pick1, pick2].filter(Boolean);
      dynamicRumors = picks.map((p, idx) => ({
        ...p,
        id: `scanned-${p.ticker}-${Date.now()}-${idx}`,
        detectedDate: `${todayStr} ${todayTimeStr}`,
      }));
    }

    // 4. 基礎噂データの日付を最新の本日・直近に更新
    const updatedInitialRumors = INITIAL_RUMORS.map((r, i) => {
      const daysAgo = i === 0 ? 0 : i === 1 ? 1 : i === 2 ? 1 : 2;
      const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const dateStr = `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
      return {
        ...r,
        detectedDate: dateStr,
      };
    });

    // 最新の動的生成・スキャン検知噂を先頭に、基礎噂をその後に結合
    const allRumors = [...dynamicRumors, ...updatedInitialRumors];

    cachedRumors = allRumors;
    lastRumorsFetch = Date.now();

    return NextResponse.json({
      cached: false,
      updatedDate: todayStr,
      updatedTime: todayTimeStr,
      scannedCount: dynamicRumors.length,
      rumors: allRumors,
      newlyScannedIds: dynamicRumors.map((r) => r.id),
    });
  } catch (err: any) {
    console.error('Error in /api/rumors:', err);
    return NextResponse.json(
      { error: err.message || 'Rumors server error' },
      { status: 500 }
    );
  }
}
