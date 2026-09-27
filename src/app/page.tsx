'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { SemanticSearchModal } from '@/components/SemanticSearchModal';
import { PdfViewerModal } from '@/components/PdfViewerModal';
import { GeminiChatModal } from '@/components/GeminiChatModal';
import { ImpactAnalyzerModal } from '@/components/ImpactAnalyzerModal';
import { PartnerCompanyCard } from '@/components/PartnerCompanyCard';
import { Timeline } from '@/components/Timeline';
import { BuyModal } from '@/components/BuyModal';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { getStoredApiKey } from '@/lib/apiKeyStorage';
import { getFavorites, getAllFavoriteMetas, saveFavoriteMeta, FavoriteStockMeta } from '@/lib/storage';
import { STOCK_MASTER } from '@/lib/dataFetcher';
import { lookupStockByTicker } from '@/lib/stockLookup';
import { TimelineItem } from '@/types/stock';
import { 
  Sparkles, TrendingUp, BellRing, Star, ArrowRight, ShieldCheck, Zap, 
  RefreshCw, Briefcase, Trophy, Calendar, Users, Flame, Bot, ExternalLink, 
  KeyRound, MessageSquareText, ChevronUp 
} from 'lucide-react';

// 初回即時表示用プリセットタイムライン（0秒表示でロード待ちを完全解消）
const INITIAL_TIMELINE: TimelineItem[] = [
  {
    id: 'preset-1',
    ticker: '7203',
    stockName: 'トヨタ自動車',
    title: '業務提携に関するお知らせ（次世代AIテクノロジーを活用した新製品共同開発）',
    type: 'disclosure',
    sourceOrPdf: '適時開示 (TDnet)',
    publishedAt: '2026-09-26 15:30',
    url: 'https://www.release.tdnet.info/inbs/TDNET_7203_sample1.pdf',
    snippet: '米大手テック企業との間で次世代AI半導体システムに関する包括的業務提携を締結。初年度50億円の売上寄与を見込む。',
    category: 'partnership',
    impactMatrix: {
      importanceScore: 5,
      earningsImpact: 'あり',
      financialImpact: 'あり',
      businessImpact: '大',
      marketImpact: '短期急騰の可能性'
    },
    isNew: true,
    rawDisclosureItem: {
      id: 'disc-7203-1',
      ticker: '7203',
      stockName: 'トヨタ自動車',
      title: '業務提携に関するお知らせ（次世代AIテクノロジーを活用した新製品共同開発）',
      publishedAt: '2026-09-26 15:30',
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      originalUrl: 'https://www.release.tdnet.info/inbs/TDNET_7203_sample1.pdf',
      category: 'partnership',
      aiSummary: '【AI要約】\n1. 米大手テック企業との間で次世代AI半導体システムに関する包括的業務提携を締結。\n2. 今後3年間で共同開発製品の国内独占販売権を取得し、初年度50億円の売上を見込む。\n3. 当期の通期連結業績予想への影響は、精査のうえ確定しだい公表予定。'
    }
  },
  {
    id: 'preset-2',
    ticker: '6920',
    stockName: 'レーザーテック',
    title: 'EUV光用フォトマスク欠陥検査装置の大型受注に関するお知らせ',
    type: 'news',
    sourceOrPdf: 'Googleニュース',
    publishedAt: '2026-09-26 11:15',
    url: 'https://news.google.com/search?q=レーザーテック',
    snippet: '最先端2nmプロセス向け検査装置において、海外主要ファウンドリより複数台の大型受注を獲得。来期売上への強い押し上げ要因。',
    category: 'product',
    impactMatrix: {
      importanceScore: 5,
      earningsImpact: 'あり',
      financialImpact: 'あり',
      businessImpact: '大',
      marketImpact: '短期急騰の可能性'
    },
    isNew: true
  },
  {
    id: 'preset-3',
    ticker: '9984',
    stockName: 'ソフトバンクグループ',
    title: '自己株式取得及び自己株式消却の実施状況に関するお知らせ',
    type: 'disclosure',
    sourceOrPdf: '適時開示 (TDnet)',
    publishedAt: '2026-09-26 09:30',
    url: 'https://www.release.tdnet.info/inbs/TDNET_9984_sample2.pdf',
    snippet: '発行済株式総数の1.8%にあたる自社株買い枠を順調に消化。株主還元および1株あたり価値向上が着実に進捗。',
    category: 'buyback',
    impactMatrix: {
      importanceScore: 4,
      earningsImpact: '軽微',
      financialImpact: 'あり',
      businessImpact: '中',
      marketImpact: '要確認'
    },
    isNew: false
  },
  {
    id: 'preset-4',
    ticker: '6758',
    stockName: 'ソニーグループ',
    title: '次世代モバイル向け積層型イメージセンサー量産出荷開始',
    type: 'news',
    sourceOrPdf: 'Googleニュース',
    publishedAt: '2026-09-25 17:00',
    url: 'https://news.google.com/search?q=ソニーグループ',
    snippet: '暗所撮影性能とAI処理速度を飛躍的に向上させた新世代CMOSイメージセンサーのグローバル供給を開始。',
    category: 'product',
    impactMatrix: {
      importanceScore: 4,
      earningsImpact: 'あり',
      financialImpact: 'なし',
      businessImpact: '中',
      marketImpact: '要確認'
    },
    isNew: false
  }
];

export default function HomePage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(['7203', '6920', '9984', '6758']);
  const [watchlistStocks, setWatchlistStocks] = useState<FavoriteStockMeta[]>([]);
  // 初期データであらかじめレンダリング（白画面や無限ローディングを完全防止）
  const [timeline, setTimeline] = useState<TimelineItem[]>(INITIAL_TIMELINE);
  const [isUpdating, setIsUpdating] = useState(false);

  // Modals state
  const [pdfItem, setPdfItem] = useState<any>(null);
  const [chatState, setChatState] = useState<{ title: string; content?: string } | null>(null);
  const [impactState, setImpactState] = useState<{ title: string; item: any } | null>(null);
  const [partnerState, setPartnerState] = useState<any>(null);
  const [buyState, setBuyState] = useState<{ ticker: string; stockName?: string; currentPrice?: number; newsTitle?: string; initialType?: 'simulation' | 'real' } | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [hasUserApiKey, setHasUserApiKey] = useState(false);
  const [isGeminiMenuOpen, setIsGeminiMenuOpen] = useState(false);

  useEffect(() => {
    const favs = getFavorites();
    setFavorites(favs);
    loadWatchlistStocks(favs);
    fetchHomeTimeline();

    // 端末のGemini APIキー存在チェック
    const checkKey = () => {
      setHasUserApiKey(!!getStoredApiKey());
    };
    checkKey();
    window.addEventListener('kabu_watch_api_key_changed', checkKey);
    return () => {
      window.removeEventListener('kabu_watch_api_key_changed', checkKey);
    };
  }, []);

  const loadWatchlistStocks = async (favTickers: string[]) => {
    const metas = getAllFavoriteMetas();
    
    // 1. まず即座に表示（ローカルキャッシュ＆STOCK_MASTERから）
    const initialList: FavoriteStockMeta[] = favTickers.map((t) => {
      if (STOCK_MASTER[t]) {
        const s = STOCK_MASTER[t];
        return {
          ticker: s.ticker,
          name: s.name,
          sector: s.sector,
          price: s.price,
          changePercent: s.changePercent,
        };
      }
      if (metas[t] && metas[t].name) {
        return metas[t];
      }
      return {
        ticker: t,
        name: `銘柄 (${t})`,
        sector: '東証上場銘柄',
        price: 1000,
        changePercent: 0
      };
    });
    setWatchlistStocks(initialList);

    // 2. 非同期でリアルタイム社名＆株価を取得して更新
    try {
      const resolvedList = await Promise.all(
        favTickers.map(async (t) => {
          if (STOCK_MASTER[t]) {
            const s = STOCK_MASTER[t];
            return {
              ticker: s.ticker,
              name: s.name,
              sector: s.sector,
              price: s.price,
              changePercent: s.changePercent,
            };
          }
          const looked = await lookupStockByTicker(t);
          if (looked && looked.name && !looked.name.startsWith('東証銘柄 (')) {
            saveFavoriteMeta(t, {
              ticker: t,
              name: looked.name,
              sector: looked.sector,
              price: looked.price,
              changePercent: looked.changePercent,
            });
            return {
              ticker: t,
              name: looked.name,
              sector: looked.sector || '東証上場銘柄',
              price: looked.price || 1000,
              changePercent: looked.changePercent || 0,
            };
          }
          return metas[t] || {
            ticker: t,
            name: `銘柄 (${t})`,
            sector: '東証上場銘柄',
            price: 1000,
            changePercent: 0,
          };
        })
      );
      setWatchlistStocks(resolvedList);
    } catch (err) {
      console.warn('Watchlist stock lookup warning:', err);
    }
  };

  const fetchHomeTimeline = async () => {
    setIsUpdating(true);
    try {
      // タイムアウト付きで並行フェッチ
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const [res7203, res6920] = await Promise.allSettled([
        fetch('/api/stocks/7203', { signal: controller.signal }).then((r) => r.json()),
        fetch('/api/stocks/6920', { signal: controller.signal }).then((r) => r.json()),
      ]);

      clearTimeout(timeoutId);

      const items7203 = res7203.status === 'fulfilled' ? res7203.value.timeline || [] : [];
      const items6920 = res6920.status === 'fulfilled' ? res6920.value.timeline || [] : [];

      if (items7203.length > 0 || items6920.length > 0) {
        const merged = [...items7203, ...items6920];
        merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        setTimeline(merged);
      }
    } catch (err) {
      console.warn('Timeline live fetch error (keeping preset):', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] pb-24">
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        favoritesCount={favorites.length}
        hasNewAlerts={true}
      />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        
        {/* Hero Section */}
        <section className="relative p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/40 to-[#0B0F19] border border-cyan-500/30 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Gemini 1.5 Flash 搭載 PWAアプリ
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              銘柄情報を、<span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">AIで一元解読。</span>
            </h1>

            <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-sans">
              適時開示PDF・Googleニュース・決算発表・信用残をリアルタイム集約。Geminiが投資判断直結の株価影響6項目・提携先深掘り・自然言語逆引き検索を完全無料サポート。
            </p>

            {/* Semantic Search & Portfolio Trigger Buttons */}
            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-extrabold text-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-98 cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                銘柄検索（証券コード・社名・AI意味検索）
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <Link
                href="/portfolio"
                className="px-5 py-3.5 rounded-2xl bg-gray-900 hover:bg-gray-800 text-cyan-300 font-bold text-sm border border-cyan-500/40 flex items-center gap-2 transition-all shadow"
              >
                <Briefcase className="w-4 h-4 text-cyan-400" />
                資産ポートフォリオ・仮想売買へ
              </Link>
            </div>

            {/* 🤖 端末のGemini連携バー (スマホでも溢れない2段/グリッド対応) */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>端末のGemini連携:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* 端末のGoogle Gemini（Web/アプリ）を直接開くボタン */}
                <a
                  href="https://gemini.google.com/app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-95 transition-all text-center"
                  title="端末のGoogle Geminiアプリ/Webサイトを直接開く"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-pulse shrink-0" />
                  <span>端末のGeminiを開く</span>
                  <ExternalLink className="w-3 h-3 text-cyan-200 shrink-0" />
                </a>

                {/* Geminiに直接株式相談するボタン（アプリ内AIチャット） */}
                <button
                  onClick={() => setChatState({ 
                    title: '相場・注目銘柄 AI相談', 
                    content: '今日の日経平均動向、個別株の材料、決算の見方など、気になることを自由にGeminiに質問できます。' 
                  })}
                  className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-indigo-300 hover:text-white font-bold text-xs border border-indigo-500/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm text-center"
                >
                  <MessageSquareText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Geminiに株相談</span>
                </button>

                {/* 端末のAPI無料キー設定（BYOK） */}
                <button
                  onClick={() => setIsApiKeyModalOpen(true)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                    hasUserApiKey
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
                      : 'bg-purple-950/40 border-purple-500/40 text-purple-300 hover:bg-purple-900/40'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{hasUserApiKey ? '端末キー: 有効' : '無料キー設定'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 🏆 市場急変動 ＆ 👥 コミュニティ ＆ 🔥 噂の株 ＆ 📅 週末厳選 */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/rankings"
            className="group p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/20 via-gray-900 to-[#111827] border border-amber-500/30 hover:border-amber-500/70 transition-all shadow-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:scale-110 transition-transform">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    急変動
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1 group-hover:text-amber-300 transition-colors">
                  市場急変動ランキング
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                  値上がり・S高をGemini要約
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-amber-300 group-hover:translate-x-1 transition-all shrink-0 ml-1" />
          </Link>

          <Link
            href="/community"
            className="group p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-gray-900 to-[#111827] border border-cyan-500/30 hover:border-cyan-500/70 transition-all shadow-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    投資仲間
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1 group-hover:text-cyan-300 transition-colors">
                  コミュニティ＆仮想順位
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                  注目株や仮想成績・理由をチェック
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all shrink-0 ml-1" />
          </Link>

          <Link
            href="/rumors"
            className="group p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/30 via-gray-900 to-[#111827] border border-rose-500/30 hover:border-rose-500/70 transition-all shadow-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 group-hover:scale-110 transition-transform">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    SNS思惑
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1 group-hover:text-rose-300 transition-colors">
                  🔥 噂の株＆AI真偽判定
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                  新製品・提携・急騰煽りのガセを見抜く
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-rose-300 group-hover:translate-x-1 transition-all shrink-0 ml-1" />
          </Link>

          <Link
            href="/weekend-picks"
            className="group p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/20 via-gray-900 to-[#111827] border border-purple-500/30 hover:border-purple-500/70 transition-all shadow-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    土曜配信
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1 group-hover:text-purple-300 transition-colors">
                  週末AI厳選おすすめ銘柄
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                  大引けデータから来週の注目株抽出
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-purple-300 group-hover:translate-x-1 transition-all shrink-0 ml-1" />
          </Link>
        </section>

        {/* Favorite Watchlist Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              ウォッチリスト (専用AI情報センター)
            </h2>
            <Link
              href="/whats-new"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <BellRing className="w-3.5 h-3.5" /> 昨日からの変化を見る
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {watchlistStocks.map((stock) => {
              const isUp = (stock.changePercent ?? 0) >= 0;

              return (
                <Link
                  key={stock.ticker}
                  href={`/stocks/${stock.ticker}`}
                  className="group p-5 rounded-2xl bg-[#111827] border border-gray-800 hover:border-cyan-500/50 hover:bg-gray-800/60 transition-all shadow-lg flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {stock.ticker}
                      </span>
                      <h3 className="font-bold text-white text-base mt-1 group-hover:text-cyan-300 transition-colors">
                        {stock.name}
                      </h3>
                      <span className="text-[10px] text-gray-400">{stock.sector || '東証上場銘柄'}</span>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-lg font-extrabold text-white">
                        ¥{(stock.price ?? 1000).toLocaleString()}
                      </div>
                      <div className={`text-xs font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isUp ? '+' : ''}{(stock.changePercent ?? 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                    <span>専用AIダッシュボード</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Featured Timeline Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">
                時系列統合タイムライン (最新順)
              </h2>
              {isUpdating && (
                <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" /> 最新データ同期中
                </span>
              )}
            </div>
            <button
              onClick={fetchHomeTimeline}
              className="text-xs text-gray-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              title="タイムラインを再読み込み"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              再読込
            </button>
          </div>

          <Timeline
            items={timeline}
            onOpenPdf={(item) => setPdfItem(item)}
            onOpenChat={(title, content) => setChatState({ title, content })}
            onOpenImpact={(title, item) => setImpactState({ title, item })}
            onOpenPartner={(partner) => setPartnerState(partner)}
            onOpenBuy={(ticker, name, price, news) => setBuyState({ ticker, stockName: name, currentPrice: price, newsTitle: news })}
          />
        </section>

      </main>

      {/* Modals */}
      <SemanticSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <PdfViewerModal
        item={pdfItem}
        isOpen={!!pdfItem}
        onClose={() => setPdfItem(null)}
      />

      {chatState && (
        <GeminiChatModal
          contextTitle={chatState.title}
          contextContent={chatState.content}
          isOpen={!!chatState}
          onClose={() => setChatState(null)}
        />
      )}

      {impactState && (
        <ImpactAnalyzerModal
          title={impactState.title}
          stockName={impactState.item?.stockName}
          ticker={impactState.item?.ticker}
          url={impactState.item?.url}
          body={impactState.item?.snippet || impactState.item?.body}
          type={impactState.item?.category}
          impactAnalysis={impactState.item?.impactAnalysis}
          impactMatrix={impactState.item?.impactMatrix}
          isOpen={!!impactState}
          onClose={() => setImpactState(null)}
        />
      )}

      {partnerState && (
        <PartnerCompanyCard
          partner={partnerState}
          isOpen={!!partnerState}
          onClose={() => setPartnerState(null)}
        />
      )}

      {buyState && (
        <BuyModal
          isOpen={!!buyState}
          onClose={() => setBuyState(null)}
          ticker={buyState.ticker}
          stockName={buyState.stockName}
          currentPrice={buyState.currentPrice}
          newsTitle={buyState.newsTitle}
          initialType={buyState.initialType}
        />
      )}

      {/* 🔑 APIキー設定モーダル */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSuccess={() => setHasUserApiKey(true)}
      />

      {/* 🤖 右下常駐：フローティングGeminiボタン（FAB） */}
      <div className="fixed bottom-16 md:bottom-6 right-4 sm:right-6 z-40">
        {/* 開閉メニューポップオーバー */}
        {isGeminiMenuOpen && (
          <div className="mb-3 w-64 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-3 animate-fadeIn space-y-2 backdrop-blur-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> 端末のGeminiメニュー
              </span>
              <button 
                onClick={() => setIsGeminiMenuOpen(false)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            {/* 1. 公式Geminiを直接開く */}
            <a
              href="https://gemini.google.com/app"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsGeminiMenuOpen(false)}
              className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-between shadow transition-all"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>端末のGeminiを開く</span>
              </div>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">外部起動</span>
            </a>

            {/* 2. アプリ内Geminiに株相談 */}
            <button
              onClick={() => {
                setIsGeminiMenuOpen(false);
                setChatState({ 
                  title: '相場・注目銘柄 AI相談', 
                  content: '今日の日経平均動向、個別株の材料、決算の見方など、気になることを自由にGeminiに質問できます。' 
                });
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer text-left"
            >
              <MessageSquareText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Geminiに株の質問をする</span>
            </button>

            {/* 3. 無料キー設定 */}
            <button
              onClick={() => {
                setIsGeminiMenuOpen(false);
                setIsApiKeyModalOpen(true);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer text-left"
            >
              <KeyRound className="w-3.5 h-3.5 text-purple-400" />
              <span>{hasUserApiKey ? '端末キー管理（有効）' : '端末の無料キーを設定'}</span>
            </button>
          </div>
        )}

        {/* メインFABトリガーボタン */}
        <button
          onClick={() => setIsGeminiMenuOpen(!isGeminiMenuOpen)}
          className="group relative p-3 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-xs shadow-2xl shadow-indigo-600/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-indigo-400/40 cursor-pointer"
          title="端末のGeminiを開く / AI相談"
        >
          <Sparkles className="w-5 h-5 text-cyan-200 animate-pulse" />
          <span className="hidden sm:inline font-bold">Gemini</span>
          {isGeminiMenuOpen ? (
            <ChevronUp className="w-4 h-4 text-cyan-200" />
          ) : (
            <Bot className="w-4 h-4 text-cyan-200 hidden sm:inline" />
          )}
        </button>
      </div>
    </div>
  );
}
