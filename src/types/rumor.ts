export type RumorVerdict = 
  | 'fake_warning'        // 🚨 ガセ・煽り警戒（信憑性低・イナゴリスク大）
  | 'caution_speculative' // 🔍 要検証・思惑先行（火種はあるが未確認）
  | 'highly_credible'     // ✅ 信憑性高（公式発表間近・外堀が埋まっている）
  | 'officially_denied';  // 📢 会社側が公式否定済（沈静化）

export type RumorCategory =
  | 'new_product'   // 新製品・新技術・ブレイクスルー
  | 'partnership'   // 大手企業との提携・サプライチェーン入り
  | 'ma_takeover'   // TOB・買収観測・大株主浮上
  | 'earnings_leak' // 業績サプライズ・上方修正リーク
  | 'patent_pharma' // 特許公報・新薬承認思惑
  | 'sns_hype';     // X/掲示板の煽り・仕手筋思惑

export interface RumorItem {
  id: string;
  ticker: string;
  stockName: string;
  market: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  
  // 噂の概要
  title: string;
  category: RumorCategory;
  buzzLevel: '🔥 過熱・大バズ' | '⚡ 急上昇' | '👀 観測・ささやき';
  sourceMedia: string; // 例: "X (旧Twitter) 投資インフルエンサー界隈", "海外半導体サプライチェーン筋"
  detectedDate: string; // 例: "2026/09/27"
  rumorSummary: string; // 噂の具体的な内容
  
  // なぜ噂になっているか（背景・発端）
  whyBuzzing: {
    origin: string; // 発端（例: 「Xでリーク写真が拡散」「特許出願に社名記載」）
    spreadPath: string; // 拡散経路（例: 「投資系アカウントが拡散後、出来高が前日比3倍」）
    marketReaction: string; // 株価の初動反応
  };

  // AIによるガセ判定＆信憑性分析
  aiVerdict: {
    verdict: RumorVerdict;
    credibilityScore: number; // 0〜100% (信憑性スコア)
    fakeRiskScore: number;    // 0〜100% (ガセ危険度)
    headline: string;         // AIズバリ総括
    factCheckPoints: {
      officialStatus: string;       // 公式IR・適時開示状況
      sourceReliability: string;    // 情報源の信頼度判定
      technicalFeasibility: string; // 技術的・ビジネス的実現可能性
    };
    aiWarning: string;        // 投資家への警告・アドバイス
    recommendedAction: 'wait_official' | 'virtual_try' | 'avoid_fomo' | 'catalyst_watch';
  };
}

export interface RumorAnalyzeRequest {
  ticker?: string;
  stockName?: string;
  rumorContent: string;
  sourceUrlOrName?: string;
}

export interface RumorAnalyzeResponse {
  ticker: string;
  stockName: string;
  category: RumorCategory;
  verdict: RumorVerdict;
  credibilityScore: number;
  fakeRiskScore: number;
  headline: string;
  whyBuzzingAnalysis: string;
  officialStatusCheck: string;
  sourceReliabilityAnalysis: string;
  feasibilityAnalysis: string;
  aiInvestmentWarning: string;
  recommendedAction: string;
}
