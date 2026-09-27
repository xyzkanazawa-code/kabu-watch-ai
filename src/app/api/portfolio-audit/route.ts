import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PortfolioItem, PortfolioAuditResult } from '@/types/stock';
import { STOCK_MASTER } from '@/lib/dataFetcher';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(request: NextRequest) {
  try {
    const { items }: { items: PortfolioItem[] } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'ポートフォリオに銘柄が登録されていません。' },
        { status: 400 }
      );
    }

    // 1. 各銘柄のセクター・時価・損益サマリーを計算
    const sectorMap: Record<string, number> = {};
    let totalValue = 0;

    const summaryText = items
      .map((item) => {
        const master = STOCK_MASTER[item.ticker];
        const sector = master?.sector || 'その他';
        const shares = item.shares;
        const entryPrice = item.entryPrice;
        const currentPrice = item.currentPrice || entryPrice;
        const val = currentPrice * shares;
        const pnl = (currentPrice - entryPrice) * shares;
        const pnlPct = (((currentPrice - entryPrice) / entryPrice) * 100).toFixed(1);

        totalValue += val;
        sectorMap[sector] = (sectorMap[sector] || 0) + val;

        return `・銘柄: ${item.name} (${item.ticker}) / 業種: ${sector} / 区分: ${item.tradeType} (${item.type === 'simulation' ? '仮想' : '実保有'}) / 株数: ${shares}株 / 取得単価: ¥${entryPrice} / 現在値: ¥${currentPrice} / 損益: ${pnl >= 0 ? '+' : ''}${pnl}円 (${pnlPct}%) ${item.expiryDate ? `/ 信用期日: ${item.expiryDate}` : ''} ${item.notes ? `/ メモ: ${item.notes}` : ''}`;
      })
      .join('\n');

    // セクター分散計算
    const sectorDistribution = Object.entries(sectorMap).map(([sector, amount]) => ({
      sector,
      amount,
      ratio: totalValue > 0 ? Math.round((amount / totalValue) * 100) : 0,
    })).sort((a, b) => b.ratio - a.ratio);

    // Gemini APIによる診断
    if (!genAI) {
      return NextResponse.json(getFallbackAudit(sectorDistribution, items));
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `
あなたは日本のプロ株式ファンドマネージャー兼AI投資アドバイザーです。
以下の個人投資家の保有ポートフォリオ（仮想売買を含む）を徹底的に総合診断してください。

【保有銘柄一覧】
${summaryText}

【セクター構成】
${sectorDistribution.map((s) => `${s.sector}: ${s.ratio}% (約${Math.round(s.amount / 10000)}万円)`).join('、 ')}

必ず以下のJSON形式のみで出力してください。Markdownのコードブロック(バッククォート)や余計な解説は含めないでください。
{
  "score": "A",
  "scoreReason": "分散性やリスクリワードに基づいたスコア判定の簡潔な理由",
  "sectorAnalysis": "セクターの偏り、マクロ経済や為替（円安/円高）に対する脆弱性の解説",
  "risksAndCatalysts": [
    {
      "ticker": "7203",
      "stockName": "トヨタ自動車",
      "title": "直近の注目材料またはリスク要因",
      "impact": "業績や株価へのプラス/マイナスの具体的影響",
      "urgency": "高"
    }
  ],
  "marginAdvice": "信用買い・売りポジションの期日管理や信用倍率・需給を踏まえた手仕舞い/ヘッジ助言（期日が近い銘柄への注意喚起を含む）",
  "actionProposals": [
    "アクション提案1（利確や損切りの目安）",
    "アクション提案2（買い増しやヘッジ視点）",
    "アクション提案3（セクター分散の改善案）"
  ]
}
※ scoreは "A" | "B" | "C" | "D" | "E" (Aが最高、Eがリスク過多)
※ urgencyは "高" | "中" | "低"
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const auditResponse: PortfolioAuditResult = {
        score: parsed.score || 'B',
        scoreReason: parsed.scoreReason || 'セクター分散と損益状況に基づいた総合評価です。',
        sectorDistribution,
        sectorAnalysis: parsed.sectorAnalysis || '主要産業への配分が確認されます。',
        risksAndCatalysts: parsed.risksAndCatalysts || [],
        marginAdvice: parsed.marginAdvice || '信用期日の接近やレバレッジリスクに留意してください。',
        actionProposals: parsed.actionProposals || ['定期的なリバランスを推奨します。'],
      };

      return NextResponse.json(auditResponse);
    } catch (apiError) {
      console.error('Gemini Audit API Error:', apiError);
      return NextResponse.json(getFallbackAudit(sectorDistribution, items));
    }
  } catch (error: any) {
    console.error('Portfolio Audit error:', error);
    return NextResponse.json(
      { error: error.message || 'Audit error' },
      { status: 500 }
    );
  }
}

// フォールバック診断
function getFallbackAudit(
  sectorDistribution: { sector: string; ratio: number; amount: number }[],
  items: PortfolioItem[]
): PortfolioAuditResult {
  const topSector = sectorDistribution[0]?.sector || '製造業';
  const hasMargin = items.some((i) => i.tradeType !== 'spot');

  return {
    score: 'B',
    scoreReason: `主要セクター（${topSector}）を中心に構成されており、一定の収益基盤と成長性が確保されていますが、分散余地があります。`,
    sectorDistribution,
    sectorAnalysis: `${topSector}への配分比率が高く、業界特有のマクロ要因（為替動向や金利局面、主要原材料価格）の影響を受けやすい構造です。ディフェンシブセクターや情報通信への分散が有効です。`,
    risksAndCatalysts: items.slice(0, 3).map((item) => ({
      ticker: item.ticker,
      stockName: item.name,
      title: `${item.name}の直近業績進捗とテーマ性`,
      impact: '本業の収益性は堅調ですが、急激な市場環境変化による押し目での値動きに注意が必要です。',
      urgency: '中',
    })),
    marginAdvice: hasMargin
      ? '信用期日（6ヶ月）までの残日数と信用買い残の推移を確認してください。期日直前の投げ売りを回避するため、早めの利確・損切りライン設定を推奨します。'
      : '現物中心の安全性の高い構成です。急落時にも追証リスクなく中長期での保有継続が可能です。',
    actionProposals: [
      `含み益が乗っている銘柄は一部利確（トレーリングストップ）を検討`,
      `セクター集中度を下げるため、異なる値動きをする資産の追加検討`,
      `信用期日まで30日を切ったポジションは反対売買方針を前もって確定`,
    ],
  };
}
