import { PortfolioItem } from '@/types/stock';
import { STOCK_MASTER } from './dataFetcher';

const PORTFOLIO_STORAGE_KEY = 'kabu_watch_ai_portfolio_v1';
const HISTORY_STORAGE_KEY = 'kabu_watch_ai_trade_history_v1';

// 初期サンプルデータ（初回起動時に空の場合にセット）
const DEFAULT_INITIAL_PORTFOLIO: PortfolioItem[] = [
  {
    id: 'sample-1',
    ticker: '7203',
    name: 'トヨタ自動車',
    type: 'real',
    tradeType: 'spot',
    shares: 200,
    entryPrice: 2650.0,
    entryDate: '2026-08-15',
    currentPrice: 2785.5,
    prevClose: 2743.5,
    notes: '全固体電池の量産ロードマップ開示を確認して現物長期保有。',
  },
  {
    id: 'sample-2',
    ticker: '6920',
    name: 'レーザーテック',
    type: 'simulation',
    tradeType: 'margin_buy',
    shares: 100,
    entryPrice: 22800.0,
    entryDate: '2026-09-01',
    expiryDate: '2027-03-01',
    currentPrice: 24150.0,
    prevClose: 23300.0,
    notes: 'EUVマスク検査装置の受注残拡大ニュースを機に仮想売買エントリー。',
  },
  {
    id: 'sample-3',
    ticker: '9984',
    name: 'ソフトバンクグループ',
    type: 'real',
    tradeType: 'margin_buy',
    shares: 100,
    entryPrice: 8650.0,
    entryDate: '2026-07-10',
    expiryDate: '2026-10-15', // 残り約20日の要注意アラート例
    currentPrice: 8940.0,
    prevClose: 8710.0,
    notes: 'AIビジョンファンドの出資先上場観測で制度信用買い。',
  },
];

/**
 * ポートフォリオ一覧の取得 (LocalStorage)
 */
export function getPortfolioItems(): PortfolioItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_PORTFOLIO));
      return DEFAULT_INITIAL_PORTFOLIO;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load portfolio items:', e);
    return [];
  }
}

/**
 * ポートフォリオ一覧の保存
 */
export function savePortfolioItems(items: PortfolioItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save portfolio items:', e);
  }
}

/**
 * 新規ポジション追加
 */
export function addPortfolioItem(
  item: Omit<PortfolioItem, 'id' | 'entryDate' | 'currentPrice'> & {
    entryDate?: string;
    currentPrice?: number;
  }
): PortfolioItem {
  const currentItems = getPortfolioItems();
  const master = STOCK_MASTER[item.ticker];
  const nowPrice = item.currentPrice ?? (master?.price || item.entryPrice);
  const prevPrice = master?.prevClose || nowPrice;

  const newItem: PortfolioItem = {
    ...item,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pf_${Date.now()}`,
    entryDate: item.entryDate || new Date().toISOString().split('T')[0],
    currentPrice: nowPrice,
    prevClose: prevPrice,
  };

  const updated = [newItem, ...currentItems];
  savePortfolioItems(updated);
  return newItem;
}

/**
 * ポジション削除
 */
export function removePortfolioItem(id: string): PortfolioItem[] {
  const currentItems = getPortfolioItems();
  const filtered = currentItems.filter((i) => i.id !== id);
  savePortfolioItems(filtered);
  return filtered;
}

/**
 * 決済（手仕舞い）処理
 */
export function settlePortfolioItem(id: string, settlePrice?: number): PortfolioItem[] {
  const currentItems = getPortfolioItems();
  const target = currentItems.find((i) => i.id === id);
  if (!target) return currentItems;

  const finalPrice = settlePrice ?? target.currentPrice;
  const settledItem: PortfolioItem = {
    ...target,
    settledAt: new Date().toISOString(),
    settlePrice: finalPrice,
  };

  // 決済履歴に保存
  if (typeof window !== 'undefined') {
    try {
      const historyRaw = localStorage.getItem(HISTORY_STORAGE_KEY);
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([settledItem, ...history]));
    } catch (e) {
      console.error(e);
    }
  }

  // 保有一覧からは除外
  return removePortfolioItem(id);
}

/**
 * 実保有 ⇄ 仮想売買の種別切り替え
 */
export function togglePortfolioItemType(id: string): PortfolioItem[] {
  const currentItems = getPortfolioItems();
  const updated = currentItems.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        type: (item.type === 'real' ? 'simulation' : 'real') as 'real' | 'simulation',
      };
    }
    return item;
  });
  savePortfolioItems(updated);
  return updated;
}

/**
 * 実保有または仮想売買の種別を指定して更新
 */
export function updatePortfolioItemType(id: string, newType: 'real' | 'simulation'): PortfolioItem[] {
  const currentItems = getPortfolioItems();
  const updated = currentItems.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        type: newType,
      };
    }
    return item;
  });
  savePortfolioItems(updated);
  return updated;
}

/**
 * 損益計算ヘルパー（現物・信用の金融実務に即した正確な純資産・元本計算）
 */
export function calcItemPnL(item: PortfolioItem): {
  investment: number;         // 実質投資元本（現物は買付満額、信用は約30%の必要委託保証金）
  positionValue: number;      // 建玉総額・約定代金（借入金を含むポジション規模）
  currentValue: number;       // 実質純資産評価額（現物は時価、信用は保証金＋含み損益）
  pnlAmount: number;          // 損益額 (円)
  pnlPercent: number;         // 買値に対する騰落率 (%)
  dailyChangeAmount: number;  // 本日増減 (円)
  isMargin: boolean;          // 信用取引フラグ
  marginDeposit: number;      // 信用必要委託保証金（30%）
} {
  const shares = item.shares || 1;
  const entryPrice = item.entryPrice || 1;
  const currentPrice = item.currentPrice || entryPrice;
  const prevClose = item.prevClose || currentPrice;

  const fullPositionValue = entryPrice * shares;
  const isMargin = item.tradeType === 'margin_buy' || item.tradeType === 'margin_sell';
  const marginDeposit = isMargin ? Math.round(fullPositionValue * 0.3) : 0;

  if (item.tradeType === 'margin_sell') {
    // 信用売りの場合：株価が下がると利益
    const pnlAmount = (entryPrice - currentPrice) * shares;
    const pnlPercent = ((entryPrice - currentPrice) / entryPrice) * 100;
    // 投資元本は手出しの信用保証金（30%）、純資産は保証金＋評価損益
    const investment = marginDeposit;
    const currentValue = marginDeposit + pnlAmount;
    const dailyChangeAmount = (prevClose - currentPrice) * shares;
    return {
      investment,
      positionValue: fullPositionValue,
      currentValue,
      pnlAmount,
      pnlPercent,
      dailyChangeAmount,
      isMargin: true,
      marginDeposit,
    };
  } else if (item.tradeType === 'margin_buy') {
    // 信用買いの場合：株価が上がると利益
    const pnlAmount = (currentPrice - entryPrice) * shares;
    const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    // 投資元本は手出しの信用保証金（30%）、純資産は保証金＋評価損益
    const investment = marginDeposit;
    const currentValue = marginDeposit + pnlAmount;
    const dailyChangeAmount = (currentPrice - prevClose) * shares;
    return {
      investment,
      positionValue: fullPositionValue,
      currentValue,
      pnlAmount,
      pnlPercent,
      dailyChangeAmount,
      isMargin: true,
      marginDeposit,
    };
  } else {
    // 現物保有の場合：買付代金の100%が投資元本、現在株価×株数が評価額
    const investment = fullPositionValue;
    const currentValue = currentPrice * shares;
    const pnlAmount = (currentPrice - entryPrice) * shares;
    const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    const dailyChangeAmount = (currentPrice - prevClose) * shares;
    return {
      investment,
      positionValue: currentValue,
      currentValue,
      pnlAmount,
      pnlPercent,
      dailyChangeAmount,
      isMargin: false,
      marginDeposit: 0,
    };
  }
}

/**
 * 信用期日までの残り日数計算
 */
export function getDaysUntilExpiry(expiryDate?: string): {
  daysLeft: number | null;
  status: 'normal' | 'warning' | 'danger' | 'expired' | 'none';
  label: string;
} {
  if (!expiryDate) {
    return { daysLeft: null, status: 'none', label: '現物・期日なし' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(expiryDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return { daysLeft, status: 'expired', label: `期日超過 (${Math.abs(daysLeft)}日超過)` };
  } else if (daysLeft <= 14) {
    return { daysLeft, status: 'danger', label: `期日直前！残り ${daysLeft}日` };
  } else if (daysLeft <= 30) {
    return { daysLeft, status: 'warning', label: `期日接近 残り ${daysLeft}日` };
  } else {
    return { daysLeft, status: 'normal', label: `期日まで あと${daysLeft}日` };
  }
}

/**
 * 6ヶ月後の信用期日を算出 (YYYY-MM-DD)
 */
export function getDefaultMarginExpiryDate(fromDateStr?: string): string {
  const d = fromDateStr ? new Date(fromDateStr) : new Date();
  d.setMonth(d.getMonth() + 6);
  return d.toISOString().split('T')[0];
}

/**
 * 株価をSTOCK_MASTER等の最新値で更新
 */
export function syncPortfolioPrices(items: PortfolioItem[]): PortfolioItem[] {
  return items.map((item) => {
    const master = STOCK_MASTER[item.ticker];
    if (master) {
      return {
        ...item,
        currentPrice: master.price,
        prevClose: master.prevClose,
      };
    }
    return item;
  });
}
