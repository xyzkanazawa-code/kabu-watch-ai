export type CategoryType = 
  | 'earnings'        // 🟣 決算
  | 'forecast'        // 🔵 業績予想修正
  | 'dividend'        // 🟢 配当・株主還元
  | 'buyback'         // 🟠 自社株買い・消却
  | 'ma'              // 🔴 M&A
  | 'partnership'     // 🟡 業務提携・資本提携
  | 'product'         // 🟤 新商品・新技術
  | 'personnel'       // ⚪ 人事・組織変更
  | 'news'            // 📰 ニュース
  | 'monthly'          // 📊 月次情報
  | 'other';          // 🟢 その他

export interface PtsInfo {
  price: number;              // 夜間PTS株価
  change: number;             // 東証終値比 金額
  changePercent: number;      // 東証終値比 %
  time?: string;              // PTS約定時間 (例: 20:45)
}

export interface StockBasic {
  ticker: string;        // 4桁コード (例: 7203)
  name: string;          // 企業名 (例: トヨタ自動車)
  market: string;        // プライム, スタンダード, グロース
  sector: string;        // 輸送用機器, 電気機器 等
  price: number;         // 現在値
  change: number;        // 前日比金額
  changePercent: number; // 前日比%
  volume: number;        // 出来高
  prevClose: number;     // 終値
  pts?: PtsInfo;         // 🌙 夜間PTS取引情報
}


export interface CreditMetrics {
  buyBalance: number;    // 信用買い残
  sellBalance: number;   // 信用売り残
  ratio: number;         // 信用倍率
  lastUpdated: string;   // 更新日
}

export interface FinancialMetrics {
  per: number;
  pbr: number;
  roe: number;
  dividendYield: number; // 配当利回り %
  nextEarningsDate: string; // 次回決算予定日
  marketCap: number;     // 時価総額（億円）
}

export interface StockInfo extends StockBasic {
  credit: CreditMetrics;
  financials: FinancialMetrics;
  description: string;
}

export interface ImpactMatrix {
  importanceScore: 1 | 2 | 3 | 4 | 5; // ★★★★★ (1~5)
  earningsImpact: 'あり' | '軽微' | 'なし';
  financialImpact: 'あり' | 'なし';
  businessImpact: '大' | '中' | '小';
  marketImpact: '短期急騰の可能性' | '要確認' | '織り込み済み';
}

export interface StockImpactAnalysis {
  salesImpact: { type: 'プラス' | 'マイナス' | '中立'; detail: string };
  profitImpact: { type: 'プラス' | 'マイナス' | '中立'; detail: string };
  fullYearForecastImpact: { type: '上方修正余地あり' | '懸念あり' | '影響なし'; detail: string };
  competitorImpact: string;
  shortTermCatalyst: string;
  midLongTermPoints: string;
}

export interface PartnerCompanyInfo {
  name: string;
  listedStatus: '上場' | '非上場' | '海外上場';
  established: string;
  location: string;
  representative: string;
  business: string;
  mainProducts: string[];
  recentRevenue: string;
  majorShareholders: string[];
  pastRelationship: string;
  partnershipCore: string;
  synergyPrediction: string; // AI分析：シナジー予測
}

export interface NewsItem {
  id: string;
  ticker: string;
  stockName: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  snippet: string;
  category: CategoryType;
  impactMatrix?: ImpactMatrix;
  impactAnalysis?: StockImpactAnalysis;
  partnerInfo?: PartnerCompanyInfo;
  isNew?: boolean;
}

export interface DisclosureItem {
  id: string;
  ticker: string;
  stockName: string;
  title: string;
  publishedAt: string;
  pdfUrl: string;
  originalUrl: string;
  category: CategoryType;
  impactMatrix?: ImpactMatrix;
  aiSummary?: string;
  impactAnalysis?: StockImpactAnalysis;
  partnerInfo?: PartnerCompanyInfo;
  isNew?: boolean;
}

export interface TimelineItem {
  id: string;
  ticker: string;
  stockName: string;
  title: string;
  type: 'news' | 'disclosure' | 'earnings' | 'partnership' | 'product' | 'monthly';
  publishedAt: string;
  category: CategoryType;
  sourceOrPdf: string; // 出典またはPDF URL
  url: string;
  snippet?: string;
  impactMatrix?: ImpactMatrix;
  isNew?: boolean;
  rawNewsItem?: NewsItem;
  rawDisclosureItem?: DisclosureItem;
}

export interface FinancialTrend {
  period: string; // 2022/3, 2023/3, 2024/3, 2025/3(予)
  sales: number;  // 売上高(億円)
  operatingProfit: number; // 営業益(億円)
  netProfit: number; // 純利益(億円)
  eps: number;
}

export interface ProductItem {
  name: string;
  category: string;
  share: string;
  description: string;
}

export interface GlobalInfoItem {
  region: string; // 北米, 中国, 欧州, アジア 等
  salesRatio: string;
  description: string;
}

export interface SemanticSearchResult {
  ticker: string;
  name: string;
  sector: string;
  relevanceReason: string;
  representativeProducts: string[];
  confidenceScore: number;
}

export interface StockOverviewAI {
  summary: string;
  whatCompany?: string;       // 【何の会社か】事業内容、世界シェア、主力製品、売上構成
  latestEarnings?: string;    // 【直近の決算】売上・利益、受注高・受注残、市場反応と急騰落の背景
  recentTrends?: string[];    // 【最近の動き】新製品、アナリスト目標株価、報道、株主還元
  indicators?: string;        // 【株価の指標と需給】PER、PBR、利回り、時価総額、信用倍率・重さ
  bullPoints?: string[];      // 【強気材料】成長性、受注残、上方修正余地
  riskPoints?: string[];      // 【リスク】市況の波、中国依存、需給の重さ等
  nextCatalysts?: string;     // 【次の大きなイベント】次回決算時期と焦点
  sources?: string[];         // 【主な出典】開示資料、株探、Yahoo!ファイナンス等
  catalysts: string[];        // 互換性維持
  risks: string[];            // 互換性維持
  investmentOutlook: string;  // 互換性維持
}

// 仮想売買・保有ポートフォリオ型
export interface PortfolioItem {
  id: string; // UUID
  ticker: string; // 銘柄コード (例: "7203")
  name: string; // 企業名 (例: "トヨタ自動車")
  type: 'simulation' | 'real'; // 仮想売買 or 実際の保有
  tradeType: 'spot' | 'margin_buy' | 'margin_sell'; // 現物 / 信用買 / 信用売
  shares: number; // 株数 (例: 100)
  entryPrice: number; // 購入単価 (約定価格・終値)
  entryDate: string; // 購入日 (YYYY-MM-DD)
  expiryDate?: string; // 信用期日 (YYYY-MM-DD、制度信用の場合は買付日から6ヶ月後など)
  currentPrice: number; // 最新終値 (APIで自動更新)
  prevClose?: number; // 前日終値
  notes?: string; // メモ (「〇〇のニュースを見て購入」等)
  settledAt?: string; // 決済日時
  settlePrice?: number; // 決済単価
}

// AIポートフォリオ診断結果型
export interface PortfolioAuditResult {
  score: 'A' | 'B' | 'C' | 'D' | 'E';
  scoreReason: string;
  sectorDistribution: {
    sector: string;
    ratio: number;
    amount: number;
  }[];
  sectorAnalysis: string;
  risksAndCatalysts: {
    ticker: string;
    stockName: string;
    title: string;
    impact: string;
    urgency: '高' | '中' | '低';
  }[];
  marginAdvice: string;
  actionProposals: string[];
}

// 市場ランキング型
export type RankingCategoryType = 'gainers' | 'losers' | 'volume' | 'stop_high' | 'stop_low';

export interface RankingItem {
  id?: string;
  ranking_type: RankingCategoryType;
  rank_position: number;
  ticker: string;
  name: string;
  price: number;
  change_percent: number;
  volume: number;
  ai_reason: string;
  updated_date?: string;
}

// 週末AIおすすめ厳選銘柄型
export interface WeekendPickItem {
  id?: string;
  target_date: string;
  horizon: 'short' | 'mid' | 'long';
  ticker: string;
  name: string;
  current_price: number;
  target_price?: number;     // AI目標株価
  upside_percent?: number;   // 上昇期待余地%
  stop_loss_price?: number;  // ロスカット目安
  sector: string;
  catalyst: string;
  ai_analysis: string;
  risk_factors: string;
}


