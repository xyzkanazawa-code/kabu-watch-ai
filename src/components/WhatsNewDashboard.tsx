'use client';

import React from 'react';
import Link from 'next/link';
import { BellRing, Sparkles, TrendingUp, AlertTriangle, ArrowRight, CheckCircle2, Star } from 'lucide-react';

interface WhatsNewDiff {
  ticker: string;
  stockName: string;
  price: number;
  changePercent: number;
  newNewsCount: number;
  newDisclosureCount: number;
  newEarningsCount: number;
  newPartnershipCount: number;
  hasWarningChange: boolean;
  warningDetail?: string;
  totalNewItems: number;
  hasGlow: boolean;
}

interface WhatsNewDashboardProps {
  diffs: WhatsNewDiff[];
  loading: boolean;
  lastAccessTime: string;
}

export const WhatsNewDashboard: React.FC<WhatsNewDashboardProps> = ({
  diffs,
  loading,
  lastAccessTime
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/40 to-[#0B0F19] border border-emerald-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-400">
            <BellRing className="w-8 h-8 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                差分自動トラッキング
              </span>
              <span className="text-xs font-mono text-gray-400">
                前回アクセス: {new Date(lastAccessTime).toLocaleString('ja-JP')}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1 tracking-tight">
              昨日（前回）からの変化ダッシュボード
            </h1>
          </div>
        </div>

        <div className="text-xs text-gray-300 bg-gray-900/80 p-3 rounded-xl border border-gray-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>新着情報がある銘柄はグリーン/シアンで脈動発光中</span>
        </div>
      </div>

      {/* Grid of Favorite Stock Cards */}
      {loading ? (
        <div className="py-16 text-center text-cyan-400 font-semibold animate-pulse">
          お気に入り銘柄の新着差分を集計・計算中...
        </div>
      ) : diffs.length === 0 ? (
        <div className="py-16 text-center text-gray-400 border border-dashed border-gray-800 rounded-2xl">
          お気に入り銘柄がまだ登録されていません。検索窓から銘柄を追加してください。
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {diffs.map((item) => {
            const isUp = item.changePercent >= 0;
            return (
              <Link
                key={item.ticker}
                href={`/stocks/${item.ticker}`}
                className={`group relative p-5 rounded-2xl bg-[#111827] border transition-all ${
                  item.hasGlow
                    ? 'border-emerald-500/60 animate-glow shadow-lg shadow-emerald-500/10'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                {/* Glow Badge */}
                {item.hasGlow && (
                  <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-extrabold shadow-lg animate-pulse flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {item.totalNewItems}件の新着あり
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                        {item.ticker}
                      </span>
                      <h2 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {item.stockName}
                      </h2>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2 font-mono text-xs">
                      <span className="font-bold text-white">¥{item.price.toLocaleString()}</span>
                      <span className={isUp ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {isUp ? '+' : ''}{item.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>

                {/* ⚠️ Warning Change Alert */}
                {item.hasWarningChange && (
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-start gap-2 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{item.warningDetail}</span>
                  </div>
                )}

                {/* Count Chips Grid */}
                <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-gray-900 border border-gray-800">
                    <span className="text-[10px] text-gray-500 block">新着ニュース</span>
                    <span className={`font-mono font-bold ${item.newNewsCount > 0 ? 'text-cyan-400' : 'text-gray-500'}`}>
                      {item.newNewsCount}件
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-gray-900 border border-gray-800">
                    <span className="text-[10px] text-gray-500 block">新着開示</span>
                    <span className={`font-mono font-bold ${item.newDisclosureCount > 0 ? 'text-purple-400' : 'text-gray-500'}`}>
                      {item.newDisclosureCount}件
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-gray-900 border border-gray-800">
                    <span className="text-[10px] text-gray-500 block">決算関連</span>
                    <span className={`font-mono font-bold ${item.newEarningsCount > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                      {item.newEarningsCount}件
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-gray-900 border border-gray-800">
                    <span className="text-[10px] text-gray-500 block">提携情報</span>
                    <span className={`font-mono font-bold ${item.newPartnershipCount > 0 ? 'text-rose-400' : 'text-gray-500'}`}>
                      {item.newPartnershipCount}件
                    </span>
                  </div>
                </div>

              </Link>
            );
          })}
        </div>
      )}

    </div>
  );
};
