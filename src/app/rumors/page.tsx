'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Flame, AlertTriangle, ShieldCheck, HelpCircle, CheckCircle2, 
  TrendingUp, TrendingDown, Search, Filter, Sparkles, ExternalLink, 
  Share2, ArrowRight, ShieldAlert, Cpu, Eye, BookOpen, Send, RefreshCw, Bookmark
} from 'lucide-react';
import { INITIAL_RUMORS, getRumorVerdictBadge, getCategoryLabel } from '@/lib/rumorData';
import { RumorItem, RumorCategory, RumorVerdict, RumorAnalyzeResponse } from '@/types/rumor';
import { BuyModal } from '@/components/BuyModal';
import { addToWatchlist } from '@/lib/storage';
import { getStoredApiKey } from '@/lib/apiKeyStorage';

export default function RumorsPage() {
  const [rumors, setRumors] = useState<RumorItem[]>(INITIAL_RUMORS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVerdict, setSelectedVerdict] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'buzz' | 'fakeRisk' | 'credibility'>('buzz');
  const [expandedRumorId, setExpandedRumorId] = useState<string | null>('rumor-1');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 噂データの自動フェッチ＆ローカルストレージ保存分のマージ
  const fetchLiveRumors = async (force: boolean = false) => {
    try {
      const userKey = getStoredApiKey() || '';
      const url = force ? '/api/rumors?force=true' : '/api/rumors';
      const res = await fetch(url, {
        headers: userKey ? { 'x-gemini-key': userKey } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.rumors && data.rumors.length > 0) {
          // ユーザーが以前検証したローカル保存の噂があれば先頭にマージ
          let localCustomRumors: RumorItem[] = [];
          try {
            const raw = localStorage.getItem('kabu_watch_custom_rumors');
            if (raw) localCustomRumors = JSON.parse(raw);
          } catch (e) {}

          const merged = [...localCustomRumors, ...data.rumors];
          // 重複IDの排除
          const uniqueMap = new Map<string, RumorItem>();
          merged.forEach((item) => {
            if (!uniqueMap.has(item.id)) {
              uniqueMap.set(item.id, item);
            }
          });
          setRumors(Array.from(uniqueMap.values()));
        }
        if (data.updatedTime) {
          setLastUpdated(data.updatedTime);
        }
      }
    } catch (err) {
      console.error('Fetch live rumors error:', err);
    }
  };

  React.useEffect(() => {
    fetchLiveRumors();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLiveRumors(true);
    setIsRefreshing(false);
    showToast('🔄 最新の噂とSNSトピックを再スキャンしました！');
  };

  // 自由入力フォーム状態
  const [customTicker, setCustomTicker] = useState('');
  const [customStockName, setCustomStockName] = useState('');
  const [customRumorContent, setCustomRumorContent] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customAnalysisResult, setCustomAnalysisResult] = useState<RumorAnalyzeResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // BuyModal状態
  const [buyModalState, setBuyModalState] = useState<{
    isOpen: boolean;
    ticker: string;
    stockName: string;
    price: number;
    title: string;
    type: 'simulation' | 'real';
  }>({
    isOpen: false,
    ticker: '7203',
    stockName: '',
    price: 2500,
    title: '',
    type: 'simulation'
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 噂のフィルタリングとソート
  const filteredRumors = rumors.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedVerdict !== 'all' && item.aiVerdict.verdict !== selectedVerdict) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'buzz') {
      const order = { '🔥 過熱・大バズ': 3, '⚡ 急上昇': 2, '👀 観測・ささやき': 1 };
      return order[b.buzzLevel] - order[a.buzzLevel];
    }
    if (sortBy === 'fakeRisk') {
      return b.aiVerdict.fakeRiskScore - a.aiVerdict.fakeRiskScore;
    }
    if (sortBy === 'credibility') {
      return b.aiVerdict.credibilityScore - a.aiVerdict.credibilityScore;
    }
    return 0;
  });

  // 自由入力噂のAI判定実行
  const handleAnalyzeCustomRumor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRumorContent.trim()) {
      setAnalysisError('噂の内容を入力してください。');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setCustomAnalysisResult(null);

    try {
      const userApiKey = getStoredApiKey() || '';
      const res = await fetch('/api/gemini/analyze-rumor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: customTicker.trim(),
          stockName: customStockName.trim(),
          rumorContent: customRumorContent.trim(),
          sourceUrlOrName: customSource.trim(),
          apiKey: userApiKey
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '分析に失敗しました。');
      }

      const analysis = data.analysis;
      setCustomAnalysisResult(analysis);

      // 新規噂アイテムとして一覧の先頭に追加＆永続化
      const now = new Date();
      const todayStr = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`;
      const newRumorItem: RumorItem = {
        id: `custom-${Date.now()}`,
        ticker: analysis.ticker || customTicker || '----',
        stockName: analysis.stockName || customStockName || 'ユーザー検証銘柄',
        market: '東証',
        sector: '検証対象',
        price: 1500,
        change: 0,
        changePercent: 0,
        title: customRumorContent.slice(0, 50) + (customRumorContent.length > 50 ? '...' : ''),
        category: analysis.category || 'sns_hype',
        buzzLevel: '🔥 過熱・大バズ',
        sourceMedia: customSource || 'ユーザー提供・SNS',
        detectedDate: todayStr,
        rumorSummary: customRumorContent,
        whyBuzzing: {
          origin: customSource || 'SNS・ネット掲示板',
          spreadPath: '投資コミュニティでの話題化',
          marketReaction: 'AI緊急ファクトチェック実施'
        },
        aiVerdict: {
          verdict: analysis.verdict,
          credibilityScore: analysis.credibilityScore,
          fakeRiskScore: analysis.fakeRiskScore,
          headline: analysis.headline,
          factCheckPoints: {
            officialStatus: analysis.officialStatusCheck,
            sourceReliability: analysis.sourceReliabilityAnalysis,
            technicalFeasibility: analysis.feasibilityAnalysis
          },
          aiWarning: analysis.aiInvestmentWarning,
          recommendedAction: 'avoid_fomo'
        }
      };

      setRumors((prev) => {
        const next = [newRumorItem, ...prev];
        try {
          const raw = localStorage.getItem('kabu_watch_custom_rumors');
          const current: RumorItem[] = raw ? JSON.parse(raw) : [];
          localStorage.setItem('kabu_watch_custom_rumors', JSON.stringify([newRumorItem, ...current].slice(0, 20)));
        } catch (e) {}
        return next;
      });

      showToast('🤖 AIによる真偽判定が完了し、噂リストに追加しました！');
    } catch (err: any) {
      setAnalysisError(err.message || '分析中にエラーが発生しました。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOpenBuy = (item: RumorItem, type: 'simulation' | 'real') => {
    setBuyModalState({
      isOpen: true,
      ticker: item.ticker,
      stockName: item.stockName,
      price: item.price,
      title: `${item.title} (${item.aiVerdict.headline})`,
      type
    });
  };

  const handleAddToWatch = (ticker: string, name: string) => {
    addToWatchlist(ticker);
    showToast(`⭐ 「${name} (${ticker})」をお気に入りに追加しました`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* トースト通知 */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl font-bold flex items-center gap-2 animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ヒーローヘッダー */}
      <div className="relative border-b border-slate-800 bg-gradient-to-b from-rose-950/30 via-slate-900 to-slate-950 px-4 py-10 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold mb-3">
                <Flame className="w-4 h-4 animate-pulse text-rose-500" />
                SNS・市場思惑 ＆ AIファクトチェック
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                🔥 噂の株 ＆ AI真偽判定センター
              </h1>
              <p className="mt-2 text-slate-400 text-sm sm:text-base max-w-3xl leading-relaxed">
                X（旧Twitter）やネット掲示板、サプライチェーンで囁かれる「新製品リーク」「大手提携」「急騰煽り」を徹底集約。
                なぜ噂になっているのかの背景と、<strong className="text-white">「ガセなのか？裏付けはあるのか？」をAIがファクトチェック判定</strong>します。
              </p>
            </div>

            <div className="flex sm:flex-col items-start sm:items-end gap-2 shrink-0">
              {lastUpdated && (
                <span className="text-[11px] font-medium text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                  最終スキャン: <strong className="text-rose-400 font-mono">{lastUpdated}</strong>
                </span>
              )}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-900/30 transition-all ${
                  isRefreshing ? 'animate-pulse opacity-80' : ''
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? '市場スキャン中...' : '最新の噂をスキャン'}
              </button>
            </div>
          </div>

          {/* クイック統計バッジ */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <span className="text-xs text-slate-400">検知中の噂銘柄</span>
              <p className="text-xl font-bold text-white mt-0.5">{rumors.length} <span className="text-xs text-slate-500">銘柄</span></p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <span className="text-xs text-rose-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> 🚨 ガセ・煽り警戒
              </span>
              <p className="text-xl font-bold text-rose-400 mt-0.5">
                {rumors.filter(r => r.aiVerdict.verdict === 'fake_warning').length} <span className="text-xs text-slate-500">件</span>
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> 🔍 要検証・思惑
              </span>
              <p className="text-xl font-bold text-amber-400 mt-0.5">
                {rumors.filter(r => r.aiVerdict.verdict === 'caution_speculative').length} <span className="text-xs text-slate-500">件</span>
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> ✅ 信憑性高・確証
              </span>
              <p className="text-xl font-bold text-emerald-400 mt-0.5">
                {rumors.filter(r => r.aiVerdict.verdict === 'highly_credible').length} <span className="text-xs text-slate-500">件</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-8 space-y-10">

        {/* 🤖 インタラクティブ：気になる噂をAIでガセ判定！（自由入力ツール） */}
        <section className="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  気になる噂をリアルタイムAIガセ判定！
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Geminiファクトチェック
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  XやYouTubeで見かけた「〇〇が新製品発売？」「〇〇とAppleが提携？」などの噂を入力すると、AIが真偽を分析します。
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAnalyzeCustomRumor} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  銘柄コード（任意）
                </label>
                <input 
                  type="text" 
                  value={customTicker} 
                  onChange={e => setCustomTicker(e.target.value)} 
                  placeholder="例: 7203 や 6758"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  企業名（任意）
                </label>
                <input 
                  type="text" 
                  value={customStockName} 
                  onChange={e => setCustomStockName(e.target.value)} 
                  placeholder="例: トヨタ や ソニー"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  噂の出処（任意）
                </label>
                <input 
                  type="text" 
                  value={customSource} 
                  onChange={e => setCustomSource(e.target.value)} 
                  placeholder="例: Xのインフルエンサー、掲示板"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                噂の内容・囁かれている話 <span className="text-rose-400">*</span>
              </label>
              <textarea 
                rows={2}
                value={customRumorContent} 
                onChange={e => setCustomRumorContent(e.target.value)} 
                placeholder="例: 「新型VRゴーグルを今秋発表する噂がある」「大手EVメーカーに全固体電池の独占供給が決まったらしい」"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            {analysisError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{analysisError}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    AIがファクトチェック分析中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    AIでガセ判定・ファクトチェックを実行
                  </>
                )}
              </button>
            </div>
          </form>

          {/* 自由入力のAI分析結果表示 */}
          {customAnalysisResult && (
            <div className="mt-6 border-t border-indigo-500/30 pt-6 animate-fadeIn">
              <div className="bg-slate-900/90 border border-indigo-500/40 rounded-xl p-5 shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">
                      {customAnalysisResult.stockName} ({customAnalysisResult.ticker || '未特定'})
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full border bg-slate-800 text-slate-300">
                      {getCategoryLabel(customAnalysisResult.category).label}
                    </span>
                  </div>
                  <div className={`px-3 py-1 rounded-full border text-xs font-bold ${getRumorVerdictBadge(customAnalysisResult.verdict).bg}`}>
                    {getRumorVerdictBadge(customAnalysisResult.verdict).label}
                  </div>
                </div>

                {/* ゲージ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">信憑性スコア</span>
                      <span className="font-bold text-emerald-400">{customAnalysisResult.credibilityScore}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${customAnalysisResult.credibilityScore}%` }} />
                    </div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">ガセ・煽り危険度</span>
                      <span className="font-bold text-rose-400">{customAnalysisResult.fakeRiskScore}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full transition-all" style={{ width: `${customAnalysisResult.fakeRiskScore}%` }} />
                    </div>
                  </div>
                </div>

                {/* AIのズバリ総括 */}
                <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-lg text-indigo-200 text-sm font-semibold mb-4">
                  💡 {customAnalysisResult.headline}
                </div>

                {/* 詳細ファクトチェック */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300 mb-4">
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    <div className="font-bold text-slate-400 mb-1">🏢 公式IR・開示状況</div>
                    <p>{customAnalysisResult.officialStatusCheck}</p>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    <div className="font-bold text-slate-400 mb-1">🔍 情報源の信頼度</div>
                    <p>{customAnalysisResult.sourceReliabilityAnalysis}</p>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    <div className="font-bold text-slate-400 mb-1">⚙️ 技術・実現可能性</div>
                    <p>{customAnalysisResult.feasibilityAnalysis}</p>
                  </div>
                </div>

                {/* 投資家への警告 */}
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 mb-3 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-400">AIアナリスト警告: </span>
                    {customAnalysisResult.aiInvestmentWarning}
                  </div>
                </div>

                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>🎯 推奨スタンス: <strong className="text-white">{customAnalysisResult.recommendedAction}</strong></span>
                  {customAnalysisResult.ticker && customAnalysisResult.ticker !== '----' && (
                    <Link
                      href={`/stocks/${customAnalysisResult.ticker}`}
                      className="text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1"
                    >
                      この銘柄の適時開示・チャートを見る <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* フィルター＆ソートコントロール */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500" />
                市場でいま話題の噂銘柄一覧
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                AIが自動追跡しているSNS・ニュース思惑株リスト
              </p>
            </div>

            {/* ソートタブ */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
              <button
                onClick={() => setSortBy('buzz')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  sortBy === 'buzz' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                🔥 バズ度順
              </button>
              <button
                onClick={() => setSortBy('fakeRisk')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  sortBy === 'fakeRisk' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                🚨 ガセ危険度順
              </button>
              <button
                onClick={() => setSortBy('credibility')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  sortBy === 'credibility' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                ✅ 信憑性順
              </button>
            </div>
          </div>

          {/* カテゴリ＆判定フィルター */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-slate-500 font-semibold mr-1">カテゴリ:</span>
            {[
              { id: 'all', label: 'すべて' },
              { id: 'new_product', label: '📱 新製品・技術' },
              { id: 'partnership', label: '🤝 提携' },
              { id: 'ma_takeover', label: '🏢 M&A・買収' },
              { id: 'earnings_leak', label: '📊 業績観測' },
              { id: 'sns_hype', label: '📢 SNS急騰煽り' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-slate-200 text-slate-950 font-bold border-slate-200'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}

            <span className="text-xs text-slate-500 font-semibold ml-3 mr-1">AI判定:</span>
            {[
              { id: 'all', label: '全判定' },
              { id: 'fake_warning', label: '🚨 ガセ警戒' },
              { id: 'caution_speculative', label: '🔍 要検証' },
              { id: 'highly_credible', label: '✅ 信憑性高' },
              { id: 'officially_denied', label: '📢 公式否定済' }
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVerdict(v.id)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${
                  selectedVerdict === v.id
                    ? 'bg-rose-500/20 text-rose-300 font-bold border-rose-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </section>

        {/* 噂カード一覧 */}
        <section className="space-y-5">
          {filteredRumors.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <p>条件に一致する噂銘柄が見つかりませんでした。</p>
            </div>
          ) : (
            filteredRumors.map((item) => {
              const verdictBadge = getRumorVerdictBadge(item.aiVerdict.verdict);
              const categoryBadge = getCategoryLabel(item.category);
              const isExpanded = expandedRumorId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 sm:p-6 transition-all shadow-lg"
                >
                  {/* ヘッダー情報（銘柄＋バッジ） */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/stocks/${item.ticker}`}
                            className="text-lg sm:text-xl font-bold text-white hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                          >
                            {item.stockName}
                            <span className="text-sm font-semibold text-slate-400 font-mono">({item.ticker})</span>
                          </Link>
                          <span className="text-xs text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                            {item.market} / {item.sector}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2">
                        <div className="text-sm sm:text-base font-bold text-white font-mono">
                          ¥{item.price.toLocaleString()}
                        </div>
                        <div className={`text-xs font-bold flex items-center justify-end gap-0.5 ${
                          item.change >= 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {item.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {item.change >= 0 ? `+${item.change}` : item.change} ({item.changePercent >= 0 ? `+${item.changePercent}%` : `${item.changePercent}%`})
                        </div>
                      </div>

                      {/* ガセ判定ステータスバッジ */}
                      <span className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 ${verdictBadge.bg}`}>
                        {verdictBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* 噂のタイトル＆タグ */}
                  <div className="mt-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${categoryBadge.color}`}>
                        {categoryBadge.label}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                        {item.buzzLevel}
                      </span>
                      <span className="text-xs text-slate-500">
                        情報源: {item.sourceMedia}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                      {item.rumorSummary}
                    </p>
                  </div>

                  {/* AI信憑性 vs ガセ危険度メーター */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          信憑性スコア
                        </span>
                        <span className="font-bold text-emerald-400">{item.aiVerdict.credibilityScore}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${item.aiVerdict.credibilityScore}%` }} 
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          ガセ・煽り危険度
                        </span>
                        <span className="font-bold text-rose-400">{item.aiVerdict.fakeRiskScore}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${item.aiVerdict.fakeRiskScore}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* AIのズバリ総括 */}
                  <div className="mt-3 p-3 bg-indigo-950/20 border border-indigo-500/30 rounded-xl text-xs sm:text-sm text-indigo-200">
                    <span className="font-bold text-indigo-300">💡 AIアナリスト総括: </span>
                    {item.aiVerdict.headline}
                  </div>

                  {/* 詳細アコーディオン */}
                  {isExpanded && (
                    <div className="mt-5 space-y-4 border-t border-slate-800/80 pt-4 animate-fadeIn">
                      {/* なぜ噂になっているか */}
                      <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/80">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-cyan-400" /> なんで噂になっているか（背景・発端）
                        </h4>
                        <div className="space-y-2 text-xs text-slate-300">
                          <div>
                            <span className="text-slate-500 font-semibold">【発端】: </span>
                            {item.whyBuzzing.origin}
                          </div>
                          <div>
                            <span className="text-slate-500 font-semibold">【拡散経路】: </span>
                            {item.whyBuzzing.spreadPath}
                          </div>
                          <div>
                            <span className="text-slate-500 font-semibold">【市場の反応】: </span>
                            {item.whyBuzzing.marketReaction}
                          </div>
                        </div>
                      </div>

                      {/* AIファクトチェック根拠 */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-slate-950/50 rounded-xl p-3.5 border border-slate-800/80 text-xs">
                          <span className="font-bold text-slate-400 block mb-1">🏢 公式IR・開示状況</span>
                          <p className="text-slate-300 leading-relaxed">{item.aiVerdict.factCheckPoints.officialStatus}</p>
                        </div>
                        <div className="bg-slate-950/50 rounded-xl p-3.5 border border-slate-800/80 text-xs">
                          <span className="font-bold text-slate-400 block mb-1">🔍 情報源の信頼度</span>
                          <p className="text-slate-300 leading-relaxed">{item.aiVerdict.factCheckPoints.sourceReliability}</p>
                        </div>
                        <div className="bg-slate-950/50 rounded-xl p-3.5 border border-slate-800/80 text-xs">
                          <span className="font-bold text-slate-400 block mb-1">⚙️ 技術・実現可能性</span>
                          <p className="text-slate-300 leading-relaxed">{item.aiVerdict.factCheckPoints.technicalFeasibility}</p>
                        </div>
                      </div>

                      {/* 投資家への警告 */}
                      <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                        <div>
                          <span className="font-bold text-rose-400">⚠️ 投資家へのリスク警告: </span>
                          {item.aiVerdict.aiWarning}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* フッターアクションバー */}
                  <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/60">
                    <button
                      onClick={() => setExpandedRumorId(isExpanded ? null : item.id)}
                      className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {isExpanded ? '▲ 詳細背景を閉じる' : '▼ なぜ噂になっているか・ファクトチェック根拠を見る'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAddToWatch(item.ticker, item.stockName)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Bookmark className="w-3.5 h-3.5" /> ウォッチ追加
                      </button>

                      <button
                        onClick={() => handleOpenBuy(item, 'simulation')}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        🎮 仮想売買で試す
                      </button>

                      <Link
                        href={`/stocks/${item.ticker}`}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        開示・チャート <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>

      {/* 仮想売買・登録モーダル */}
      <BuyModal
        isOpen={buyModalState.isOpen}
        onClose={() => setBuyModalState(prev => ({ ...prev, isOpen: false }))}
        ticker={buyModalState.ticker}
        stockName={buyModalState.stockName}
        currentPrice={buyModalState.price}
        newsTitle={buyModalState.title}
        initialType={buyModalState.type}
      />
    </div>
  );
}
