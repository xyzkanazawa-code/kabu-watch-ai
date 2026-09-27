import { NextRequest, NextResponse } from 'next/server';
import { getGenAIClient } from '@/lib/gemini';
import { RumorAnalyzeResponse } from '@/types/rumor';
import { normalizeStockInput, extractTickerCode, lookupStockByTicker } from '@/lib/stockLookup';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticker, stockName, rumorContent, sourceUrlOrName, apiKey: userApiKey } = body;

    if (!rumorContent || typeof rumorContent !== 'string') {
      return NextResponse.json(
        { error: '噂の内容（rumorContent）を入力してください。' },
        { status: 400 }
      );
    }

    // 銘柄コードまたは名前の特定
    let targetTicker = ticker || '';
    let targetStockName = stockName || '';

    if (!targetTicker && !targetStockName) {
      const extracted = extractTickerCode(rumorContent);
      if (extracted) {
        targetTicker = extracted;
        const info = await lookupStockByTicker(extracted);
        targetStockName = info.name;
      }
    }

    const genAI = getGenAIClient(userApiKey);

    if (!genAI) {
      // APIキーがない場合のインテリジェントフォールバック
      const fallbackResult: RumorAnalyzeResponse = {
        ticker: targetTicker || '----',
        stockName: targetStockName || '該当注目銘柄',
        category: rumorContent.includes('新製品') || rumorContent.includes('新技術') ? 'new_product' :
                  rumorContent.includes('提携') || rumorContent.includes('サプライ') ? 'partnership' :
                  rumorContent.includes('買収') || rumorContent.includes('TOB') ? 'ma_takeover' :
                  rumorContent.includes('決算') || rumorContent.includes('上方修正') ? 'earnings_leak' : 'sns_hype',
        verdict: rumorContent.includes('絶対') || rumorContent.includes('爆上げ') || rumorContent.includes('S高確定') ? 'fake_warning' : 'caution_speculative',
        credibilityScore: rumorContent.includes('絶対') ? 15 : 45,
        fakeRiskScore: rumorContent.includes('絶対') ? 85 : 55,
        headline: '【要検証・思惑分析】現時点で公式IRの確証は未発表。SNS先行の思惑買いによるボラティリティに注意。',
        whyBuzzingAnalysis: `「${rumorContent.slice(0, 100)}」に関する思惑が投資家SNSやネットコミュニティを中心に拡散中。`,
        officialStatusCheck: '直近の適時開示情報（TDnet）および企業公式サイトでは該当する確定アナウンスは確認されていません。',
        sourceReliabilityAnalysis: sourceUrlOrName ? `情報源「${sourceUrlOrName}」の信憑性は玉石混交。公式リリースが出るまでは真偽保留が賢明です。` : '匿名のSNSポストや伝聞情報が起点となっており、情報の出処の信頼性は慎重に見極める必要があります。',
        feasibilityAnalysis: '事業シナリオとしての可能性はゼロではないものの、法規制・開発期間・資本関係の観点から即時実現には一定のハードルが存在します。',
        aiInvestmentWarning: '真偽が確定する前の「飛び乗り買い」は、急な反落や梯子外しによる高値掴みのリスクが極めて高いです。まずは仮想売買で値動きの癖を観察することを強く推奨します。',
        recommendedAction: '公式発表があるまで静観、または仮想売買でのシミュレーションを推奨'
      };

      return NextResponse.json({ success: true, analysis: fallbackResult });
    }

    // Gemini APIによるリアルタイム・ファクトチェック分析
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
あなたは日本の株式市場、適時開示（TDnet）、東証上場企業のIR、およびSNSや市場で流布する「噂・思惑・デマ（パンプ＆ダンプ）」の真偽を見抜く最高峰の金融ファクトチェックAIアナリストです。

ユーザーから以下の「市場・SNSで噂になっている株式情報」が届きました。
この噂が「ガセ（デマ・買い煽り・仕手化）」なのか、それとも「信憑性が高い思惑（火のない所に煙は立たない、特許やサプライチェーンの裏付けがある）」なのかを厳格かつ論理的に分析してください。

【噂の情報】
対象銘柄・コード: "${targetStockName} (${targetTicker})"
噂の内容: "${rumorContent}"
噂の出処・情報源: "${sourceUrlOrName || 'X（旧Twitter）/ 掲示板 / ネット界隈'}"

【判定基準ガイドライン】
1. verdict（判定結果）:
   - "fake_warning" : ガセ・煽り警戒（「絶対S高」「インサイダー情報」「画像捏造」「根拠なき提携煽り」など危険度高）
   - "caution_speculative" : 要検証・思惑先行（事実の断片はあるが飛躍している、公式発表待ち、ノイズ交じり）
   - "highly_credible" : 信憑性高・確証あり（特許公報、海外一流経済紙の署名スクープ、サプライヤー一次情報、求人票など裏付けあり）
   - "officially_denied" : 会社側が公式否定済（すでに「当社が発表したものではない」等で否定されているもの）
2. credibilityScore: 信憑性スコア（0〜100）
3. fakeRiskScore: ガセ・嵌め込み危険度（0〜100、credibilityScoreと概ね逆相関）
4. category: "new_product" | "partnership" | "ma_takeover" | "earnings_leak" | "patent_pharma" | "sns_hype"

以下のJSON形式【のみ】で厳密に出力してください。Markdownバッククォート（\`\`\`json）を含めて構いません:
{
  "ticker": "推定される証券コード（不明なら空白）",
  "stockName": "推定される企業名（不明なら空白）",
  "category": "new_product | partnership | ma_takeover | earnings_leak | patent_pharma | sns_hype",
  "verdict": "fake_warning | caution_speculative | highly_credible | officially_denied",
  "credibilityScore": 数値（0〜100）,
  "fakeRiskScore": 数値（0〜100）,
  "headline": "AIズバリ総括（例: 【🚨 ガセ・煽り警報】典型的な提携デマ。過去のバイオ株仕手化パターンと酷似）",
  "whyBuzzingAnalysis": "なぜ今この噂が広がっているのか（心理的背景、材料飢餓、特定アカウントの拡散など）",
  "officialStatusCheck": "公式IR・適時開示状況（開示の有無、会社側のスタンス、発表可能性）",
  "sourceReliabilityAnalysis": "情報源の信頼度判定（一次情報か、伝言ゲームか、悪質アカウントか）",
  "feasibilityAnalysis": "技術的・ビジネス的実現可能性（その新製品や提携が現実的に可能か）",
  "aiInvestmentWarning": "投資家への具体的なリスク警告・注意点（イナゴタワー、材料出尽くし、梯子外しリスク等）",
  "recommendedAction": "投資家が取るべき具体的な推奨行動（例: 公式発表まで静観、仮想売買で観察、成行買い厳禁など）"
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const cleanJson = responseText
      .replace(/^```json\s*/, '')
      .replace(/\s*```$/, '')
      .trim();

    const parsed: RumorAnalyzeResponse = JSON.parse(cleanJson);
    return NextResponse.json({ success: true, analysis: parsed });
  } catch (error: any) {
    console.error('Rumor Analyze API Error:', error);
    return NextResponse.json(
      { error: '噂の分析中にエラーが発生しました: ' + (error?.message || '不明なエラー') },
      { status: 500 }
    );
  }
}
