'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { BuyModal } from '@/components/BuyModal';
import { PortfolioAuditModal } from '@/components/PortfolioAuditModal';
import { SemanticSearchModal } from '@/components/SemanticSearchModal';
import { 
  getPortfolioItems, removePortfolioItem, settlePortfolioItem, 
  calcItemPnL, getDaysUntilExpiry, syncPortfolioPrices,
  syncPortfolioWithRealtimePrices,
  togglePortfolioItemType
} from '@/lib/portfolioStorage';
import { PortfolioItem, PortfolioAuditResult } from '@/types/stock';
import { getFavorites, removeFavorite, getAllFavoriteMetas, saveFavoriteMeta } from '@/lib/storage';
import { STOCK_MASTER } from '@/lib/dataFetcher';
import { lookupStockByTicker } from '@/lib/stockLookup';
import { PtsInfo } from '@/types/stock';
import { useAuth } from '@/lib/useAuth';
import { AuthModal } from '@/components/AuthModal';
import { ProfileEditModal } from '@/components/ProfileEditModal';
import { WatchlistAiNoteModal } from '@/components/WatchlistAiNoteModal';
import { 
  StockAiNote, 
  getAllLocalStockAiNotes, 
  fetchBatchStockAiNotes 
} from '@/lib/stockAiNotesStorage';
import { 
  Briefcase, TrendingUp, TrendingDown, Sparkles, Bot, Plus, 
  Trash2, CheckCircle2, Clock, AlertTriangle, RefreshCw, 
  Calendar, ArrowRight, ShieldCheck, ShoppingCart, Star, Eye, Info, Moon,
  ArrowLeftRight, Lock, User, LogIn, Award, Check
} from 'lucide-react';

interface WatchStockItem {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
  sector: string;
  pts?: PtsInfo;
}

export default function PortfolioPage() {
  const { user, isLoggedIn } = useAuth();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [activeTab, setActiveTab] = useState<'real' | 'simulation' | 'watchlist' | 'all'>('real');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [watchStocks, setWatchStocks] = useState<WatchStockItem[]>([]);
  const [watchLoading, setWatchLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // モーダル管理
  const [buyModalTarget, setBuyModalTarget] = useState<{
    isOpen: boolean;
    ticker?: string;
    stockName?: string;
    currentPrice?: number;
    newsTitle?: string;
    initialType?: 'simulation' | 'real';
  }>({ isOpen: false });

  const [auditResult, setAuditResult] = useState<PortfolioAuditResult | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 📝 登録済みAI見解マップ & モーダル状態
  const [aiNotesMap, setAiNotesMap] = useState<Record<string, StockAiNote[]>>({});
  const [aiNoteModalTarget, setAiNoteModalTarget] = useState<{
    isOpen: boolean;
    ticker: string;
    stockName: string;
    notes: StockAiNote[];
  }>({
    isOpen: false,
    ticker: '',
    stockName: '',
    notes: [],
  });

  const loadAiNotes = async (favTickers: string[]) => {
    // 1. ローカルキャッシュから即座に表示
    const local = getAllLocalStockAiNotes();
    setAiNotesMap(local);

    // 2. 共有サーバー（Supabase / メモリストア）から一括同期
    if (favTickers && favTickers.length > 0) {
      try {
        const serverMap = await fetchBatchStockAiNotes(favTickers);
        setAiNotesMap((prev) => ({ ...prev, ...serverMap }));
      } catch (e) {
        console.warn('Failed to load batch AI notes for portfolio:', e);
      }
    }
  };

  useEffect(() => {
    const favs = getFavorites();
    setFavorites(favs);
    loadPortfolio();
    loadWatchStocks(favs);
    loadAiNotes(favs);

    // AI見解が新規登録・更新・削除された時に即座に再読み込み
    const handleNotesChanged = () => {
      const currentFavs = getFavorites();
      loadAiNotes(currentFavs);
    };

    window.addEventListener('kabu_watch_ai_notes_changed', handleNotesChanged);
    window.addEventListener('storage', handleNotesChanged);

    return () => {
      window.removeEventListener('kabu_watch_ai_notes_changed', handleNotesChanged);
      window.removeEventListener('storage', handleNotesChanged);
    };
  }, []);

  // ポートフォリオ読み込み：即時キャッシュ表示 ＋ 非同期で今日の最新終値に自動同期
  const loadPortfolio = async () => {
    const loaded = getPortfolioItems();
    const synced = syncPortfolioPrices(loaded);
    setItems(synced);

    // ⚡ サーバーから最新のリアルタイム終値をバックグラウンドで完全同期
    try {
      const realTimeUpdated = await syncPortfolioWithRealtimePrices(loaded);
      setItems(realTimeUpdated);
    } catch (e) {
      console.warn('Realtime portfolio sync error:', e);
    }
  };

  const loadWatchStocks = async (favTickers: string[]) => {
    if (!favTickers || favTickers.length === 0) {
      setWatchStocks([]);
      setWatchLoading(false);
      return;
    }
    setWatchLoading(true);
    const metas = getAllFavoriteMetas();

    // 1. まず即座に初期一覧を表示（名前抜けをゼロに）
    const initialList = favTickers.map((t) => {
      if (STOCK_MASTER[t]) {
        return {
          ticker: t,
          name: STOCK_MASTER[t].name,
          price: STOCK_MASTER[t].price,
          changePercent: STOCK_MASTER[t].changePercent,
          sector: STOCK_MASTER[t].sector,
          pts: STOCK_MASTER[t].pts,
        };
      }
      if (metas[t] && metas[t].name) {
        return {
          ticker: t,
          name: metas[t].name,
          price: metas[t].price || 1000,
          changePercent: metas[t].changePercent ?? 0,
          sector: metas[t].sector || '東証上場銘柄',
          pts: undefined,
        };
      }
      return {
        ticker: t,
        name: `銘柄 (${t})`,
        price: 1000,
        changePercent: 0,
        sector: '東証上場銘柄',
        pts: undefined,
      };
    });
    setWatchStocks(initialList);

    // 2. 非同期で今日の最新リアルタイム株価＆社名を完全同期
    try {
      const promises = favTickers.map(async (t) => {
        const looked = await lookupStockByTicker(t, true);
        const resolvedName = (looked && looked.name && !looked.name.startsWith('東証銘柄 ('))
          ? looked.name 
          : (metas[t]?.name || STOCK_MASTER[t]?.name || `銘柄 (${t})`);

        saveFavoriteMeta(t, {
          ticker: t,
          name: resolvedName,
          sector: looked?.sector || metas[t]?.sector || STOCK_MASTER[t]?.sector,
          price: looked?.price || metas[t]?.price || STOCK_MASTER[t]?.price,
          changePercent: looked?.changePercent ?? metas[t]?.changePercent ?? STOCK_MASTER[t]?.changePercent,
        });

        return {
          ticker: t,
          name: resolvedName,
          price: looked?.price || metas[t]?.price || STOCK_MASTER[t]?.price || 1000,
          changePercent: looked?.changePercent ?? metas[t]?.changePercent ?? STOCK_MASTER[t]?.changePercent ?? 0,
          sector: looked?.sector || metas[t]?.sector || STOCK_MASTER[t]?.sector || '東証上場銘柄',
          pts: looked?.pts || STOCK_MASTER[t]?.pts,
        };
      });

      const results = await Promise.all(promises);
      setWatchStocks(results);
    } catch (err) {
      console.warn('Error loading watch stocks:', err);
    } finally {
      setWatchLoading(false);
    }
  };

  const handleRemoveFavorite = (ticker: string) => {
    const next = removeFavorite(ticker);
    setFavorites(next);
    setWatchStocks((prev) => prev.filter((s) => s.ticker !== ticker));
  };

  // 🔄 最新終値の手動更新ボタン
  const handleRefreshPrices = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const current = getPortfolioItems();
      const updated = await syncPortfolioWithRealtimePrices(current, true);
      setItems(updated);
      await loadWatchStocks(favorites);
      setSyncMessage('東証の最新終値に更新しました！');
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (e) {
      console.error('Refresh prices error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRemove = (id: string, name: string) => {
    if (confirm(`「${name}」をポートフォリオから削除しますか？`)) {
      const next = removePortfolioItem(id);
      setItems(next);
    }
  };

  const handleSettle = (id: string, name: string) => {
    if (confirm(`「${name}」を現在の終値で決済（手仕舞い）しますか？\n実現損益として記録されます。`)) {
      const next = settlePortfolioItem(id);
      setItems(next);
    }
  };

  const handleToggleType = (id: string, name: string, currentType: 'real' | 'simulation') => {
    const targetTypeStr = currentType === 'real' ? '「仮想トレード」' : '「実際の保有株」';
    if (confirm(`「${name}」を${targetTypeStr}に変更しますか？\n集計やタブが自動的に移動します。`)) {
      const next = togglePortfolioItemType(id);
      setItems(next);
    }
  };

  // AI診断リクエスト
  const handleRunAudit = async () => {
    if (items.length === 0) {
      alert('診断対象の銘柄がありません。先に銘柄を追加してください。');
      return;
    }
    setIsAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const res = await fetch('/api/portfolio-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      setAuditResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  // フィルタリング（ウォッチリスト以外）
  const filteredItems = items.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'watchlist') return true;
    return item.type === activeTab;
  });

  // サマリー集計（現物株の買付額と、信用取引の必要保証金30%・含み損益を厳密に分離計算）
  let totalInvestment = 0;      // 実質手出し投資元本（現物買付額 ＋ 信用必要保証金30%）
  let totalCurrentValue = 0;     // 実質純資産評価額（現物時価 ＋ 信用保証金＆含み損益）
  let totalDailyChange = 0;      // 本日前日比増減
  let totalSpotInvestment = 0;   // 現物投資元本
  let totalSpotValue = 0;        // 現物保有時価
  let totalMarginPosition = 0;   // 信用建玉代金総額（借入金を含むポジション規模）
  let totalMarginDeposit = 0;    // 信用必要委託保証金（30%）
  let totalMarginPnL = 0;        // 信用建玉の評価損益
  let marginCount = 0;           // 信用建玉数

  filteredItems.forEach((item) => {
    const pnl = calcItemPnL(item);
    totalInvestment += pnl.investment;
    totalCurrentValue += pnl.currentValue;
    totalDailyChange += pnl.dailyChangeAmount;

    if (pnl.isMargin) {
      marginCount++;
      totalMarginPosition += pnl.positionValue;
      totalMarginDeposit += pnl.marginDeposit;
      totalMarginPnL += pnl.pnlAmount;
    } else {
      totalSpotInvestment += pnl.investment;
      totalSpotValue += pnl.currentValue;
    }
  });

  const totalPnLAmount = totalCurrentValue - totalInvestment;
  const totalPnLPercent = totalInvestment > 0 ? (totalPnLAmount / totalInvestment) * 100 : 0;
  const isProfit = totalPnLAmount >= 0;
  const isDailyUp = totalDailyChange >= 0;

  const realCount = items.filter(i => i.type === 'real').length;
  const simCount = items.filter(i => i.type === 'simulation').length;

  return (
    <div className="min-h-screen bg-[#0B0F19] pb-24">
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        favoritesCount={favorites.length}
        hasNewAlerts={false}
      />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* 🔒 未ログイン時の会員限定機能ロック案内 */}
        {!isLoggedIn && (
          <div className="relative p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-[#111827] via-[#0B0F19] to-[#111827] border border-cyan-500/40 shadow-2xl text-center space-y-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-xl mx-auto space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-400 shadow-xl shadow-cyan-500/10 mb-2">
                <Lock className="w-8 h-8 text-cyan-300" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> 会員限定プライベート機能
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  持株登録 ＆ 仮想取引は<br className="sm:hidden" />
                  <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                    会員限定スペースです
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  プライベートな資産情報である「持株の損益追跡」や「仮想売買シミュレーション」、「お気に入りウォッチリスト」は、ログインしたご本人様のみが安全に閲覧・記録できます。
                </p>
              </div>

              {/* 機能ハイライト一覧 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
                <div className="p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                    <Briefcase className="w-4 h-4 text-purple-400" />
                    <span>実際の保有株</span>
                  </div>
                  <p className="text-[11px] text-gray-400">買値や株数を安全に登録し、損益・信用期日をAI自動管理</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>仮想トレード</span>
                  </div>
                  <p className="text-[11px] text-gray-400">リスクゼロで気になる銘柄の模擬売買を記録・検証</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                    <Star className="w-4 h-4 text-cyan-400" />
                    <span>お気に入り株</span>
                  </div>
                  <p className="text-[11px] text-gray-400">夜間PTS・リアルタイム急変動を逃さず自分専用監視</p>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-extrabold text-sm shadow-xl shadow-cyan-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>無料会員登録 / ログインして見る</span>
                </button>
                <Link
                  href="/rankings"
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>誰でも見れる売買ランキングへ ↗</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ログイン済み時のユーザープロフィールバー */}
        {isLoggedIn && user && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#111827] via-gray-900 to-[#111827] border border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3.5">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-cyan-500/60 shadow-md shrink-0"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-base text-white">{user.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    プライベート資産
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                  <span>{user.investorStyle || '投資スタイル未設定'}</span>
                  <span>・</span>
                  <span className="text-gray-500">{user.email}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-cyan-500/50 text-cyan-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>名前・アバター編集</span>
            </button>
          </div>
        )}

        {/* Top Header & Separate Actions */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-emerald-500/20 border border-purple-500/30 text-purple-300">
                <Briefcase className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                ポートフォリオ ＆ 仮想売買
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              「実際の保有株」の資産損益・信用期日管理と、「仮想売買シミュレーション」を明確に分けて管理できます。
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* 株価更新ボタン */}
            <button
              onClick={handleRefreshPrices}
              disabled={isSyncing}
              className={`px-3 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-cyan-500/50 text-gray-200 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50`}
              title="東証の今日の最新終値をリアルタイム再取得"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? '終値更新中...' : '株価更新'}</span>
            </button>

            {/* 同期完了トースト */}
            {syncMessage && (
              <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/90 px-3 py-1.5 rounded-xl border border-emerald-500/40 flex items-center gap-1 animate-fade-in shadow-md">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                {syncMessage}
              </span>
            )}

            {/* 🏦 実保有株を登録ボタン */}
            <button
              onClick={() => setBuyModalTarget({ isOpen: true, initialType: 'real' })}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg shadow-purple-500/25 border border-purple-400/40 active:scale-98"
            >
              <ShieldCheck className="w-4 h-4 text-purple-200" />
              <span>🏦 実保有株を登録</span>
            </button>

            {/* 🧪 仮想トレードを追加ボタン */}
            <button
              onClick={() => setBuyModalTarget({ isOpen: true, initialType: 'simulation' })}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 text-black font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              <span>🧪 仮想トレードを追加</span>
            </button>

            {/* 🤖 Gemini AI診断ボタン */}
            <button
              onClick={handleRunAudit}
              className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs flex items-center gap-1.5 border border-gray-700 transition-all active:scale-98"
            >
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>AI診断</span>
            </button>
          </div>
        </div>

        {/* 1. タブ切り替えバー（サマリーの直前に配置して連動感を強調） */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* 🏦 実際の保有株タブ */}
            <button
              onClick={() => setActiveTab('real')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                activeTab === 'real'
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-lg shadow-purple-500/10'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>🏦 実際の保有株 ({realCount})</span>
            </button>

            {/* 🧪 仮想トレードタブ */}
            <button
              onClick={() => setActiveTab('simulation')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                activeTab === 'simulation'
                  ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>🧪 仮想トレード ({simCount})</span>
            </button>

            {/* ⭐ ウォッチリストタブ */}
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                activeTab === 'watchlist'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${activeTab === 'watchlist' ? 'fill-amber-400 text-amber-400' : 'text-amber-400'}`} />
              <span>⭐ ウォッチリスト ({favorites.length})</span>
            </button>

            {/* 📊 すべて合算タブ */}
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/10'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>📊 すべて合算 ({items.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              {activeTab === 'real' && '🏦 あなたが実際に保有している現物・信用銘柄の損益です'}
              {activeTab === 'simulation' && '🧪 仮想取引によるシミュレーション成績（ノーリスク検証）です'}
              {activeTab === 'watchlist' && '⭐ 未保有の注目銘柄です。気になる株の推移を監視できます'}
              {activeTab === 'all' && '📊 実保有株と仮想トレードの数値を合算して表示しています'}
            </span>
          </div>
        </div>

        {/* 2. サマリーヘッダー (損益ダッシュボード) - タブ選択に応じてテーマ＆タイトル変化 */}
        <section className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span className="font-bold flex items-center gap-1.5 text-gray-300">
              {activeTab === 'real' && <ShieldCheck className="w-4 h-4 text-purple-400" />}
              {activeTab === 'simulation' && <Sparkles className="w-4 h-4 text-cyan-400" />}
              {activeTab === 'all' && <Briefcase className="w-4 h-4 text-blue-400" />}
              {activeTab === 'watchlist' && <Star className="w-4 h-4 text-amber-400" />}
              <span>
                {activeTab === 'real' && '【実保有株】資産状況 ＆ 評価損益'}
                {activeTab === 'simulation' && '【仮想売買】トレード成績 ＆ 評価損益'}
                {activeTab === 'all' && '【総合合算】実保有 ＋ 仮想売買'}
                {activeTab === 'watchlist' && '【参考】保有資産全体のサマリー（ウォッチ銘柄は未保有）'}
              </span>
            </span>
            <span className="text-[11px] text-gray-500">最新終値基準（自動計算）</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 実質投資元本 */}
            <div className={`p-5 rounded-2xl bg-[#111827] border transition-all space-y-1 ${
              activeTab === 'real' ? 'border-purple-500/30' : activeTab === 'simulation' ? 'border-cyan-500/30' : 'border-gray-800'
            }`}>
              <span className="text-xs font-semibold text-gray-400">
                {activeTab === 'real' ? '実質 投資元本' : activeTab === 'simulation' ? '仮想 手出し元本' : '実質投資元本'}
              </span>
              <div className="text-2xl font-extrabold text-white font-mono">
                ¥{Math.round(totalInvestment).toLocaleString()}
              </div>
              <span className="text-[11px] text-gray-500 block">
                {marginCount > 0 ? '現物買付 ＋ 信用保証金(30%)' : '現物買付代金合計'}
              </span>
            </div>

            {/* 実質純資産評価額 */}
            <div className={`p-5 rounded-2xl bg-[#111827] border transition-all space-y-1 ${
              activeTab === 'real' ? 'border-purple-500/30' : activeTab === 'simulation' ? 'border-cyan-500/30' : 'border-gray-800'
            }`}>
              <span className="text-xs font-semibold text-gray-400">
                {activeTab === 'real' ? '実保有 純資産評価額' : activeTab === 'simulation' ? '仮想 純資産評価額' : '純資産評価額'}
              </span>
              <div className="text-2xl font-extrabold text-white font-mono">
                ¥{Math.round(totalCurrentValue).toLocaleString()}
              </div>
              <span className="text-[11px] text-gray-500 block">
                {marginCount > 0 ? '現物時価 ＋ 信用評価損益' : '保有株のリアルタイム終値時価'}
              </span>
            </div>

            {/* トータル評価損益 */}
            <div className={`p-5 rounded-2xl bg-[#111827] border transition-all space-y-1 ${
              isProfit ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5' : 'border-rose-500/40 shadow-lg shadow-rose-500/5'
            }`}>
              <span className="text-xs font-semibold text-gray-400">
                {activeTab === 'real' ? '実保有 評価損益' : activeTab === 'simulation' ? '仮想 トレード損益' : 'トータル評価損益'}
              </span>
              <div className={`text-2xl font-extrabold font-mono flex items-center gap-1.5 ${
                isProfit ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {isProfit ? '+' : ''}¥{Math.round(totalPnLAmount).toLocaleString()}
              </div>
              <div className={`text-xs font-bold font-mono ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                ({isProfit ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
              </div>
            </div>

            {/* 本日の前日比増減 */}
            <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800 space-y-1">
              <span className="text-xs font-semibold text-gray-400">本日の損益変動（前日比）</span>
              <div className={`text-2xl font-extrabold font-mono ${
                isDailyUp ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isDailyUp ? '+' : ''}¥{Math.round(totalDailyChange).toLocaleString()}
              </div>
              <span className="text-[11px] text-gray-500 block">前営業日終値からの値動き</span>
            </div>
          </div>

          {/* 💡 信用取引ポジション内訳パネル（借入金を元本に含めない明確な内訳） */}
          {marginCount > 0 && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-950/30 via-gray-900 to-indigo-950/30 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-center gap-2.5">
                <span className="p-1 rounded-lg bg-blue-500/20 text-blue-300 font-bold text-[10px] px-2 border border-blue-500/40 shrink-0">
                  ⚖️ 信用取引内訳
                </span>
                <p className="text-gray-300 leading-relaxed">
                  信用建玉（{marginCount}件）は借入金を満額加算せず、<strong className="text-white">手出し保証金（約30%）と評価損益のみを純資産に反映</strong>して適正に計算しています。
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono shrink-0 flex-wrap">
                <div>
                  <span className="text-[10px] text-gray-400 block">建玉総額（借入含む）</span>
                  <span className="font-bold text-gray-200">¥{Math.round(totalMarginPosition).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">必要委託保証金 (30%)</span>
                  <span className="font-bold text-cyan-300">¥{Math.round(totalMarginDeposit).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">信用評価損益</span>
                  <span className={`font-extrabold ${totalMarginPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {totalMarginPnL >= 0 ? '+' : ''}¥{Math.round(totalMarginPnL).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 3. 銘柄一覧グリッド */}
        {activeTab === 'watchlist' ? (
          <div>
            {watchLoading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                <p className="text-xs text-gray-400">ウォッチリスト銘柄の最新株価を取得中...</p>
              </div>
            ) : watchStocks.length === 0 ? (
              <div className="py-20 text-center space-y-4 border border-dashed border-gray-800 rounded-3xl p-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                  <Star className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-200">ウォッチリストにお気に入り銘柄がありません</p>
                  <p className="text-xs text-gray-500">
                    検索窓やタイムラインの☆ボタンを押すと、いつでもここに注目株を追加できます。
                  </p>
                </div>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs inline-flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/10"
                >
                  銘柄を検索して追加
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {watchStocks.map((stock) => {
                  const isUp = stock.changePercent >= 0;
                  const notes = aiNotesMap[stock.ticker] || [];
                  const hasNotes = notes.length > 0;
                  return (
                    <div
                      key={stock.ticker}
                      className="p-5 rounded-2xl bg-[#111827] border border-gray-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              {stock.ticker}
                            </span>
                            <span className="text-[10px] text-gray-400 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                              {stock.sector}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveFavorite(stock.ticker)}
                            className="text-amber-400 hover:text-gray-500 transition-colors p-1"
                            title="ウォッチ解除"
                          >
                            <Star className="w-4 h-4 fill-amber-400" />
                          </button>
                        </div>

                        <Link
                          href={`/stocks/${stock.ticker}`}
                          className="text-base font-bold text-white hover:text-cyan-300 transition-colors mt-2.5 inline-flex items-center gap-1.5"
                        >
                          <span>{stock.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                        </Link>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-gray-800/80">
                        <div className="flex items-end justify-between font-mono">
                          <div>
                            <span className="text-[10px] text-gray-500 block">東証終値</span>
                            <span className="text-xl font-extrabold text-white">
                              ¥{stock.price.toLocaleString()}
                            </span>
                          </div>
                          <div className={`text-right font-bold text-xs ${
                            isUp ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            <span className="block text-[10px] text-gray-500">前日比</span>
                            <span>{isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                          </div>
                        </div>

                        {/* 🌙 夜間PTS取引情報 */}
                        {stock.pts && (
                          <div className="flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/30 text-xs font-mono">
                            <span className="flex items-center gap-1 text-[11px] font-bold text-purple-300">
                              <Moon className="w-3 h-3 text-purple-400 animate-pulse" /> 夜間PTS
                            </span>
                            <div className="text-right">
                              <span className="font-extrabold text-white">¥{stock.pts.price.toLocaleString()}</span>
                              <span className={`ml-1 text-[10px] font-bold ${stock.pts.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                ({stock.pts.change >= 0 ? '+' : ''}{stock.pts.changePercent.toFixed(2)}%)
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 🌟 登録済みAI見解ボタン（AIの見解が登録されたら表示） */}
                        {hasNotes && (
                          <button
                            onClick={() => setAiNoteModalTarget({
                              isOpen: true,
                              ticker: stock.ticker,
                              stockName: stock.name,
                              notes: notes,
                            })}
                            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#0d2238] via-[#111e3b] to-[#1a1236] border border-cyan-400/60 hover:border-cyan-300 text-cyan-200 text-xs font-bold transition-all flex items-center justify-between shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/25 group cursor-pointer animate-ai-glow-pulse"
                            title="登録されたAIの見解を読む"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
                              <span className="font-extrabold text-white text-xs truncate">
                                {notes[0].title || 'AIの見解'}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-mono shrink-0">
                                {notes.length}件
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-cyan-300 font-extrabold group-hover:translate-x-0.5 transition-transform shrink-0">
                              <span>見解を見る</span>
                              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                            </div>
                          </button>
                        )}

                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          <Link
                            href={`/stocks/${stock.ticker}`}
                            className="py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-bold transition-all text-center border border-gray-800 flex items-center justify-center"
                          >
                            AI情報
                          </Link>
                          <button
                            onClick={() => setBuyModalTarget({
                              isOpen: true,
                              ticker: stock.ticker,
                              stockName: stock.name,
                              currentPrice: stock.price,
                              initialType: 'real',
                            })}
                            className="py-2 rounded-xl bg-purple-950/50 hover:bg-purple-900/70 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
                            title="実際に買った株としてポートフォリオに登録"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                            実保有に
                          </button>
                          <button
                            onClick={() => setBuyModalTarget({
                              isOpen: true,
                              ticker: stock.ticker,
                              stockName: stock.name,
                              currentPrice: stock.price,
                              initialType: 'simulation',
                            })}
                            className="py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-90 text-black font-extrabold text-xs transition-all flex items-center justify-center gap-1 shadow-md shadow-cyan-500/10"
                            title="仮想トレードとしてシミュレーション開始"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            仮想で試す
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center space-y-4 border border-dashed border-gray-800 rounded-3xl p-8 max-w-2xl mx-auto">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
              activeTab === 'real' ? 'bg-purple-500/10 text-purple-400' : 'bg-cyan-500/10 text-cyan-400'
            }`}>
              {activeTab === 'real' ? <ShieldCheck className="w-7 h-7" /> : <Sparkles className="w-7 h-7" />}
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                {activeTab === 'real' && '登録されている実際の保有株はありません'}
                {activeTab === 'simulation' && '仮想トレード（シミュレーション）ポジションはありません'}
                {activeTab === 'all' && 'ポートフォリオに登録された銘柄はありません'}
              </h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                {activeTab === 'real' && '証券口座で実際に保有している現物株・信用ポジションを登録すると、リアルタイム終値で損益や期日を自動管理できます。'}
                {activeTab === 'simulation' && '注目の材料株やAIおすすめ銘柄をノーリスクで仮想売買し、買いタイミングやトレード成績を検証できます。'}
                {activeTab === 'all' && '上のボタンから実保有株または仮想トレードを追加して管理を開始してください。'}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
              {(activeTab === 'real' || activeTab === 'all') && (
                <button
                  onClick={() => setBuyModalTarget({ isOpen: true, initialType: 'real' })}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs inline-flex items-center gap-2 shadow-lg shadow-purple-500/20"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-200" /> 実際の保有株を登録
                </button>
              )}
              {(activeTab === 'simulation' || activeTab === 'all') && (
                <button
                  onClick={() => setBuyModalTarget({ isOpen: true, initialType: 'simulation' })}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-extrabold text-xs inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Sparkles className="w-4 h-4" /> 仮想トレードを追加
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const pnl = calcItemPnL(item);
              const isItemProfit = pnl.pnlAmount >= 0;
              const expiryInfo = getDaysUntilExpiry(item.expiryDate);

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl bg-[#111827] border transition-all flex flex-col justify-between space-y-4 shadow-lg ${
                    item.type === 'real'
                      ? 'border-purple-900/40 hover:border-purple-500/50'
                      : 'border-cyan-900/40 hover:border-cyan-500/50'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {item.ticker}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          item.type === 'simulation'
                            ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30'
                            : 'bg-purple-950/80 text-purple-300 border-purple-500/30'
                        }`}>
                          {item.type === 'simulation' ? (
                            <>
                              <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                              仮想トレード
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-2.5 h-2.5 text-purple-400" />
                              実保有株
                            </>
                          )}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          item.tradeType === 'spot'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : item.tradeType === 'margin_buy'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {item.tradeType === 'spot' ? '現物' : item.tradeType === 'margin_buy' ? '信用買' : '信用売'}
                        </span>
                      </div>

                      {/* 種別クイック切り替え ＆ 削除ボタン */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleType(item.id, item.name, item.type)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                            item.type === 'real'
                              ? 'bg-gray-900 border-gray-800 text-gray-400 hover:text-cyan-300 hover:border-cyan-500/40'
                              : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-purple-300 hover:border-purple-500/40'
                          }`}
                          title={item.type === 'real' ? '仮想売買シミュレーションに切り替える' : '実際に保有している株に切り替える'}
                        >
                          <ArrowLeftRight className="w-3 h-3" />
                          <span>{item.type === 'real' ? '仮想に変更' : '実保有に変更'}</span>
                        </button>

                        <button
                          onClick={() => handleRemove(item.id, item.name)}
                          className="text-gray-500 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-gray-900"
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Stock Name */}
                    <Link
                      href={`/stocks/${item.ticker}`}
                      className="text-base font-bold text-white hover:text-cyan-300 transition-colors mt-2 inline-flex items-center gap-1.5"
                    >
                      <span>{item.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                    </Link>

                    {/* メモ */}
                    {item.notes && (
                      <p className="text-[11px] text-gray-400 bg-black/40 p-2 rounded-lg border border-gray-800/80 mt-2 line-clamp-2">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  {/* 損益 & 価格情報 */}
                  <div className="space-y-3 pt-2 border-t border-gray-800/60">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[11px] text-gray-500 block">
                          {pnl.isMargin ? '約定単価 / 株数' : '取得単価 / 株数'}
                        </span>
                        <span className="font-mono font-bold text-gray-300">
                          ¥{item.entryPrice.toLocaleString()} × {item.shares}株
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-gray-500 block">現在終値</span>
                        <span className="font-mono font-bold text-white text-sm">
                          ¥{item.currentPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* 元本＆建玉の内訳 */}
                    <div className="flex items-center justify-between text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-gray-900/60 border border-gray-800">
                      {pnl.isMargin ? (
                        <>
                          <span className="text-gray-400">
                            建玉代金: <strong className="text-gray-200">¥{Math.round(pnl.positionValue).toLocaleString()}</strong>
                          </span>
                          <span className="text-cyan-400">
                            保証金(30%): <strong>¥{Math.round(pnl.marginDeposit).toLocaleString()}</strong>
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-400">
                            投資元本: <strong className="text-gray-200">¥{Math.round(pnl.investment).toLocaleString()}</strong>
                          </span>
                          <span className="text-gray-300">
                            現在時価: <strong className="text-white">¥{Math.round(pnl.currentValue).toLocaleString()}</strong>
                          </span>
                        </>
                      )}
                    </div>

                    {/* 損益表示 */}
                    <div className="p-3 rounded-xl bg-gray-950 flex items-center justify-between border border-gray-800">
                      <div>
                        <span className="text-[10px] text-gray-500 block">
                          {pnl.isMargin ? '信用評価損益' : '評価損益'}
                        </span>
                        <span className={`text-sm font-extrabold font-mono ${
                          isItemProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isItemProfit ? '+' : ''}¥{Math.round(pnl.pnlAmount).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 block">損益率</span>
                        <span className={`text-sm font-extrabold font-mono ${
                          isItemProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isItemProfit ? '+' : ''}{pnl.pnlPercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* 信用期日アラート (信用ポジションの場合) */}
                    {item.tradeType !== 'spot' && (
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        expiryInfo.status === 'danger'
                          ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 animate-pulse'
                          : expiryInfo.status === 'warning'
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                          : 'bg-gray-900 border-gray-800 text-gray-400'
                      }`}>
                        <div className="flex items-center gap-1.5 font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{expiryInfo.label}</span>
                        </div>
                        {item.expiryDate && (
                          <span className="font-mono text-[11px] text-gray-500">
                            期日: {item.expiryDate}
                          </span>
                        )}
                      </div>
                    )}

                    {/* アクションボタン */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleSettle(item.id, item.name)}
                        className="w-full py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold transition-all flex items-center justify-center gap-1 border border-gray-700"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        この価格で決済（手仕舞い）
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* モーダル群 */}
      <BuyModal
        isOpen={buyModalTarget.isOpen}
        onClose={() => {
          setBuyModalTarget({ isOpen: false });
          loadPortfolio();
        }}
        ticker={buyModalTarget.ticker}
        stockName={buyModalTarget.stockName}
        currentPrice={buyModalTarget.currentPrice}
        newsTitle={buyModalTarget.newsTitle}
        initialType={buyModalTarget.initialType}
      />


      <PortfolioAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        result={auditResult}
        loading={auditLoading}
      />

      <SemanticSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        message="持株の登録・管理や、仮想取引、お気に入りウォッチリストは会員限定機能です。無料登録またはログインしてご利用ください。"
      />

      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* 🌟 ウォッチリスト用 AI見解ビューアモーダル */}
      <WatchlistAiNoteModal
        isOpen={aiNoteModalTarget.isOpen}
        onClose={() => setAiNoteModalTarget((prev) => ({ ...prev, isOpen: false }))}
        ticker={aiNoteModalTarget.ticker}
        stockName={aiNoteModalTarget.stockName}
        notes={aiNoteModalTarget.notes}
      />
    </div>
  );
}
