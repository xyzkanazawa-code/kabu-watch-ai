export interface CommunityInvestor {
  id: string;
  name: string;
  avatarUrl: string;
  title: string;          // 投資スタイル（例: 「半導体・AIモメンタム投資」「中小型成長株ハンター」）
  bio: string;
  winRate: number;        // 勝率 (%)
  totalPnLAmount: number; // 累計損益額 (円)
  totalPnLPercent: number;// 累計損益率 (%)
  isCurrentUser?: boolean;
  virtualPositions: {
    ticker: string;
    name: string;
    tradeType: 'spot' | 'margin_buy' | 'margin_sell';
    entryPrice: number;
    currentPrice: number;
    shares: number;
    pnlPercent: number;
    pnlAmount: number;
    entryDate: string;
    notes: string;
  }[];
  watchList: {
    ticker: string;
    name: string;
    sector: string;
    price: number;
    changePercent: number;
    reason?: string;
  }[];
}

// サンプル投資家データ（マサのデータと合算してリアルタイム生成）
export const DEFAULT_COMMUNITY_INVESTORS: CommunityInvestor[] = [
  {
    id: 'trader-1',
    name: 'カブキチ@半導体スイング',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    title: '半導体・AIサプライチェーン特化',
    bio: 'EUV露光・AI半導体の材料株を中心にテクニカルと決算モメンタムでトレード。',
    winRate: 78.5,
    totalPnLAmount: 2450000,
    totalPnLPercent: 48.6,
    virtualPositions: [
      {
        ticker: '6920',
        name: 'レーザーテック',
        tradeType: 'margin_buy',
        entryPrice: 22800,
        currentPrice: 24150,
        shares: 100,
        pnlPercent: 5.92,
        pnlAmount: 135000,
        entryDate: '2026-09-01',
        notes: 'EUV次世代マスク検査装置の受注残急増でエントリー。高値ブレイク狙い。',
      },
      {
        ticker: '186A',
        name: 'アストロスケールHD',
        tradeType: 'spot',
        entryPrice: 820,
        currentPrice: 1140,
        shares: 1500,
        pnlPercent: 39.02,
        pnlAmount: 480000,
        entryDate: '2026-08-20',
        notes: '宇宙デブリ除去の国家プロジェクト受注開示で現物初動買い。',
      },
      {
        ticker: '6857',
        name: 'アドバンテスト',
        tradeType: 'margin_buy',
        entryPrice: 6100,
        currentPrice: 7280,
        shares: 400,
        pnlPercent: 19.34,
        pnlAmount: 472000,
        entryDate: '2026-08-10',
        notes: 'AIテスター需要の爆発的な拡大。好決算後の押し目拾い。',
      }
    ],
    watchList: [
      { ticker: '7011', name: '三菱重工業', sector: '機械・防衛', price: 2150, changePercent: 3.4, reason: '防衛予算増額と宇宙H3関連' },
      { ticker: '6758', name: 'ソニーグループ', sector: '電気機器', price: 2890, changePercent: -0.5, reason: 'イメージセンサー新工場稼働' },
      { ticker: '9984', name: 'ソフトバンクグループ', sector: '情報・通信', price: 8940, changePercent: 2.1, reason: 'Arm出資とAIデータセンター投資' },
    ]
  },
  {
    id: 'trader-2',
    name: 'リンカ@バリュー＆テーマ株',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    title: '高配当＆自社株買い重視の堅実派',
    bio: '東証PBR1倍割れ改革銘柄やキャッシュリッチ企業の還元強化をウォッチしています。',
    winRate: 83.3,
    totalPnLAmount: 1820000,
    totalPnLPercent: 32.4,
    virtualPositions: [
      {
        ticker: '7203',
        name: 'トヨタ自動車',
        tradeType: 'spot',
        entryPrice: 2580,
        currentPrice: 2785.5,
        shares: 800,
        pnlPercent: 7.97,
        pnlAmount: 164400,
        entryDate: '2026-07-15',
        notes: '全固体電池の量産ロードマップ開示を確認して現物長期。',
      },
      {
        ticker: '8058',
        name: '三菱商事',
        tradeType: 'spot',
        entryPrice: 2950,
        currentPrice: 3420,
        shares: 600,
        pnlPercent: 15.93,
        pnlAmount: 282000,
        entryDate: '2026-06-10',
        notes: '5000億円の大規模自社株買いと累進配当方針を評価。',
      },
      {
        ticker: '8306',
        name: '三菱UFJフィナンシャルG',
        tradeType: 'spot',
        entryPrice: 1420,
        currentPrice: 1680,
        shares: 1000,
        pnlPercent: 18.31,
        pnlAmount: 260000,
        entryDate: '2026-05-20',
        notes: '日銀利上げによる純金利マージン（NIM）拡大恩恵。',
      }
    ],
    watchList: [
      { ticker: '9432', name: '日本電信電話 (NTT)', sector: '通信', price: 158.5, changePercent: 0.8, reason: '25分割後の少額積立・配当' },
      { ticker: '8031', name: '三井物産', sector: '商社', price: 3250, changePercent: 1.2, reason: '資源高と脱炭素LNG投資' },
      { ticker: '4063', name: '信越化学工業', sector: '化学', price: 5900, changePercent: -1.1, reason: 'シリコンウェハー世界首位' },
    ]
  },
  {
    id: 'trader-3',
    name: 'ダイキ@急騰材料ハンター',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    title: '適時開示・業務提携の初動狙い',
    bio: 'AIや大手企業との協業ニュースを瞬時にAIスクリーニングして飛び乗る短期派です。',
    winRate: 64.2,
    totalPnLAmount: 3100000,
    totalPnLPercent: 62.8,
    virtualPositions: [
      {
        ticker: '3778',
        name: 'さくらインターネット',
        tradeType: 'margin_buy',
        entryPrice: 3800,
        currentPrice: 5120,
        shares: 300,
        pnlPercent: 34.74,
        pnlAmount: 396000,
        entryDate: '2026-08-25',
        notes: '経産省クラウド整備補助金の追加採択ニュースで制度信用買い。',
      },
      {
        ticker: '7011',
        name: '三菱重工業',
        tradeType: 'margin_buy',
        entryPrice: 1820,
        currentPrice: 2150,
        shares: 1000,
        pnlPercent: 18.13,
        pnlAmount: 330000,
        entryDate: '2026-08-15',
        notes: '次世代戦闘機共同開発および防衛受注残高1兆円超え材料。',
      }
    ],
    watchList: [
      { ticker: '6920', name: 'レーザーテック', sector: '精密機器', price: 24150, changePercent: 2.8, reason: '空売り比率低下のショートスクイズ狙い' },
      { ticker: '186A', name: 'アストロスケール', sector: '宇宙', price: 1140, changePercent: 5.6, reason: '米国防総省案件観測' },
    ]
  },
  {
    id: 'trader-4',
    name: 'ハルカ@AIアナリスト信奉者',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    title: 'Gemini AI診断スコア90以上選定',
    bio: '株ウォッチAIのGeminiインパクト分析で高スコアが出た銘柄だけを忠実にシミュレーション中！',
    winRate: 85.0,
    totalPnLAmount: 1450000,
    totalPnLPercent: 28.5,
    virtualPositions: [
      {
        ticker: '9984',
        name: 'ソフトバンクグループ',
        tradeType: 'margin_buy',
        entryPrice: 8400,
        currentPrice: 8940,
        shares: 200,
        pnlPercent: 6.43,
        pnlAmount: 108000,
        entryDate: '2026-09-05',
        notes: 'AIインパクト分析スコア5/5。ArmのAI半導体設計好調。',
      },
      {
        ticker: '6758',
        name: 'ソニーグループ',
        tradeType: 'spot',
        entryPrice: 2750,
        currentPrice: 2890,
        shares: 400,
        pnlPercent: 5.09,
        pnlAmount: 56000,
        entryDate: '2026-09-10',
        notes: 'PS5 Pro発表と音楽・アニメIPの世界収益拡大。',
      }
    ],
    watchList: [
      { ticker: '7203', name: 'トヨタ自動車', sector: '自動車', price: 2785.5, changePercent: 1.5, reason: 'AI自動運転ウェイモ提携観測' },
      { ticker: '8058', name: '三菱商事', sector: '商社', price: 3420, changePercent: 0.9, reason: 'AIデータセンター向け再エネ電源供給' },
    ]
  }
];
