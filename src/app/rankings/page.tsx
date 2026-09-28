'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { BuyModal } from '@/components/BuyModal';
import { SemanticSearchModal } from '@/components/SemanticSearchModal';
import { RankingCategoryType, RankingItem } from '@/types/stock';
import { getFavorites, addFavorite, removeFavorite } from '@/lib/storage';
import { 
  TrendingUp, TrendingDown, BarChart3, AlertCircle, ArrowUpRight, 
  ArrowDownRight, RefreshCw, Star, ShoppingCart, Sparkles, 
  ChevronRight, Bot, ShieldAlert, Zap 
} from 'lucide-react';

const CATEGORIES: { id: RankingCategoryType; label: string; icon: any; color: string; desc: string }[] = [
  { id: 'gainers', label: '値上がり率上位', icon: TrendingUp, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', desc: '本日急騰した銘柄とその買い材料' },
  { id: 'losers', label: '値下がり率上位', icon: TrendingDown, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', desc: '本日急落した銘柄と下落の要因' },
  { id: 'volume', label: '出来高急増', icon: BarChart3, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', desc: '市場の売買エネルギーが猛烈に集中した銘柄' },
  { id: 'stop_high', label: 'ストップ高', icon: Zap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', desc: '買い気配で値幅制限上限に達した強材料株' },
  { id: 'stop_low', label: 'ストップ安', icon: ShieldAlert, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', desc: '売り気配で値幅制限下限に達した注意銘柄' },
];

export default function RankingsPage() {
  const [activeCategory, setActiveCategory] = useState<RankingCategoryType>('gainers');
  const [rankingsData, setRankingsData] = useState<Record<RankingCategoryType, RankingItem[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // BuyModal State
  const [buyState, setBuyState] = useState<{
    ticker: string;
    stockName?: string;
    currentPrice?: number;
    newsTitle?: string;
  } | null>(null);

  useEffect(() => {
    setFavorites(getFavorites());
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/market-rankings');
      const data = await res.json();
      if (data.rankings) {
        setRankingsData(data.rankings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRankings();
    setIsRefreshing(false);
  };

  const handleToggleFav = (ticker: string, name?: string, sector?: string) => {
    if (favorites.includes(ticker)) {
      const next = removeFavorite(ticker);
      setFavorites(next);
    } else {
      const next = addFavorite(ticker, name ? { name, sector } : undefined);
      setFavorites(next);
    }
  };

  const currentList = rankingsData ? rankingsData[activeCategory] || [] : [];
  const currentCategoryMeta = CATEGORIES.find((c) => c.id === activeCategory)!;

  const getRankBadge = (pos: number) => {
    if (pos === 1) return 'bg-amber-400 text-black font-extrabold shadow-amber-400/50';
    if (pos === 2) return 'bg-gray-300 text-black font-extrabold shadow-gray-300/50';
    if (pos === 3) return 'bg-amber-700 text-white font-extrabold shadow-amber-700/50';
    return 'bg-gray-800 text-gray-300 font-bold';
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] pb-24">
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        favoritesCount={favorites.length}
        hasNewAlerts={false}
      />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-400">
                <Zap className="w-5 h-5 animate-pulse" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                市場ランキング ＆ AI急変動要因分析
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              東証の急騰・急落・ストップ高銘柄を網羅。「なぜ上がったのか / なぜ下がったのか」をGeminiが瞬時解説
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefresh}
              className={`px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all ${
                isRefreshing ? 'animate-pulse' : ''
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              最新に更新
            </button>
          </div>
        </div>

        {/* 🌐 一般公開バナー（ランキングはみんな見れる、持株・仮想取引は会員限定） */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-gray-900 to-cyan-950/30 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-[10px] px-2 border border-amber-500/40 shrink-0">
              🌐 一般公開中
            </span>
            <span className="text-gray-300">
              売買ランキングは<strong className="text-white">どなたでも自由</strong>にご覧いただけます。ご自身の持株登録や仮想トレードは<strong className="text-cyan-300">会員限定スペース</strong>でご利用いただけます。
            </span>
          </div>
          <Link
            href="/portfolio"
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-white font-bold text-xs shrink-0 transition-all flex items-center gap-1 active:scale-95"
          >
            <span>持株・仮想売買はこちら</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                  isActive
                    ? 'bg-gradient-to-b from-gray-900 via-[#111827] to-gray-900 border-cyan-500/80 shadow-lg shadow-cyan-500/10 scale-102'
                    : 'bg-[#111827]/80 border-gray-800 hover:border-gray-700 hover:bg-gray-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-lg border ${cat.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  )}
                </div>
                <div>
                  <div className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                    {cat.label}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate mt-0.5">
                    上位5社AI解析
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Current Active Category Description Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-gray-900 to-[#111827] border border-gray-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-cyan-400" />
              【{currentCategoryMeta.label}】急変動分析
            </span>
            <span className="text-gray-400 hidden sm:inline">— {currentCategoryMeta.desc}</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            ⚡ 共有AIキャッシュ最適化済
          </span>
        </div>

        {/* Rankings List Cards */}
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto animate-spin">
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </div>
            <p className="text-sm font-semibold text-gray-300 animate-pulse">
              Geminiが急変動の要因・ニュース・適時開示を一括解析中...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentList.map((item) => {
              const isUp = item.change_percent >= 0;
              const isFav = favorites.includes(item.ticker);

              return (
                <div
                  key={`${item.ranking_type}-${item.rank_position}-${item.ticker}`}
                  className="p-5 rounded-2xl bg-[#111827] border border-gray-800 hover:border-gray-700 transition-all shadow-xl space-y-4"
                >
                  {/* Top Row: Rank, Ticker, Name, Price, % */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    <div className="flex items-center gap-3">
                      {/* Rank Badge */}
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shadow-md ${getRankBadge(item.rank_position)}`}>
                        {item.rank_position}
                      </span>

                      {/* Ticker & Name */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                            {item.ticker}
                          </span>
                          <Link
                            href={`/stocks/${item.ticker}`}
                            className="text-base font-bold text-white hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
                          >
                            <span>{item.name}</span>
                            <ArrowUpRight className="w-4 h-4 text-gray-500" />
                          </Link>
                        </div>
                        <span className="text-[11px] text-gray-400 font-mono mt-0.5 block">
                          出来高: {Number(item.volume).toLocaleString()}株
                        </span>
                      </div>
                    </div>

                    {/* Price and Percent */}
                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <div className="text-right">
                        <div className="text-lg font-extrabold text-white font-mono">
                          ¥{Number(item.price).toLocaleString()}
                        </div>
                        <div className={`text-xs font-bold font-mono flex items-center justify-end ${
                          isUp ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isUp ? '+' : ''}{item.change_percent.toFixed(2)}%
                        </div>
                      </div>

                      {/* Favorite Button */}
                      <button
                        onClick={() => handleToggleFav(item.ticker, item.name)}
                        className={`p-2 rounded-xl border transition-all ${
                          isFav
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                            : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
                        }`}
                        title={isFav ? 'お気に入り解除' : 'お気に入りに追加'}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                      </button>

                      {/* Virtual Buy Trigger */}
                      <button
                        onClick={() => setBuyState({
                          ticker: item.ticker,
                          stockName: item.name,
                          currentPrice: item.price,
                          newsTitle: `${item.name} (${item.change_percent >= 0 ? '+' : ''}${item.change_percent}%) ${item.ai_reason}`,
                        })}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 hover:opacity-95 active:scale-98 transition-all"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>仮想購入</span>
                      </button>
                    </div>

                  </div>

                  {/* 💡 AI要因分析ボックス (なぜ上がったのか/下がったのか) */}
                  <div className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800/90 flex items-start gap-2.5">
                    <div className="p-1 rounded bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <span className="font-bold text-cyan-300 block">
                        AI急変動要因分析（なぜ{isUp ? '上がった' : '下がった'}のか？）:
                      </span>
                      <p className="text-gray-300 leading-relaxed font-sans">
                        {item.ai_reason}
                      </p>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* 仮想購入モーダル */}
      {buyState && (
        <BuyModal
          isOpen={!!buyState}
          onClose={() => setBuyState(null)}
          ticker={buyState.ticker}
          stockName={buyState.stockName}
          currentPrice={buyState.currentPrice}
          newsTitle={buyState.newsTitle}
        />
      )}

      {/* 意味検索モーダル */}
      <SemanticSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
