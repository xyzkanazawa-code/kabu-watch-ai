'use client';

import React from 'react';
import Link from 'next/link';
import { CommunityInvestor } from '@/lib/communityData';
import { 
  X, TrendingUp, TrendingDown, Sparkles, Star, 
  ArrowRight, ShieldCheck, ShoppingCart, Award, Calendar, ExternalLink
} from 'lucide-react';

interface InvestorDetailModalProps {
  investor: CommunityInvestor | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenBuyModal?: (params: { ticker: string; stockName: string; currentPrice: number; initialType: 'simulation' | 'real' }) => void;
}

export const InvestorDetailModal: React.FC<InvestorDetailModalProps> = ({
  investor,
  isOpen,
  onClose,
  onOpenBuyModal
}) => {
  if (!isOpen || !investor) return null;

  const isProfit = investor.totalPnLAmount >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#111827] border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-500/20 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Profile Area */}
        <div className="px-6 py-5 border-b border-gray-800 bg-gradient-to-r from-gray-900 via-[#0B0F19] to-gray-900">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={investor.avatarUrl}
                alt={investor.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-400/60 shadow-lg shadow-cyan-500/20"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-white">{investor.name}</h2>
                  {investor.isCurrentUser && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      あなた
                    </span>
                  )}
                </div>
                <p className="text-xs text-cyan-400 font-bold mt-0.5">{investor.title}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2 max-w-lg">{investor.bio}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Performance Dashboard */}
          <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-gray-800/80">
            <div className="p-3 rounded-xl bg-gray-950/80 border border-gray-800">
              <span className="text-[10px] text-gray-400 block">仮想売買 損益率</span>
              <div className={`text-base sm:text-lg font-mono font-extrabold flex items-center gap-1 ${
                isProfit ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isProfit ? '+' : ''}{investor.totalPnLPercent.toFixed(1)}%
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gray-950/80 border border-gray-800">
              <span className="text-[10px] text-gray-400 block">仮想売買 累計利益</span>
              <div className={`text-base sm:text-lg font-mono font-extrabold ${
                isProfit ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isProfit ? '+' : ''}¥{Math.round(investor.totalPnLAmount).toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gray-950/80 border border-gray-800">
              <span className="text-[10px] text-gray-400 block">トレード勝率</span>
              <div className="text-base sm:text-lg font-mono font-extrabold text-amber-400 flex items-center gap-1">
                <Award className="w-4 h-4" />
                {investor.winRate.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Section 1: 仮想売買ポジション */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>保有中の仮想売買ポジション ({investor.virtualPositions.length}銘柄)</span>
              </h3>
              <span className="text-[11px] text-gray-500">※ ノーリスクのシミュレーション検証株です</span>
            </div>

            {investor.virtualPositions.length === 0 ? (
              <p className="text-xs text-gray-500 p-4 bg-gray-900/40 rounded-2xl text-center">
                現在保有している仮想ポジションはありません。
              </p>
            ) : (
              <div className="space-y-3">
                {investor.virtualPositions.map((pos, idx) => {
                  const isItemUp = pos.pnlPercent >= 0;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 hover:border-cyan-500/40 transition-all space-y-3 shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                              {pos.ticker}
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded border bg-gray-950 text-gray-300 border-gray-800">
                              {pos.tradeType === 'spot' ? '現物' : pos.tradeType === 'margin_buy' ? '信用買い' : '信用売り'}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {pos.entryDate}買付
                            </span>
                          </div>
                          <Link
                            href={`/stocks/${pos.ticker}`}
                            className="text-sm sm:text-base font-bold text-white hover:text-cyan-300 transition-colors mt-1.5 inline-flex items-center gap-1"
                          >
                            <span>{pos.name}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                          </Link>
                        </div>

                        {/* 損益表示 */}
                        <div className="text-right font-mono">
                          <span className={`text-base font-extrabold block ${
                            isItemUp ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isItemUp ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                          </span>
                          <span className={`text-xs font-bold ${
                            isItemUp ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isItemUp ? '+' : ''}¥{Math.round(pos.pnlAmount).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* 価格詳細グリッド */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-2.5 rounded-xl bg-gray-950/80 border border-gray-800/80 font-mono">
                        <div>
                          <span className="text-gray-500 block text-[10px]">取得単価</span>
                          <span className="text-gray-200 font-bold">¥{pos.entryPrice.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-[10px]">現在株価</span>
                          <span className="text-white font-bold">¥{pos.currentPrice.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-[10px]">株数</span>
                          <span className="text-gray-300 font-bold">{pos.shares}株</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-[10px]">時価総額</span>
                          <span className="text-cyan-300 font-bold">¥{(pos.currentPrice * pos.shares).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* エントリー理由・メモ */}
                      {pos.notes && (
                        <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-gray-300">
                          <span className="text-cyan-400 font-bold block text-[10px] mb-0.5">💡 売買理由・着目点</span>
                          {pos.notes}
                        </div>
                      )}

                      {/* 真似して購入アクション */}
                      {onOpenBuyModal && (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => onOpenBuyModal({
                              ticker: pos.ticker,
                              stockName: pos.name,
                              currentPrice: pos.currentPrice,
                              initialType: 'simulation'
                            })}
                            className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1 transition-all"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            自分も仮想で試す
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenBuyModal({
                              ticker: pos.ticker,
                              stockName: pos.name,
                              currentPrice: pos.currentPrice,
                              initialType: 'real'
                            })}
                            className="px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1 transition-all"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                            実保有に登録
                          </button>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: お気に入りウォッチリスト */}
          <div className="space-y-3 pt-2 border-t border-gray-800/80">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>お気に入り登録中の注目銘柄 ({investor.watchList.length}銘柄)</span>
              </h3>
              <span className="text-[11px] text-gray-500">気になっている監視対象</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {investor.watchList.map((item, idx) => {
                const isItemUp = item.changePercent >= 0;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-gray-900/60 border border-gray-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-2 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {item.ticker}
                          </span>
                          <span className="text-[10px] text-gray-400 bg-gray-950 px-2 py-0.5 rounded border border-gray-800">
                            {item.sector}
                          </span>
                        </div>
                        <div className={`text-xs font-mono font-bold ${
                          isItemUp ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isItemUp ? '+' : ''}{item.changePercent.toFixed(2)}%
                        </div>
                      </div>

                      <Link
                        href={`/stocks/${item.ticker}`}
                        className="text-sm font-bold text-white hover:text-cyan-300 transition-colors mt-2 inline-flex items-center gap-1"
                      >
                        <span>{item.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                      </Link>

                      {item.reason && (
                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                          {item.reason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 font-mono">
                      <span className="text-xs font-extrabold text-white">¥{item.price.toLocaleString()}</span>
                      <Link
                        href={`/stocks/${item.ticker}`}
                        className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-0.5"
                      >
                        詳細を見る <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 bg-[#0B0F19] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs transition-all"
          >
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
};
