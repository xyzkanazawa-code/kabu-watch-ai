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
  KeyRound, MessageSquareText, ChevronUp, Lock, LogIn 
} from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { WatchlistAiNoteModal } from '@/components/WatchlistAiNoteModal';
import { 
  StockAiNote, 
  getAllLocalStockAiNotes, 
  fetchBatchStockAiNotes 
} from '@/lib/stockAiNotesStorage';

// 初回即時表示用プリセットタイムライン（0秒表示でロード待ちを完全解消）
const INITIAL_TIMELINE: TimelineItem[] = [
  {
    id: 'preset-1',
    ticker: '7203',
    stockName: 'トヨタ自動車',
    title: '自己株式の取得状況に関するお知らせ（適時開示）',
    type: 'disclosure',
    sourceOrPdf: '適時開示 (TDnet)',
    publishedAt: '2026-09-26 15:00',
    url: 'https://finance.yahoo.co.jp/quote/7203.T/disclosure',
    snippet: '会社法第165条第2項の規定に基づく自己株式の取得状況について公表。取得枠の着実な消化が進捗。',
    category: 'buyback',
    impactMatrix: {
      importanceScore: 4,
      earningsImpact: 'なし',
      financialImpact: 'あり',
      businessImpact: '中',
      marketImpact: '短期急騰の可能性'
    },
    isNew: true,
    rawDisclosureItem: {
      id: 'disc-7203-1',
      ticker: '7203',
      stockName: 'トヨタ自動車',
      title: '自己株式の取得状況に関するお知らせ（適時開示）',
      publishedAt: '2026-09-26 15:00',
      pdfUrl: 'https://finance.yahoo.co.jp/quote/7203.T/disclosure',
      originalUrl: 'https://finance.yahoo.co.jp/quote/7203.T/disclosure',
      category: 'buyback',
      aiSummary: '【公式発表】\n1. 自己株式取得枠の進捗状況に関する適時開示です。\n2. 株主還元と資本効率の向上を推進中。\n3. 詳細は開示資料をご確認ください。'
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
  const { user, isLoggedIn } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
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

  // 📝 登録済みAI見解マップ & モーダル状態
  const [aiNotesMap, setAiNotesMap] = useState<Record<string, StockAiNote[]>>({});
  const [aiNoteModalTarget, setAiNoteModalTarget] = useState<{
    isOpen: boolean;
    ticker: string;
    stockName: string;
    notes: StockAiNote[];
  }>({
    isOpen: false,
    ticker: '',
    stockName: '',
    notes: [],
  });

  const loadAiNotes = async (favTickers: string[]) => {
    const local = getAllLocalStockAiNotes();
    setAiNotesMap(local);
    if (favTickers && favTickers.length > 0) {
      try {
        const serverMap = await fetchBatchStockAiNotes(favTickers);
        setAiNotesMap((prev) => ({ ...prev, ...serverMap }));
      } catch (e) {
        console.warn('HomePage batch AI notes fetch error:', e);
      }
    }
  };

  useEffect(() => {
    // ログイン状態に応じたお気に入り取得（未ログインは空配列）
    const favs = getFavorites();
    setFavorites(favs);
    if (isLoggedIn) {
      loadWatchlistStocks(favs);
      fetchHomeTimeline(favs);
      loadAiNotes(favs);
    } else {
      setWatchlistStocks([]);
      fetchHomeTimeline(['7203', '6920', '9984', '6758']);
      loadAiNotes(['7203', '6920', '9984', '6758']);
    }

    // AI見解更新のイベント監視
    const handleNotesChanged = () => {
      const currentFavs = getFavorites();
      loadAiNotes(currentFavs);
    };
    window.addEventListener('kabu_watch_ai_notes_changed', handleNotesChanged);
    window.addEventListener('storage', handleNotesChanged);

    // 端末のGemini APIキー存在チェック
    const checkKey = () => {
      setHasUserApiKey(!!getStoredApiKey());
    };
    checkKey();
    window.addEventListener('kabu_watch_api_key_changed', checkKey);
    return () => {
      window.removeEventListener('kabu_watch_api_key_changed', checkKey);
      window.removeEventListener('kabu_watch_ai_notes_changed', handleNotesChanged);
      window.removeEventListener('storage', handleNotesChanged);
    };
  }, [isLoggedIn]);

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

  const fetchHomeTimeline = async (favList?: string[]) => {
    setIsUpdating(true);
    try {
      const activeTickers = (favList && favList.length > 0) 
        ? favList 
        : (favorites.length > 0 ? favorites : getFavorites());
      
      const targetTickers = activeTickers.length > 0 ? activeTickers.slice(0, 8) : ['7203', '6920', '6315', '9984'];

      // タイムアウト付きでお気に入り全銘柄を並行フェッチ
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const fetchPromises = targetTickers.map((t) =>
        fetch(`/api/stocks/${t}`, { signal: controller.signal })
          .then((r) => r.json())
          .catch((err) => {
            console.warn(`Timeline fetch failed for ${t}:`, err);
            return null;
          })
      );

      const settledResults = await Promise.allSettled(fetchPromises);
      clearTimeout(timeoutId);

      const allItems: TimelineItem[] = [];
      for (const res of settledResults) {
        if (res.status === 'fulfilled' && res.value && Array.isArray(res.value.timeline)) {
          allItems.push(...res.value.timeline);
        }
      }

      if (allItems.length > 0) {
        // 重複排除 (ID または URL/タイトル)
        const seen = new Set<string>();
        const uniqueItems = allItems.filter((item) => {
          const key = item.id || `${item.ticker}-${item.title}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // 日付降順ソート
        uniqueItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        setTimeline(uniqueItems);
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
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => {
                    setSearchInitialQuery('');
                    setIsSearchOpen(true);
                  }}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-black font-extrabold text-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 active:scale-98 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>🔍 AI言葉でスクリーニング ＆ 銘柄検索</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </button>

                <Link
                  href="/portfolio"
                  className="px-5 py-3.5 rounded-2xl bg-gray-900/90 hover:bg-gray-800 text-cyan-300 font-bold text-sm border border-cyan-500/40 flex items-center gap-2 transition-all shadow"
                >
                  <Briefcase className="w-4 h-4 text-cyan-400" />
                  <span>資産ポートフォリオ・仮想売買へ</span>
                </Link>
              </div>

              {/* 言葉で探せるスクリーニング例（ワンタップ） */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-gray-400 font-bold text-[11px]">人気の言葉で探す:</span>
                <button
                  onClick={() => {
                    setSearchInitialQuery('今注目の低位株');
                    setIsSearchOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-[11px] transition-all cursor-pointer"
                >
                  🔥 今注目の低位株
                </button>
                <button
                  onClick={() => {
                    setSearchInitialQuery('株価500円以下の割安低位株');
                    setIsSearchOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-[11px] transition-all cursor-pointer"
                >
                  💎 株価500円以下の割安株
                </button>
                <button
                  onClick={() => {
                    setSearchInitialQuery('防衛 国策テーマ株');
                    setIsSearchOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 font-bold text-[11px] transition-all cursor-pointer"
                >
                  🛡️ 防衛・国策テーマ株
                </button>
                <button
                  onClick={() => {
                    setSearchInitialQuery('ここ最近出来高が異常にできてる株');
                    setIsSearchOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-[11px] transition-all cursor-pointer"
                >
                  ⚡ 出来高が異常にできてる株
                </button>
                <button
                  onClick={() => {
                    setSearchInitialQuery('高配当 好業績 バリュー株');
                    setIsSearchOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] transition-all hidden sm:inline-block cursor-pointer"
                >
                  💰 高配当×好業績
                </button>
              </div>
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
                  onClick={() => {
                    if (!isLoggedIn) {
                      window.dispatchEvent(new Event('kabu_watch_open_auth_modal'));
                      return;
                    }
                    setChatState({ 
                      title: '相場・注目銘柄 AI相談', 
                      content: '今日の日経平均動向、個別株の材料、決算の見方など、気になることを自由にGeminiに質問できます。' 
                    });
                  }}
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

        {/* 未ログイン時の会員登録案内バナー */}
        {!isLoggedIn && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/40 to-blue-950/40 border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-white">株ウォッチAI 無料会員登録</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    登録30秒・完全無料
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-0.5">
                  ログインすると、全銘柄のAI解読・時系列ニュース・適時開示PDF分析・お気に入り監視・資産ポートフォリオが全て解放されます。
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => window.dispatchEvent(new Event('kabu_watch_open_auth_modal'))}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>無料会員登録 / ログイン</span>
              </button>
            </div>
          </div>
        )}

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
                  値上がり・S高をGemini要約（フリー閲覧可）
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
            {isLoggedIn && (
              <Link
                href="/whats-new"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <BellRing className="w-3.5 h-3.5" /> 昨日からの変化を見る
              </Link>
            )}
          </div>

          {!isLoggedIn ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-gray-900 via-[#0e1628] to-gray-900 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Lock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    お気に入り監視（無料会員限定）
                  </h3>
                  <p className="text-xs text-gray-300 mt-1">
                    お気に入りに銘柄を登録すると、Geminiが適時開示・ニュース・業績推移を専用ダッシュボードで24時間自動監視します。
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.dispatchEvent(new Event('kabu_watch_open_auth_modal'))}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>無料会員登録 / ログインして利用する</span>
              </button>
            </div>
          ) : watchlistStocks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-gray-900/60 border border-gray-800 text-center space-y-3">
              <Star className="w-8 h-8 text-gray-500 mx-auto" />
              <p className="text-sm text-gray-400">お気に入りに登録された銘柄はまだありません。</p>
              <p className="text-xs text-gray-500">上の検索や市場ランキングから気になる銘柄の⭐を押して追加してください。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {watchlistStocks.map((stock) => {
                const isUp = (stock.changePercent ?? 0) >= 0;
                const notes = aiNotesMap[stock.ticker] || [];
                const hasNotes = notes.length > 0;

                return (
                  <div
                    key={stock.ticker}
                    className="group p-5 rounded-2xl bg-[#111827] border border-gray-800 hover:border-cyan-500/50 hover:bg-gray-800/60 transition-all shadow-lg flex flex-col justify-between space-y-3"
                  >
                    <Link
                      href={`/stocks/${stock.ticker}`}
                      className="block space-y-2 cursor-pointer"
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
                    </Link>

                    {/* 🌟 登録済みAI見解ボタン（AIの見解が登録されたら表示） */}
                    {hasNotes && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAiNoteModalTarget({
                            isOpen: true,
                            ticker: stock.ticker,
                            stockName: stock.name,
                            notes: notes,
                          });
                        }}
                        className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-[#0d2238] via-[#111e3b] to-[#1a1236] border border-cyan-400/60 hover:border-cyan-300 text-cyan-200 text-xs font-bold transition-all flex items-center justify-between shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/25 group/btn cursor-pointer animate-ai-glow-pulse"
                        title="登録されたAIの見解を読む"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
                          <span className="font-extrabold text-white text-[11px] truncate">
                            {notes[0].title || 'AIの見解'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-mono">
                            {notes.length}件
                          </span>
                          <span className="text-[10px] text-cyan-300 font-bold group-hover/btn:translate-x-0.5 transition-transform">
                            読む
                          </span>
                        </div>
                      </button>
                    )}

                    <div className="pt-2.5 border-t border-gray-800/80 flex items-center justify-between text-xs font-semibold text-cyan-400">
                      <Link
                        href={`/stocks/${stock.ticker}`}
                        className="flex items-center justify-between w-full hover:text-cyan-300 transition-colors"
                      >
                        <span>専用AIダッシュボード</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Featured Timeline Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  お気に入り銘柄の時系列タイムライン
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {favorites.length}銘柄連動
                </span>
                {isUpdating && (
                  <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> 最新開示・ニュース同期中
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                登録したお気に入り銘柄（★）の適時開示・ニュース・決算をリアルタイム集約し最新順に一覧表示
              </p>
            </div>

            <button
              onClick={() => fetchHomeTimeline(favorites)}
              className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-cyan-500/40 text-xs text-gray-300 hover:text-cyan-300 flex items-center gap-1.5 transition-all self-start sm:self-auto shrink-0 shadow-sm"
              title="お気に入り銘柄のタイムラインを再読み込み"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>最新に更新</span>
            </button>
          </div>

          <Timeline
            items={timeline}
            onOpenPdf={(item) => setPdfItem(item)}
            onOpenChat={(title, content) => {
              if (!isLoggedIn) {
                window.dispatchEvent(new Event('kabu_watch_open_auth_modal'));
                return;
              }
              setChatState({ title, content });
            }}
            onOpenImpact={(title, item) => {
              if (!isLoggedIn) {
                window.dispatchEvent(new Event('kabu_watch_open_auth_modal'));
                return;
              }
              setImpactState({ title, item });
            }}
            onOpenPartner={(partner) => {
              if (!isLoggedIn) {
                window.dispatchEvent(new Event('kabu_watch_open_auth_modal'));
                return;
              }
              setPartnerState(partner);
            }}
            onOpenBuy={(ticker, name, price, news) => {
              if (!isLoggedIn) {
                window.dispatchEvent(new Event('kabu_watch_open_auth_modal'));
                return;
              }
              setBuyState({ ticker, stockName: name, currentPrice: price, newsTitle: news });
            }}
          />
        </section>

      </main>

      {/* Modals */}
      <SemanticSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        initialQuery={searchInitialQuery}
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

      {/* 🌟 ウォッチリスト用 AI見解ビューアモーダル */}
      <WatchlistAiNoteModal
        isOpen={aiNoteModalTarget.isOpen}
        onClose={() => setAiNoteModalTarget((prev) => ({ ...prev, isOpen: false }))}
        ticker={aiNoteModalTarget.ticker}
        stockName={aiNoteModalTarget.stockName}
        notes={aiNoteModalTarget.notes}
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
