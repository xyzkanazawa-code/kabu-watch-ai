import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';
import { WeekendPickItem } from '@/types/stock';

export const dynamic = 'force-dynamic';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// メモリキャッシュ
const memoryPicksCache = new Map<string, WeekendPickItem[]>();

// 直近の土曜日の日付文字列 (YYYY-MM-DD) を取得
function getLatestSaturdayDate(): string {
  const d = new Date();
  const day = d.getDay(); // 0: 日, 6: 土
  const diff = (day >= 6 ? 0 : 7) - (6 - day);
  const saturday = new Date(d);
  saturday.setDate(d.getDate() - ((day + 1) % 7));
  return saturday.toISOString().split('T')[0];
}

// デフォルトの厳選銘柄（Gemini接続なし時や初期フォールバック）
const DEFAULT_WEEKEND_PICKS: WeekendPickItem[] = [
  // ⚡ 短期投資
  {
    target_date: getLatestSaturdayDate(),
    horizon: 'short',
    ticker: '6920',
    name: 'レーザーテック',
    current_price: 24150,
    target_price: 28500,
    upside_percent: 18.0,
    stop_loss_price: 22000,
    sector: '電気機器',
    catalyst: '次世代2nmノード向けEUVフォトマスク欠陥検査装置の大型受注獲得開示',
    ai_analysis: '世界シェア100%のEUV検査装置において海外大手ファウンドリからの受注残高が過去最高を更新。信用倍率も1.87倍まで良化しており、踏み上げを伴う短期急伸が期待されます。',
    risk_factors: '米ハイテク株全般のボラティリティ急拡大および為替の急激な円高反転。',
  },
  {
    target_date: getLatestSaturdayDate(),
    horizon: 'short',
    ticker: '5253',
    name: 'カバー',
    current_price: 2450,
    target_price: 2980,
    upside_percent: 21.6,
    stop_loss_price: 2220,
    sector: '情報・通信業',
    catalyst: '北米スタジアム大型ライブの即完およびグローバルECコマース売上の急伸',
    ai_analysis: 'VTuberIP事業の海外展開が想定以上のスピードでスケール化。直近の信用期日売り一巡に伴い上値が軽くなっており、上方修正サプライズを先取りするテーマ資金が集中しやすい局面です。',
    risk_factors: '所属タレントの活動休止リスクや競合他社の大型イベント重複。',
  },
  // 📈 中期投資
  {
    target_date: getLatestSaturdayDate(),
    horizon: 'mid',
    ticker: '7203',
    name: 'トヨタ自動車',
    current_price: 2785.5,
    target_price: 3300,
    upside_percent: 18.5,
    stop_loss_price: 2550,
    sector: '輸送用機器',
    catalyst: '次世代全固体電池の量産設備投資前倒しと、年間1兆円規模の自社株買い枠設定',
    ai_analysis: 'HV（ハイブリッド車）の世界的高粗利需要が継続し今期営業利益5兆円規模を維持。さらに1兆円の自社株買いによるEPS押し上げ効果が大きく、PBR1.1倍台からの水準訂正が期待されます。',
    risk_factors: '米国金利高止まりに伴う自動車ローン延滞率上昇および関税政策の変化。',
  },
  {
    target_date: getLatestSaturdayDate(),
    horizon: 'mid',
    ticker: '8035',
    name: '東京エレクトロン',
    current_price: 26800,
    target_price: 31500,
    upside_percent: 17.5,
    stop_loss_price: 24500,
    sector: '電気機器',
    catalyst: '生成AIデータセンター向けHBM（高帯域メモリ）用先端ボンディング装置の本格出荷',
    ai_analysis: 'エッチング装置およびコータ・デベロッパで圧倒的競争力を誇り、AI半導体向け装置の受注比率が急上昇。今期配当利回りも魅力的な水準にあり、機関投資家の四半期リバランスでの組み入れが想定されます。',
    risk_factors: '対中半導体輸出規制の追加強化や設備投資サイクルの先送り。',
  },
  // 🏛️ 長期投資
  {
    target_date: getLatestSaturdayDate(),
    horizon: 'long',
    ticker: '8306',
    name: '三菱UFJフィナンシャルG',
    current_price: 1540,
    target_price: 1880,
    upside_percent: 22.1,
    stop_loss_price: 1410,
    sector: '銀行業',
    catalyst: '日銀の金融政策正常化に伴う国内貸出利ざや拡大と、累進配当方針の継続',
    ai_analysis: 'マイナス金利解除後の利ざや改善が着実に収益寄与。自己資本比率の充実を背景に増配と自社株買いを継続しており、配当利回り3%超のインカムゲインと構造的PBR是正のダブルインカムが狙えます。',
    risk_factors: '急激な海外景気後退や米商業用不動産向けエクスポージャーの不良債権化。',
  },
  {
    target_date: getLatestSaturdayDate(),
    horizon: 'long',
    ticker: '9432',
    name: 'NTT',
    current_price: 148.5,
    target_price: 185,
    upside_percent: 24.6,
    stop_loss_price: 135,
    sector: '情報・通信業',
    catalyst: '次世代光通信技術「IOWN」の国際標準化と、安定したキャッシュフローに基づく連続増配',
    ai_analysis: '国内トップのディフェンシブ通信インフラであり、25期連続増配の見通し。超高速・低消費電力の光電融合技術はAIデータセンターの電力ボトルネックを解消する世界最先端の長期成長ドライバーです。',
    risk_factors: '通信料金引き下げ圧力や政府保有株の追加売却による需給軟化。',
  },
];

function enrichPickItem(item: any): WeekendPickItem {
  const currentPrice = Number(item.current_price) || 1000;
  const targetPrice = item.target_price != null && Number(item.target_price) > 0
    ? Number(item.target_price)
    : Math.round(currentPrice * (item.horizon === 'short' ? 1.15 : item.horizon === 'mid' ? 1.20 : 1.25));
  const upside = item.upside_percent != null
    ? Number(item.upside_percent)
    : Math.round(((targetPrice - currentPrice) / currentPrice) * 1000) / 10;
  const stopLoss = item.stop_loss_price != null && Number(item.stop_loss_price) > 0
    ? Number(item.stop_loss_price)
    : Math.round(currentPrice * 0.92);

  return {
    ...item,
    current_price: currentPrice,
    target_price: targetPrice,
    upside_percent: upside,
    stop_loss_price: stopLoss,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const horizon = searchParams.get('horizon') as 'short' | 'mid' | 'long' | 'all' | null;
    const targetDate = searchParams.get('date') || getLatestSaturdayDate();

    // 1. Supabase キャッシュ照会
    if (supabase) {
      try {
        let query = supabase
          .from('weekend_stock_picks')
          .select('*')
          .eq('target_date', targetDate);

        if (horizon && horizon !== 'all') {
          query = query.eq('horizon', horizon);
        }

        const { data: dbData, error } = await query;
        if (!error && dbData && dbData.length > 0) {
          const enriched = (dbData as any[]).map(enrichPickItem);
          return NextResponse.json({
            cached: true,
            target_date: targetDate,
            picks: formatPicksResponse(enriched, horizon),
          });
        }
      } catch (err) {
        console.warn('Supabase weekend picks cache check failed:', err);
      }
    }

    // メモリキャッシュ照会
    if (memoryPicksCache.has(targetDate)) {
      const cached = memoryPicksCache.get(targetDate)!;
      return NextResponse.json({
        cached: true,
        target_date: targetDate,
        picks: formatPicksResponse(cached.map(enrichPickItem), horizon),
      });
    }

    // 2. キャッシュミス時: Geminiによる週末AI厳選銘柄の生成
    let generatedPicks = DEFAULT_WEEKEND_PICKS.map((p) => enrichPickItem({ ...p, target_date: targetDate }));

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
あなたは日本の著名株式ストラテジストです。
本日（週末）の日本市場の総括を踏まえ、来週以降に投資妙味がある「厳選おすすめ日本株」を合計6銘柄（短期2銘柄、中期2銘柄、長期2銘柄）スクリーニングしてください。

【厳格な要件】
1. 短期（数日〜数週）：直近好材料、需給好転、テーマ急騰が狙える銘柄
2. 中期（1〜6ヶ月）：好決算、上方修正余地、自社株買い・増配などのカタリストがある銘柄
3. 長期（1年以上）：強固な事業基盤（ワイドモート）、高ROE、累進配当を誇る割安優良株
4. 各銘柄に「AI目標株価（target_price）」「期待上昇余地%（upside_percent）」「損切り目安（stop_loss_price）」を必ず算出してください。

必ず以下のJSON形式のみを出力してください（Markdownのバッククォート等で囲んで構いません）:
{
  "picks": [
    {
      "horizon": "short",
      "ticker": "6920",
      "name": "レーザーテック",
      "current_price": 24150,
      "target_price": 28500,
      "upside_percent": 18.0,
      "stop_loss_price": 22000,
      "sector": "電気機器",
      "catalyst": "上昇のきっかけ・注目材料",
      "ai_analysis": "なぜ今これが狙い目なのか（業績・テーマ・需給を踏まえた詳細分析）",
      "risk_factors": "注意すべき下落リスク"
    },
    {
      "horizon": "short",
      "ticker": "5253",
      "name": "カバー",
      "current_price": 2450,
      "target_price": 2980,
      "upside_percent": 21.6,
      "stop_loss_price": 2220,
      "sector": "情報・通信業",
      "catalyst": "注目材料",
      "ai_analysis": "詳細分析",
      "risk_factors": "リスク要因"
    },
    {
      "horizon": "mid",
      "ticker": "7203",
      "name": "トヨタ自動車",
      "current_price": 2785.5,
      "target_price": 3300,
      "upside_percent": 18.5,
      "stop_loss_price": 2550,
      "sector": "輸送用機器",
      "catalyst": "注目材料",
      "ai_analysis": "詳細分析",
      "risk_factors": "リスク要因"
    },
    {
      "horizon": "mid",
      "ticker": "8035",
      "name": "東京エレクトロン",
      "current_price": 26800,
      "target_price": 31500,
      "upside_percent": 17.5,
      "stop_loss_price": 24500,
      "sector": "電気機器",
      "catalyst": "注目材料",
      "ai_analysis": "詳細分析",
      "risk_factors": "リスク要因"
    },
    {
      "horizon": "long",
      "ticker": "8306",
      "name": "三菱UFJフィナンシャルG",
      "current_price": 1540,
      "target_price": 1880,
      "upside_percent": 22.1,
      "stop_loss_price": 1410,
      "sector": "銀行業",
      "catalyst": "注目材料",
      "ai_analysis": "詳細分析",
      "risk_factors": "リスク要因"
    },
    {
      "horizon": "long",
      "ticker": "9432",
      "name": "NTT",
      "current_price": 148.5,
      "target_price": 185,
      "upside_percent": 24.6,
      "stop_loss_price": 135,
      "sector": "情報・通信業",
      "catalyst": "注目材料",
      "ai_analysis": "詳細分析",
      "risk_factors": "リスク要因"
    }
  ]
}
※ horizonは "short" | "mid" | "long"
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        if (Array.isArray(parsed.picks) && parsed.picks.length > 0) {
          generatedPicks = parsed.picks.map((p: any) => enrichPickItem({
            ...p,
            target_date: targetDate,
          }));
        }
      } catch (geminiError) {
        console.warn('Gemini weekend picks error (using default picks):', geminiError);
      }
    }

    // 3. キャッシュ保存
    memoryPicksCache.set(targetDate, generatedPicks);

    if (supabase) {
      try {
        await supabase
          .from('weekend_stock_picks')
          .insert(
            generatedPicks.map((p) => ({
              target_date: p.target_date,
              horizon: p.horizon,
              ticker: p.ticker,
              name: p.name,
              current_price: p.current_price,
              sector: p.sector,
              catalyst: p.catalyst,
              ai_analysis: p.ai_analysis,
              risk_factors: p.risk_factors,
            }))
          );
      } catch (insertError) {
        console.warn('Supabase weekend picks insert warning:', insertError);
      }
    }

    return NextResponse.json({
      cached: false,
      target_date: targetDate,
      picks: formatPicksResponse(generatedPicks, horizon),
    });
  } catch (error: any) {
    console.error('Error in /api/weekend-picks:', error);
    return NextResponse.json(
      { error: error.message || 'Weekend picks server error' },
      { status: 500 }
    );
  }
}

// 再生成リクエスト (POST)
export async function POST(request: NextRequest) {
  try {
    const todaySaturday = getLatestSaturdayDate();
    // キャッシュを消してGETを実行
    memoryPicksCache.delete(todaySaturday);

    if (supabase) {
      try {
        await supabase
          .from('weekend_stock_picks')
          .delete()
          .eq('target_date', todaySaturday);
      } catch (e) {
        console.warn(e);
      }
    }

    return GET(request);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function formatPicksResponse(
  items: WeekendPickItem[],
  horizon: 'short' | 'mid' | 'long' | 'all' | null
): Record<'short' | 'mid' | 'long', WeekendPickItem[]> | WeekendPickItem[] {
  if (horizon && horizon !== 'all') {
    return items.filter((i) => i.horizon === horizon);
  }

  return {
    short: items.filter((i) => i.horizon === 'short'),
    mid: items.filter((i) => i.horizon === 'mid'),
    long: items.filter((i) => i.horizon === 'long'),
  };
}
