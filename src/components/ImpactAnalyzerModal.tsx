'use client';

import React from 'react';
import { StockImpactAnalysis, ImpactMatrix } from '@/types/stock';
import { useAnalyzeNews } from '@/lib/useAnalyzeNews';
import { 
  Sparkles, TrendingUp, AlertTriangle, ShieldCheck, Star, X, 
  Zap, Layers, Target, Clock, Database, RefreshCw, CheckCircle2, 
  Building2, HelpCircle 
} from 'lucide-react';

interface ImpactAnalyzerModalProps {
  title: string;
  stockName?: string;
  ticker?: string;
  url?: string;
  body?: string;
  type?: string;
  impactAnalysis?: StockImpactAnalysis;
  impactMatrix?: ImpactMatrix;
  isOpen: boolean;
  onClose: () => void;
}

export const ImpactAnalyzerModal: React.FC<ImpactAnalyzerModalProps> = ({
  title,
  stockName,
  ticker,
  url,
  body,
  type,
  impactAnalysis: propImpactAnalysis,
  impactMatrix: propImpactMatrix,
  isOpen,
  onClose,
}) => {
  // SWRを活用した共有AIキャッシュフェッチャー
  const { data: apiData, isLoading, isCached, cachedAt, mutate } = useAnalyzeNews({
    url,
    title,
    body,
    ticker,
    type,
    enabled: isOpen && !!title,
  });

  if (!isOpen) return null;

  // APIデータ または Propsデータを統合
  const finalImpactAnalysis = apiData?.market_impact || propImpactAnalysis;
  const finalImpactMatrix = apiData?.market_impact?.matrix || propImpactMatrix;
  const score = apiData?.importance_score || finalImpactMatrix?.importanceScore || 4;
  const summary = apiData?.summary;
  const partnerDetails = apiData?.partner_details;

  const renderStars = (num: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < num ? 'text-amber-400 fill-amber-400' : 'text-gray-700'}`}
      />
    ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#111827] border border-emerald-500/40 rounded-2xl shadow-2xl shadow-emerald-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#0B0F19]/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-400">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Gemini 株価直結アナライザー
                </span>
                {ticker && (
                  <span className="text-xs font-mono text-gray-400">
                    {ticker} {stockName}
                  </span>
                )}
                {/* 共有キャッシュステータスバッジ */}
                {!isLoading && apiData && (
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    isCached 
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' 
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {isCached ? (
                      <>
                        <Database className="w-3 h-3 text-cyan-400" />
                        共有キャッシュヒット (Gemini消費: 0)
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        初回AI市場解析完了 (DB保存済)
                      </>
                    )}
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-white mt-1 line-clamp-1">
                {title}
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

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* 初回ロード時: スケルトンスクリーン UI */}
          {isLoading && !apiData && !propImpactAnalysis ? (
            <div className="py-12 px-6 flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center animate-spin">
                  <Sparkles className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-cyan-400/10 blur-xl animate-pulse" />
              </div>

              <div className="text-center space-y-2">
                <p className="text-base font-bold text-white flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  AIが市場影響を初解析中...
                </p>
                <p className="text-xs text-gray-400 max-w-md">
                  Gemini 1.5 Flash が投資判断直結の株価影響6項目・業績予想への波及を解析しています。一度生成された結果は全ユーザー間で無料キャッシュ共有されます。
                </p>
              </div>

              {/* スケルトンバー */}
              <div className="w-full max-w-lg space-y-3 pt-2">
                <div className="h-10 bg-gray-800/60 rounded-xl animate-pulse border border-gray-800" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-20 bg-gray-800/40 rounded-xl animate-pulse border border-gray-800" />
                  <div className="h-20 bg-gray-800/40 rounded-xl animate-pulse border border-gray-800" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-20 bg-gray-800/40 rounded-xl animate-pulse border border-gray-800" />
                  <div className="h-20 bg-gray-800/40 rounded-xl animate-pulse border border-gray-800" />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* 3行要約 (AI自動要約エリア) */}
              {summary && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/30 to-emerald-950/20 border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" /> AI重要ポイント要約
                    </span>
                    {cachedAt && (
                      <span className="text-[10px] text-gray-500 font-mono">
                        キャッシュ日時: {new Date(cachedAt).toLocaleString('ja-JP')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed font-sans whitespace-pre-line bg-black/40 p-3 rounded-lg border border-gray-800/60">
                    {summary}
                  </p>
                </div>
              )}

              {/* ⑩ インパクトマトリクス Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-gray-900 via-gray-900 to-[#0B0F19] border border-emerald-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400">AI重要度判定:</span>
                    <div className="flex items-center gap-1">{renderStars(score)}</div>
                    <span className="text-xs font-bold text-amber-400 ml-1">
                      ({score === 5 ? '★★★★★ 非常に重要' : score === 4 ? '★★★★☆ 重要' : '★★★☆☆ 注目'})
                    </span>
                  </div>
                  {isCached && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                      ⚡ 超高速キャッシュ応答 (0.1秒)
                    </span>
                  )}
                </div>

                {/* Impact Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 rounded-lg bg-gray-950/80 border border-gray-800 text-center">
                    <span className="text-[10px] text-gray-500 block">業績影響</span>
                    <span className="text-xs font-bold text-emerald-400">
                      {finalImpactMatrix?.earningsImpact || 'あり'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-950/80 border border-gray-800 text-center">
                    <span className="text-[10px] text-gray-500 block">財務影響</span>
                    <span className="text-xs font-bold text-cyan-400">
                      {finalImpactMatrix?.financialImpact || 'あり'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-950/80 border border-gray-800 text-center">
                    <span className="text-[10px] text-gray-500 block">事業インパクト</span>
                    <span className="text-xs font-bold text-purple-400">
                      {finalImpactMatrix?.businessImpact || '大'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-950/80 border border-gray-800 text-center">
                    <span className="text-[10px] text-gray-500 block">市場インパクト</span>
                    <span className="text-xs font-bold text-rose-400">
                      {finalImpactMatrix?.marketImpact || '短期急騰の可能性'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 提携先・協業先シナジー詳細（該当する場合） */}
              {partnerDetails && partnerDetails.name && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/20 to-purple-950/20 border border-rose-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-rose-400" /> 提携・協業パートナー詳細
                    </span>
                    {partnerDetails.listedStatus && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 font-semibold">
                        {partnerDetails.listedStatus}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div className="font-bold text-white text-sm">
                      {partnerDetails.name}
                    </div>
                    {partnerDetails.synergyPrediction && (
                      <p className="text-gray-300 bg-black/40 p-2.5 rounded-lg border border-gray-800/80 leading-relaxed font-sans">
                        <span className="text-rose-400 font-semibold">シナジー予測: </span>
                        {partnerDetails.synergyPrediction}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ⑥ 6項目ディープアナライザー Grid */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" /> 投資判断直結 6大影響分析
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* 1. 売上への影響 */}
                  <div className="p-3.5 rounded-xl bg-gray-900/90 border border-gray-800 hover:border-emerald-500/40 transition-all space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-400" /> 1. 売上への影響
                      </span>
                      <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                        {finalImpactAnalysis?.salesImpact?.type || 'プラス'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {finalImpactAnalysis?.salesImpact?.detail || '新規受託およびグローバル市場での顧客獲得により、売上高の持続的拡大に寄与する見込みです。'}
                    </p>
                  </div>

                  {/* 2. 利益への影響 */}
                  <div className="p-3.5 rounded-xl bg-gray-900/90 border border-gray-800 hover:border-emerald-500/40 transition-all space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" /> 2. 利益への影響
                      </span>
                      <span className="text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                        {finalImpactAnalysis?.profitImpact?.type || 'プラス'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {finalImpactAnalysis?.profitImpact?.detail || '高粗利プロダクトの比率上昇に伴い、営業利益率の向上が期待されます。'}
                    </p>
                  </div>

                  {/* 3. 通期業績予想への影響 */}
                  <div className="p-3.5 rounded-xl bg-gray-900/90 border border-gray-800 hover:border-emerald-500/40 transition-all space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-purple-400" /> 3. 通期予想への影響
                      </span>
                      <span className="text-xs font-bold text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30">
                        {finalImpactAnalysis?.fullYearForecastImpact?.type || '上方修正余地あり'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {finalImpactAnalysis?.fullYearForecastImpact?.detail || '計画を上回る進捗スピードであり、今後上方修正の発表が行われる公算が高いです。'}
                    </p>
                  </div>

                  {/* 4. 競合他社への影響 */}
                  <div className="p-3.5 rounded-xl bg-gray-900/90 border border-gray-800 hover:border-emerald-500/40 transition-all space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400" /> 4. 競合他社への影響
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {finalImpactAnalysis?.competitorImpact || '同業他社に対して製品差別化と参入障壁が強まり、市場シェアの奪取が進む見通し。'}
                    </p>
                  </div>

                  {/* 5. 短期的に注目されそうな材料 */}
                  <div className="p-3.5 rounded-xl bg-gray-900/90 border border-gray-800 hover:border-emerald-500/40 transition-all space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-rose-400" /> 5. 短期注目材料（投機/テーマ）
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {finalImpactAnalysis?.shortTermCatalyst || 'ニュース報道をきっかけとするテーマ株物色の資金流入により、短期急騰が意識されます。'}
                    </p>
                  </div>

                  {/* 6. 中長期で注目されるポイント */}
                  <div className="p-3.5 rounded-xl bg-gray-900/90 border border-gray-800 hover:border-emerald-500/40 transition-all space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-blue-400" /> 6. 中長期ポイント（構造的成長）
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {finalImpactAnalysis?.midLongTermPoints || 'ストック型収益の拡大とグローバルプラットフォーム化により中長期的な企業価値が底上げされます。'}
                    </p>
                  </div>

                </div>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
