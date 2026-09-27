'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { BuyModal } from '@/components/BuyModal';
import { SemanticSearchModal } from '@/components/SemanticSearchModal';
import { WeekendPickItem } from '@/types/stock';
import { getFavorites, addFavorite, removeFavorite } from '@/lib/storage';
import { 
  Calendar, Sparkles, TrendingUp, ShieldCheck, Zap, Star, 
  ShoppingCart, ArrowRight, AlertTriangle, RefreshCw, Layers, 
  CheckCircle2, Flame, Landmark, Bot, Target, ShieldAlert
} from 'lucide-react';

type HorizonType = 'all' | 'short' | 'mid' | 'long';

export default function WeekendPicksPage() {
  const [activeHorizon, setActiveHorizon] = useState<HorizonType>('all');
  const [picksData, setPicksData] = useState<Record<'short' | 'mid' | 'long', WeekendPickItem[]> | null>(null);
  const [targetDate, setTargetDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // BuyModal state
  const [buyState, setBuyState] = useState<{
    ticker: string;
    stockName?: string;
    currentPrice?: number;
    newsTitle?: string;
  } | null>(null);

  useEffect(() => {
    setFavorites(getFavorites());
    fetchPicks();
  }, []);

  const fetchPicks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/weekend-picks');
      const data = await res.json();
      if (data.picks) {
        setPicksData(data.picks);
      }
      if (data.target_date) {
        setTargetDate(data.target_date);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('Gemini AIに週末厳選レポートの再生成をリクエストしますか？')) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/weekend-picks', { method: 'POST' });
      const data = await res.json();
      if (data.picks) {
        setPicksData(data.picks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
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

  // 表示アイテムリスト
  const getDisplayItems = (): WeekendPickItem[] => {
    if (!picksData) return [];
    if (activeHorizon === 'all') {
      return [...(picksData.short || []), ...(picksData.mid || []), ...(picksData.long || [])];
    }
    return picksData[activeHorizon] || [];
  };

  const displayList = getDisplayItems();

  const getHorizonBadge = (h: string) => {
    switch (h) {
      case 'short':
        return {
          label: '⚡ 短期投資 (数日〜数週)',
          bg: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
          desc: '直近好材料・需給好転・テーマ急騰狙い',
        };
      case 'mid':
        return {
          label: '📈 中期投資 (1〜6ヶ月)',
          bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
          desc: '業績モメンタム・自社株買い・増配バリュー',
        };
      default:
        return {
          label: '🏛️ 長期投資 (1年以上)',
          bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          desc: '高ROE・累進配当・強固な堀を持つ割安優良株',
        };
    }
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
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-400">
                <Calendar className="w-5 h-5 animate-pulse" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                週末AI厳選おすすめ銘柄スクリーニング
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              金曜日の大引け・週間材料をGeminiが総括。投資ホライズン（短期・中期・長期）別に有望株をAI推薦
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {targetDate && (
              <span className="text-xs font-mono font-bold text-gray-400 bg-gray-900 px-3 py-2 rounded-xl border border-gray-800">
                対象週: {targetDate} 付レポート
              </span>
            )}
            <button
              onClick={handleRegenerate}
              className={`px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/40 text-purple-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all ${
                isGenerating ? 'animate-pulse' : ''
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              AI再スクリーニング
            </button>
          </div>
        </div>

        {/* 投資ホライズン切り替えタブ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => setActiveHorizon('all')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeHorizon === 'all'
                ? 'bg-gradient-to-b from-gray-900 to-[#111827] border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                : 'bg-[#111827]/80 border-gray-800 text-gray-400 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">全銘柄一覧</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-[11px] text-gray-500 mt-1">短期・中期・長期 6社</span>
          </button>

          <button
            onClick={() => setActiveHorizon('short')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeHorizon === 'short'
                ? 'bg-rose-950/30 border-rose-500 text-white shadow-lg shadow-rose-500/10'
                : 'bg-[#111827]/80 border-gray-800 text-gray-400 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300">⚡ 短期投資</span>
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-[11px] text-gray-500 mt-1">材料急騰・数日〜数週</span>
          </button>

          <button
            onClick={() => setActiveHorizon('mid')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeHorizon === 'mid'
                ? 'bg-cyan-950/30 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                : 'bg-[#111827]/80 border-gray-800 text-gray-400 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300">📈 中期投資</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-[11px] text-gray-500 mt-1">決算モメンタム・1〜6ヶ月</span>
          </button>

          <button
            onClick={() => setActiveHorizon('long')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeHorizon === 'long'
                ? 'bg-emerald-950/30 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                : 'bg-[#111827]/80 border-gray-800 text-gray-400 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300">🏛️ 長期投資</span>
              <Landmark className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[11px] text-gray-500 mt-1">累進配当・高ROE・1年以上</span>
          </button>
        </div>

        {/* 銘柄カード一覧 */}
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto animate-spin">
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </div>
            <p className="text-sm font-semibold text-gray-300 animate-pulse">
              Geminiが今週末の厳選銘柄レポートを作成中...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {displayList.map((item, idx) => {
              const badge = getHorizonBadge(item.horizon);
              const isFav = favorites.includes(item.ticker);

              return (
                <div
                  key={`${item.horizon}-${item.ticker}-${idx}`}
                  className="p-6 rounded-3xl bg-[#111827] border border-gray-800 hover:border-cyan-500/40 transition-all shadow-xl flex flex-col justify-between space-y-5"
                >
                  {/* Card Header */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-[11px] text-gray-400 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                        {item.sector}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20">
                            {item.ticker}
                          </span>
                          <Link
                            href={`/stocks/${item.ticker}`}
                            className="text-xl font-bold text-white hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5"
                          >
                            <span>{item.name}</span>
                            <ArrowRight className="w-4 h-4 text-gray-500" />
                          </Link>
                        </div>
                      </div>
                      <div className="flex items-end gap-2.5 flex-wrap justify-end">
                        <div className="text-right font-mono">
                          <span className="text-[10px] text-gray-500 block">参考株価</span>
                          <span className="text-lg font-extrabold text-white">
                            ¥{Number(item.current_price).toLocaleString()}
                          </span>
                        </div>
                        {item.target_price && (
                          <div className="text-right font-mono bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border border-emerald-500/40 px-2.5 py-1 rounded-xl shadow-sm">
                            <span className="text-[9px] font-bold text-emerald-400 flex items-center justify-end gap-1">
                              <Target className="w-2.5 h-2.5" /> AI目標株価
                            </span>
                            <div className="flex items-baseline gap-1 justify-end">
                              <span className="text-sm font-extrabold text-emerald-300">
                                ¥{Number(item.target_price).toLocaleString()}
                              </span>
                              {item.upside_percent != null && (
                                <span className="text-[11px] font-bold text-emerald-400">
                                  (+{item.upside_percent}%)
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {item.stop_loss_price && (
                          <div className="hidden sm:block text-right font-mono bg-rose-500/10 border border-rose-500/25 px-2 py-1 rounded-xl">
                            <span className="text-[9px] text-rose-400 block font-semibold flex items-center justify-end gap-0.5">
                              <ShieldAlert className="w-2.5 h-2.5" /> 損切目安
                            </span>
                            <span className="text-xs font-bold text-rose-300">
                              ¥{Number(item.stop_loss_price).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* カタリスト (上昇のきっかけ) */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/30 to-cyan-950/20 border border-emerald-500/30 space-y-1">
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" /> 上昇のカタリスト・材料:
                      </span>
                      <p className="text-xs text-emerald-200 font-semibold leading-relaxed">
                        {item.catalyst}
                      </p>
                    </div>

                    {/* なぜ今これが良いのか？詳細AI分析 */}
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-gray-300 flex items-center gap-1">
                        <Bot className="w-3.5 h-3.5 text-cyan-400" /> AI推奨根拠 ＆ 業績裏付け:
                      </span>
                      <p className="text-gray-300 bg-black/40 p-3 rounded-xl border border-gray-800/80 leading-relaxed font-sans">
                        {item.ai_analysis}
                      </p>
                    </div>

                    {/* 注意すべきリスク要因 */}
                    <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1">
                      <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> 注意すべきリスク:
                      </span>
                      <p className="text-xs text-rose-200 leading-relaxed">
                        {item.risk_factors}
                      </p>
                    </div>

                  </div>

                  {/* Card Actions Bottom Toolbar */}
                  <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleToggleFav(item.ticker, item.name, item.sector)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isFav
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                      <span>{isFav ? 'お気に入り中' : 'お気に入り'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/stocks/${item.ticker}`}
                        className="px-3.5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold transition-all"
                      >
                        AIセンター
                      </Link>

                      <button
                        onClick={() => setBuyState({
                          ticker: item.ticker,
                          stockName: item.name,
                          currentPrice: item.current_price,
                          newsTitle: `【週末AI厳選 ${badge.label}】${item.catalyst}`,
                        })}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:opacity-95 active:scale-98 transition-all"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>仮想購入する</span>
                      </button>
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
