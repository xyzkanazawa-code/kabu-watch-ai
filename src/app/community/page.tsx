'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { InvestorDetailModal } from '@/components/InvestorDetailModal';
import { BuyModal } from '@/components/BuyModal';
import { SemanticSearchModal } from '@/components/SemanticSearchModal';
import { CommunityInvestor, DEFAULT_COMMUNITY_INVESTORS } from '@/lib/communityData';
import { getPortfolioItems, calcItemPnL } from '@/lib/portfolioStorage';
import { getFavorites, getAllFavoriteMetas } from '@/lib/storage';
import { STOCK_MASTER } from '@/lib/dataFetcher';
import { useAuth } from '@/lib/useAuth';
import { 
  Users, Trophy, TrendingUp, TrendingDown, Sparkles, 
  Star, Award, ArrowRight, ShieldCheck, ShoppingCart, 
  ExternalLink, Eye, Info, Search
} from 'lucide-react';

export default function CommunityPage() {
  const { user } = useAuth();
  const [investors, setInvestors] = useState<CommunityInvestor[]>([]);
  const [rankingSort, setRankingSort] = useState<'percent' | 'amount' | 'watchlist'>('percent');
  const [selectedInvestor, setSelectedInvestor] = useState<CommunityInvestor | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // 購入モーダル
  const [buyModalTarget, setBuyModalTarget] = useState<{
    isOpen: boolean;
    ticker?: string;
    stockName?: string;
    currentPrice?: number;
    initialType?: 'simulation' | 'real';
  }>({ isOpen: false });

  useEffect(() => {
    const favs = getFavorites();
    setFavorites(favs);
    buildInvestorRankings(favs);
  }, [user]);

  // マサ自身の仮想売買成績とお気に入りリストを合算してランキングを生成
  const buildInvestorRankings = (favTickers: string[]) => {
    const items = getPortfolioItems();
    const simItems = items.filter((i) => i.type === 'simulation');

    let myTotalInvestment = 0;
    let myTotalPnLAmount = 0;

    const myVirtualPositions = simItems.map((item) => {
      const pnl = calcItemPnL(item);
      myTotalInvestment += pnl.investment;
      myTotalPnLAmount += pnl.pnlAmount;

      return {
        ticker: item.ticker,
        name: item.name,
        tradeType: item.tradeType,
        entryPrice: item.entryPrice,
        currentPrice: item.currentPrice,
        shares: item.shares,
        pnlPercent: pnl.pnlPercent,
        pnlAmount: pnl.pnlAmount,
        entryDate: item.entryDate,
        notes: item.notes || '自己判断による検証エントリー',
      };
    });

    const myTotalPnLPercent = myTotalInvestment > 0 ? (myTotalPnLAmount / myTotalInvestment) * 100 : 0;
    const metas = getAllFavoriteMetas();

    const myWatchlist = favTickers.map((t) => {
      const master = STOCK_MASTER[t];
      return {
        ticker: t,
        name: master?.name || metas[t]?.name || `銘柄 (${t})`,
        sector: master?.sector || metas[t]?.sector || '東証上場銘柄',
        price: master?.price || metas[t]?.price || 1000,
        changePercent: master?.changePercent ?? metas[t]?.changePercent ?? 0,
        reason: '気になる監視銘柄',
      };
    });

    // マサのコミュニティカード
    const myProfile: CommunityInvestor = {
      id: 'current-user',
      name: user?.name || 'マサ（投資家）',
      avatarUrl: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      title: '実践的データ重視派',
      bio: '日々の開示情報とAIインパクト分析を元に、仮想売買と実保有をポートフォリオ管理中！',
      winRate: myVirtualPositions.length > 0 ? (myVirtualPositions.filter(p => p.pnlAmount >= 0).length / myVirtualPositions.length) * 100 : 75.0,
      totalPnLAmount: myTotalPnLAmount || 120000,
      totalPnLPercent: myTotalPnLPercent || 14.8,
      isCurrentUser: true,
      virtualPositions: myVirtualPositions.length > 0 ? myVirtualPositions : [
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
          notes: 'EUVマスク検査装置の需要増に着目した仮想エントリー。',
        }
      ],
      watchList: myWatchlist.length > 0 ? myWatchlist : [
        { ticker: '7203', name: 'トヨタ自動車', sector: '輸送用機器', price: 2785.5, changePercent: 1.5, reason: '全固体電池ロードマップ' },
        { ticker: '9984', name: 'ソフトバンクグループ', sector: '情報・通信', price: 8940, changePercent: 2.1, reason: 'AIビジョン出資' },
      ],
    };

    setInvestors([myProfile, ...DEFAULT_COMMUNITY_INVESTORS]);
  };

  // ソート処理
  const sortedInvestors = [...investors].sort((a, b) => {
    if (rankingSort === 'percent') {
      return b.totalPnLPercent - a.totalPnLPercent;
    } else if (rankingSort === 'amount') {
      return b.totalPnLAmount - a.totalPnLAmount;
    } else {
      return b.watchList.length - a.watchList.length;
    }
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] pb-24">
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        favoritesCount={favorites.length}
        hasNewAlerts={false}
      />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-cyan-500/20 border border-amber-500/30 text-amber-400">
                <Users className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                投資家コミュニティ ＆ 仮想トレードランキング
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              他の投資家が「お気に入り登録している注目株」や「仮想売買の成績・売買理由」を研究できます！
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-900/80 px-3.5 py-2 rounded-xl border border-gray-800">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>実際の保有株は非公開・安全です。仮想トレードとお気に入り銘柄のみ共有されます。</span>
          </div>
        </div>

        {/* Ranking Sort Filter Tabs */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setRankingSort('percent')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                rankingSort === 'percent'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>🏆 仮想損益率ランキング</span>
            </button>

            <button
              onClick={() => setRankingSort('amount')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                rankingSort === 'amount'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>💰 累計利益額順</span>
            </button>

            <button
              onClick={() => setRankingSort('watchlist')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                rankingSort === 'watchlist'
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-lg shadow-purple-500/10'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-purple-400" />
              <span>⭐ 注目株ウォッチ数順</span>
            </button>
          </div>

          <div className="text-xs text-gray-400">
            全 <strong className="text-white font-mono">{investors.length}名</strong> の投資家データ
          </div>
        </div>

        {/* Investors Ranking Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedInvestors.map((investor, idx) => {
            const rank = idx + 1;
            const isProfit = investor.totalPnLAmount >= 0;

            return (
              <div
                key={investor.id}
                onClick={() => setSelectedInvestor(investor)}
                className={`p-5 rounded-3xl bg-[#111827] border transition-all cursor-pointer space-y-4 hover:shadow-2xl hover:scale-[1.01] group ${
                  investor.isCurrentUser
                    ? 'border-cyan-500/50 shadow-cyan-500/10 bg-gradient-to-br from-[#111827] via-[#111c30] to-[#111827]'
                    : rank === 1
                    ? 'border-amber-500/40 shadow-amber-500/10'
                    : rank === 2
                    ? 'border-slate-400/40'
                    : rank === 3
                    ? 'border-amber-700/40'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                {/* Card Top: Rank & Profile */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-mono font-extrabold text-sm shrink-0 border ${
                      rank === 1
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/20'
                        : rank === 2
                        ? 'bg-slate-300/20 text-slate-200 border-slate-400/50'
                        : rank === 3
                        ? 'bg-amber-700/20 text-amber-400 border-amber-700/50'
                        : 'bg-gray-900 text-gray-400 border-gray-800'
                    }`}>
                      {rank === 1 ? '🥇1' : rank === 2 ? '🥈2' : rank === 3 ? '🥉3' : `${rank}`}
                    </div>

                    <img
                      src={investor.avatarUrl}
                      alt={investor.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-gray-700 group-hover:border-cyan-400 transition-colors shadow"
                    />

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm sm:text-base text-white group-hover:text-cyan-300 transition-colors">
                          {investor.name}
                        </span>
                        {investor.isCurrentUser && (
                          <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            あなた
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 block mt-0.5 line-clamp-1">
                        {investor.title}
                      </span>
                    </div>
                  </div>

                  {/* 損益ハイライト */}
                  <div className="text-right font-mono shrink-0">
                    <span className={`text-base sm:text-lg font-extrabold flex items-center justify-end gap-1 ${
                      isProfit ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {isProfit ? '+' : ''}{investor.totalPnLPercent.toFixed(1)}%
                    </span>
                    <span className="text-[11px] text-gray-400 block">
                      {isProfit ? '+' : ''}¥{Math.round(investor.totalPnLAmount).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 主力ポジション & ウォッチ銘柄のダイジェストチップ */}
                <div className="space-y-2 pt-2 border-t border-gray-800/80 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-gray-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      仮想保有:
                    </span>
                    {investor.virtualPositions.slice(0, 3).map((p, pIdx) => (
                      <span
                        key={pIdx}
                        className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-gray-950 border border-gray-800 text-gray-200 flex items-center gap-1"
                      >
                        <span>{p.name}</span>
                        <span className={p.pnlPercent >= 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                          ({p.pnlPercent >= 0 ? '+' : ''}{p.pnlPercent.toFixed(0)}%)
                        </span>
                      </span>
                    ))}
                    {investor.virtualPositions.length > 3 && (
                      <span className="text-[10px] text-gray-500">+{investor.virtualPositions.length - 3}銘柄</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      お気に入り:
                    </span>
                    {investor.watchList.slice(0, 3).map((w, wIdx) => (
                      <span
                        key={wIdx}
                        className="text-[11px] px-2 py-0.5 rounded-lg bg-gray-950/60 border border-gray-800 text-gray-300"
                      >
                        {w.name}
                      </span>
                    ))}
                    {investor.watchList.length > 3 && (
                      <span className="text-[10px] text-gray-500">+{investor.watchList.length - 3}銘柄</span>
                    )}
                  </div>
                </div>

                {/* Card Footer: Detail Click Trigger */}
                <div className="pt-2 flex items-center justify-between text-xs text-gray-400 border-t border-gray-800/60">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    勝率: <strong className="text-amber-400">{investor.winRate.toFixed(1)}%</strong>
                  </span>

                  <span className="text-cyan-400 group-hover:text-cyan-300 font-bold inline-flex items-center gap-1 text-xs">
                    <span>ポートフォリオと注目株を見る</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>

              </div>
            );
          })}
        </div>

      </main>

      {/* 投資家詳細モーダル */}
      <InvestorDetailModal
        investor={selectedInvestor}
        isOpen={!!selectedInvestor}
        onClose={() => setSelectedInvestor(null)}
        onOpenBuyModal={(params) => {
          setBuyModalTarget({
            isOpen: true,
            ticker: params.ticker,
            stockName: params.stockName,
            currentPrice: params.currentPrice,
            initialType: params.initialType,
          });
        }}
      />

      {/* 銘柄購入モーダル */}
      <BuyModal
        isOpen={buyModalTarget.isOpen}
        onClose={() => setBuyModalTarget({ isOpen: false })}
        ticker={buyModalTarget.ticker}
        stockName={buyModalTarget.stockName}
        currentPrice={buyModalTarget.currentPrice}
        initialType={buyModalTarget.initialType}
      />

      {/* 検索モーダル */}
      <SemanticSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

    </div>
  );
}
