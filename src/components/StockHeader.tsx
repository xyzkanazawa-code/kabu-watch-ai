'use client';

import React from 'react';
import { StockInfo } from '@/types/stock';
import { Star, TrendingUp, TrendingDown, Calendar, PieChart, ShieldAlert, BarChart3, Clock, ShoppingCart, Moon, ShieldCheck, Sparkles } from 'lucide-react';

interface StockHeaderProps {
  stock: StockInfo;
  isFav: boolean;
  onToggleFav: () => void;
  onOpenBuy?: (type?: 'simulation' | 'real') => void;
}

export const StockHeader: React.FC<StockHeaderProps> = ({ stock, isFav, onToggleFav, onOpenBuy }) => {
  const isUp = stock.change >= 0;

  // 信用倍率の色分け判定
  const getCreditRatioColor = (ratio: number) => {
    if (ratio > 5.0) return 'text-amber-400 bg-amber-500/10 border-amber-500/30'; // 買い残過多
    if (ratio < 1.0) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';   // 売り残過多(空売り優勢)
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  return (
    <div className="w-full bg-[#111827] border border-gray-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-6">
      
      {/* Top Company Info & Price Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Ticker / Name */}
        <div className="flex items-start gap-3">
          <button
            onClick={onToggleFav}
            className={`p-3 rounded-2xl border transition-all ${
              isFav
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
            }`}
            title={isFav ? 'お気に入りから解除' : 'お気に入りに追加'}
          >
            <Star className={`w-6 h-6 ${isFav ? 'fill-amber-400' : ''}`} />
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                {stock.ticker}
              </span>
              <span className="text-xs text-gray-400 border border-gray-800 px-2 py-0.5 rounded bg-gray-900">
                東証{stock.market}
              </span>
              <span className="text-xs text-gray-400 border border-gray-800 px-2 py-0.5 rounded bg-gray-900">
                {stock.sector}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1 tracking-tight">
              {stock.name}
            </h1>
          </div>
        </div>

        {/* Right Price Display & Buy Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-baseline md:items-end gap-3 bg-gray-900/80 p-3.5 rounded-xl border border-gray-800">
            <div>
              <div className="text-[10px] text-gray-400">東証終値</div>
              <div className="text-3xl font-extrabold font-mono text-white tracking-tight">
                ¥{stock.price.toLocaleString()}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className={`flex items-center text-sm font-bold font-mono ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isUp ? <TrendingUp className="w-4 h-4 mr-0.5" /> : <TrendingDown className="w-4 h-4 mr-0.5" />}
                {isUp ? '+' : ''}{stock.change.toLocaleString()} ({isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%)
              </div>
              <div className="text-[10px] text-gray-400">
                出来高: {stock.volume.toLocaleString()}株
              </div>
            </div>
          </div>

          {/* 🌙 夜間PTS取引情報バッジ */}
          {stock.pts && (
            <div className="flex items-baseline md:items-end gap-2.5 bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-500/40 p-3.5 rounded-xl shadow-lg shadow-purple-500/10">
              <div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-purple-300">
                  <Moon className="w-3 h-3 text-purple-400 animate-pulse" />
                  <span>夜間PTS</span>
                </div>
                <div className="text-2xl font-extrabold font-mono text-white tracking-tight">
                  ¥{stock.pts.price.toLocaleString()}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className={`flex items-center text-xs font-bold font-mono ${stock.pts.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stock.pts.change >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                  {stock.pts.change >= 0 ? '+' : ''}{stock.pts.change.toLocaleString()} ({stock.pts.change >= 0 ? '+' : ''}{stock.pts.changePercent.toFixed(2)}%)
                </div>
                <div className="text-[9px] text-purple-300/80 font-mono">
                  {stock.pts.time ? `約定: ${stock.pts.time}` : '東証比'}
                </div>
              </div>
            </div>
          )}


          {onOpenBuy && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenBuy('real')}
                className="px-3.5 py-3 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-500/50 text-purple-200 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/10 hover:opacity-95 active:scale-98 transition-all"
                title="実際に保有している株としてポートフォリオに登録"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>🏦 実保有を登録</span>
              </button>
              <button
                onClick={() => onOpenBuy('simulation')}
                className="px-3.5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:opacity-95 active:scale-98 transition-all"
                title="ノーリスクで仮想売買シミュレーションを開始"
              >
                <Sparkles className="w-4 h-4" />
                <span>🧪 仮想トレード</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Grid Indicators Section */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* PER */}
        <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-center">
          <span className="text-[10px] text-gray-400 block">PER (予想)</span>
          <span className="text-sm font-bold font-mono text-white">{stock.financials.per}倍</span>
        </div>

        {/* PBR */}
        <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-center">
          <span className="text-[10px] text-gray-400 block">PBR (実績)</span>
          <span className="text-sm font-bold font-mono text-white">{stock.financials.pbr}倍</span>
        </div>

        {/* ROE */}
        <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-center">
          <span className="text-[10px] text-gray-400 block">ROE</span>
          <span className="text-sm font-bold font-mono text-emerald-400">{stock.financials.roe}%</span>
        </div>

        {/* 配当利回り */}
        <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-center">
          <span className="text-[10px] text-gray-400 block">配当利回り</span>
          <span className="text-sm font-bold font-mono text-cyan-400">{stock.financials.dividendYield}%</span>
        </div>

        {/* 次回決算日 */}
        <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-center">
          <span className="text-[10px] text-gray-400 block flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-purple-400" /> 次回決算
          </span>
          <span className="text-xs font-bold text-purple-300">{stock.financials.nextEarningsDate}</span>
        </div>

        {/* 時価総額 */}
        <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-center">
          <span className="text-[10px] text-gray-400 block">時価総額</span>
          <span className="text-xs font-bold text-gray-200">{stock.financials.marketCap.toLocaleString()}億円</span>
        </div>

      </div>

      {/* 信用情報 Row */}
      <div className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-gray-300">信用情報</span>
          <span className="text-[10px] text-gray-500">（更新日: {stock.credit.lastUpdated}）</span>
        </div>

        <div className="flex items-center gap-4 flex-wrap font-mono">
          <div>
            <span className="text-gray-400 text-[11px] mr-1">信用買い残:</span>
            <span className="font-bold text-emerald-400">{(stock.credit.buyBalance / 10000).toFixed(1)}万株</span>
          </div>
          <div>
            <span className="text-gray-400 text-[11px] mr-1">信用売り残:</span>
            <span className="font-bold text-rose-400">{(stock.credit.sellBalance / 10000).toFixed(1)}万株</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400 text-[11px]">信用倍率:</span>
            <span className={`px-2 py-0.5 rounded font-bold border ${getCreditRatioColor(stock.credit.ratio)}`}>
              {stock.credit.ratio.toFixed(2)}倍
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
