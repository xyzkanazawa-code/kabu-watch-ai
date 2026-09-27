'use client';

import React from 'react';
import { PortfolioAuditResult } from '@/types/stock';
import { 
  Bot, Sparkles, X, ShieldAlert, PieChart, TrendingUp, 
  AlertTriangle, CheckCircle, Clock, Zap, ArrowRight, Layers 
} from 'lucide-react';

interface PortfolioAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: PortfolioAuditResult | null;
  loading: boolean;
}

export const PortfolioAuditModal: React.FC<PortfolioAuditModalProps> = ({
  isOpen,
  onClose,
  result,
  loading,
}) => {
  if (!isOpen) return null;

  const getScoreBadge = (score: string) => {
    switch (score) {
      case 'A':
        return { label: 'ランク A (極めて健全)', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'B':
        return { label: 'ランク B (概ね良好・分散余地あり)', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      case 'C':
        return { label: 'ランク C (特定セクター集中要注意)', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'D':
        return { label: 'ランク D (高リスク・信用期日警戒)', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      default:
        return { label: 'ランク E (見直し推奨)', bg: 'bg-red-500/20 text-red-300 border-red-500/40' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#111827] border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-500/20 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#0B0F19]/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-400">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  Gemini 1.5 Flash 資産診断
                </span>
                <span className="text-xs text-gray-400">プロアナリスト視点</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                ポートフォリオ総合AI診断レポート
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">

          {loading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto animate-spin">
                <Sparkles className="w-8 h-8 text-cyan-400" />
              </div>
              <p className="text-base font-bold text-white animate-pulse">
                Geminiがポートフォリオのセクター分散・直近ニュース・信用リスクを診断中...
              </p>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                保有銘柄の時価総額比率、開示による波及影響、期日管理を多角的に分析しています。
              </p>
            </div>
          ) : result ? (
            <>
              {/* 1. 総合スコア Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-gray-900 via-[#0B0F19] to-gray-900 border border-cyan-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center font-extrabold text-2xl text-black shadow-lg">
                      {result.score}
                    </div>
                    <div>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getScoreBadge(result.score).bg}`}>
                        {getScoreBadge(result.score).label}
                      </span>
                      <p className="text-xs text-gray-300 mt-1 font-medium leading-relaxed">
                        {result.scoreReason}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. セクター分散比率バー */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-300 flex items-center gap-1.5">
                      <PieChart className="w-4 h-4 text-cyan-400" /> セクター配分
                    </span>
                    <span className="text-gray-400 text-[11px]">業界集中度の判定</span>
                  </div>

                  {/* Multi-color Progress Bar */}
                  <div className="w-full h-3 bg-gray-950 rounded-full overflow-hidden flex border border-gray-800">
                    {result.sectorDistribution.map((sec, idx) => {
                      const colors = ['bg-cyan-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'];
                      const color = colors[idx % colors.length];
                      return (
                        <div
                          key={sec.sector}
                          style={{ width: `${sec.ratio}%` }}
                          className={`${color} h-full transition-all`}
                          title={`${sec.sector}: ${sec.ratio}%`}
                        />
                      );
                    })}
                  </div>

                  {/* Sector legend tags */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {result.sectorDistribution.map((sec, idx) => {
                      const textColors = ['text-cyan-400', 'text-emerald-400', 'text-purple-400', 'text-amber-400', 'text-rose-400'];
                      const dotColors = ['bg-cyan-400', 'bg-emerald-400', 'bg-purple-400', 'bg-amber-400', 'bg-rose-400'];
                      return (
                        <div key={sec.sector} className="flex items-center gap-1.5 text-xs bg-gray-900/80 px-2.5 py-1 rounded-lg border border-gray-800">
                          <span className={`w-2 h-2 rounded-full ${dotColors[idx % dotColors.length]}`} />
                          <span className="text-gray-300 font-semibold">{sec.sector}</span>
                          <span className={`font-mono font-bold ${textColors[idx % textColors.length]}`}>{sec.ratio}%</span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-gray-300 bg-black/40 p-3 rounded-xl border border-gray-800 leading-relaxed mt-2">
                    {result.sectorAnalysis}
                  </p>
                </div>
              </div>

              {/* 3. 直近注目リスク・材料 */}
              {result.risksAndCatalysts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" /> 保有銘柄の直近材料＆リスク要因
                  </h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {result.risksAndCatalysts.map((rc, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-gray-900/90 border border-gray-800 hover:border-amber-500/40 transition-all space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                              {rc.ticker}
                            </span>
                            <span className="text-xs font-bold text-white">{rc.stockName}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            rc.urgency === '高' 
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' 
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}>
                            影響度: {rc.urgency}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-gray-200">{rc.title}</h4>
                        <p className="text-xs text-gray-400 leading-relaxed font-sans">{rc.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. 信用ポジション・期日へのアドバイス */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/20 to-rose-950/20 border border-amber-500/30 space-y-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> 信用期日＆需給アドバイス
                </span>
                <p className="text-xs text-gray-200 leading-relaxed bg-black/40 p-3 rounded-lg border border-gray-800/60">
                  {result.marginAdvice}
                </p>
              </div>

              {/* 5. 今後のアクション提案 */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> 推奨アクション視点
                </h3>
                <div className="space-y-2">
                  {result.actionProposals.map((act, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-gray-900/80 border border-emerald-500/20">
                      <div className="p-1 rounded bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <span className="text-xs text-gray-200 leading-relaxed">{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}

        </div>

      </div>
    </div>
  );
};
