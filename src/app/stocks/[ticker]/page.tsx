'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { StockHeader } from '@/components/StockHeader';
import { StockTabs } from '@/components/StockTabs';
import { SemanticSearchModal } from '@/components/SemanticSearchModal';
import { PdfViewerModal } from '@/components/PdfViewerModal';
import { GeminiChatModal } from '@/components/GeminiChatModal';
import { ImpactAnalyzerModal } from '@/components/ImpactAnalyzerModal';
import { PartnerCompanyCard } from '@/components/PartnerCompanyCard';
import { BuyModal } from '@/components/BuyModal';
import { getFavorites, addFavorite, removeFavorite, isFavorite } from '@/lib/storage';
import { StockInfo, TimelineItem, NewsItem, DisclosureItem, FinancialTrend, ProductItem, GlobalInfoItem, StockOverviewAI } from '@/types/stock';
import { Loader2, ArrowLeft, Bot, Sparkles, ExternalLink, Check, Copy, Settings, Plus, Lock, LogIn, ShieldCheck } from 'lucide-react';
import { ExternalAiSettingsModal } from '@/components/ExternalAiSettingsModal';
import { useExternalAiSettings, ExternalAiItem } from '@/lib/useExternalAiSettings';
import { useAuth } from '@/lib/useAuth';
import { StockAiNotesSection } from '@/components/StockAiNotesSection';

export default function StockCenterPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = (params?.ticker as string) || '7203';
  const { isLoggedIn } = useAuth();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isFav, setIsFav] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 外部AIアシスタント設定
  const { enabledAiList } = useExternalAiSettings();

  // Stock Data state
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [disclosures, setDisclosures] = useState<DisclosureItem[]>([]);
  const [financialTrends, setFinancialTrends] = useState<FinancialTrend[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [globalInfo, setGlobalInfo] = useState<GlobalInfoItem[]>([]);
  const [aiOverview, setAiOverview] = useState<StockOverviewAI | null>(null);

  // Modals state
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [buyModalType, setBuyModalType] = useState<'simulation' | 'real'>('simulation');
  const [pdfItem, setPdfItem] = useState<any>(null);
  const [chatState, setChatState] = useState<{ title: string; content?: string } | null>(null);
  const [impactState, setImpactState] = useState<{ title: string; item: any } | null>(null);
  const [partnerState, setPartnerState] = useState<any>(null);

  useEffect(() => {
    const favs = getFavorites();
    setFavorites(favs);
    setIsFav(favs.includes(ticker));

    loadStockCenterData();

    // 未ログイン（フリー）のユーザーが個別銘柄を閲覧しようとした場合、会員登録/ログインモーダルを開く
    if (!isLoggedIn) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('kabu_watch_open_auth_modal'));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ticker, isLoggedIn]);

  const loadStockCenterData = async () => {
    setLoading(true);
    try {
      const storedKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : '';
      const headers: Record<string, string> = {};
      if (storedKey) {
        headers['x-gemini-key'] = storedKey;
      }
      const res = await fetch(`/api/stocks/${ticker}`, { headers });
      const data = await res.json();

      setStockInfo(data.stockInfo);
      setTimeline(data.timeline || []);
      setNews(data.news || []);
      setDisclosures(data.disclosures || []);
      setFinancialTrends(data.financialTrends || []);
      setProducts(data.products || []);
      setGlobalInfo(data.globalInfo || []);
      setAiOverview(data.aiOverview);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenExternalAi = (ai: ExternalAiItem) => {
    if (!stockInfo) return;
    const prompt = `${stockInfo.name}（証券コード: ${ticker}）について詳しく教えてください。事業内容や世界シェア、直近の四半期決算の進捗と市場の反応、信用取引の需給状況、今後の株価カタリストやリスクについてプロの視点で解説してください。`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(prompt).catch(() => {});
      setCopiedPrompt(ai.name);
      setTimeout(() => setCopiedPrompt(null), 4000);
    }
    const targetUrl = ai.urlWithPrompt ? ai.urlWithPrompt(prompt) : ai.url;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleToggleFav = () => {
    if (isFav) {
      const next = removeFavorite(ticker);
      setFavorites(next);
      setIsFav(false);
    } else {
      const next = addFavorite(ticker, stockInfo ? {
        name: stockInfo.name,
        sector: stockInfo.sector,
        price: stockInfo.price,
        changePercent: stockInfo.changePercent
      } : undefined);
      setFavorites(next);
      setIsFav(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        favoritesCount={favorites.length}
        hasNewAlerts={true}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> 戻る
        </button>

        {loading || !stockInfo || !aiOverview ? (
          <div className="py-24 flex flex-col items-center justify-center text-cyan-400 gap-3">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="text-sm font-semibold animate-pulse">
              銘柄 ({ticker}) の専用AI情報センターを構築中...
            </p>
          </div>
        ) : (
          <>
            {/* Header & Basic Stock Indicators */}
            <StockHeader
              stock={stockInfo}
              isFav={isFav}
              onToggleFav={handleToggleFav}
              onOpenBuy={(type) => {
                setBuyModalType(type || 'simulation');
                setIsBuyModalOpen(true);
              }}
            />

            {/* 未ログイン時の会員限定ゲート案内カード */}
            {!isLoggedIn ? (
              <div className="relative rounded-3xl overflow-hidden border border-cyan-500/40 bg-gradient-to-b from-gray-900/95 via-[#0c1427]/95 to-[#080d1a]/95 p-6 sm:p-10 shadow-2xl text-center space-y-6">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
                
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg mx-auto">
                  <Lock className="w-8 h-8 animate-pulse" />
                </div>

                <div className="max-w-lg mx-auto space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>無料会員限定コンテンツ</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {stockInfo.name} のAI深層解読・適時開示・時系列ニュース
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    無料の会員登録（お名前またはメール入力・30秒）を行うと、個別銘柄のAI業績分析、時系列ニュース、PDF適時開示解読、お気に入り管理機能がすべて解放されます。
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => window.dispatchEvent(new Event('kabu_watch_open_auth_modal'))}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>無料会員登録 / ログインして続きを読む</span>
                  </button>
                  <button
                    onClick={() => router.push('/rankings')}
                    className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white font-bold text-xs border border-gray-700 transition-all cursor-pointer"
                  >
                    ランキング（フリー閲覧）を見る
                  </button>
                </div>

                {/* すりガラスプレビュー */}
                <div className="relative mt-8 pt-6 border-t border-gray-800/80 opacity-40 blur-[2px] pointer-events-none select-none max-h-72 overflow-hidden">
                  <StockTabs
                    ticker={ticker}
                    stockName={stockInfo.name}
                    timeline={timeline.slice(0, 2)}
                    news={news.slice(0, 2)}
                    disclosures={disclosures.slice(0, 2)}
                    financialTrends={financialTrends}
                    products={products}
                    globalInfo={globalInfo}
                    aiOverview={aiOverview}
                    onOpenPdf={() => {}}
                    onOpenChat={() => {}}
                    onOpenImpact={() => {}}
                    onOpenPartner={() => {}}
                  />
                </div>
              </div>
            ) : (
              <>
                {/* 🤖 外部AI連携バー（Gemini、ChatGPT、Claude、Perplexity等。自由に追加・削除・ON/OFF可能） */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#11192e] via-[#0d1629] to-[#122238] border border-cyan-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/30 via-indigo-600/30 to-purple-600/30 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-md">
                        <Bot className="w-5 h-5 animate-pulse" />
                      </div>
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-cyan-300">外部AIワンタップ相談</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                          質問文自動コピー
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mt-0.5">
                        「{stockInfo.name}」の事業・世界シェア・決算・需給をお好みの端末内AIで詳しく質問できます
                      </p>
                    </div>
                  </div>

                  {/* AIボタン群 & 設定ボタン */}
                  <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                    {enabledAiList.map((ai) => (
                      <button
                        key={ai.id}
                        onClick={() => handleOpenExternalAi(ai)}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r ${ai.bgGradient} ${ai.textColor} font-bold text-xs transition-all shadow-md hover:scale-105 active:scale-95 shrink-0 border ${ai.borderClass}`}
                        title={`端末の${ai.name}を開いて「${stockInfo.name}」を質問`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                        <span>{ai.name}</span>
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </button>
                    ))}

                    {enabledAiList.length === 0 && (
                      <span className="text-xs text-gray-400">AIボタンが外されています</span>
                    )}

                    {/* ⚙️ AIボタン追加・外す設定モーダルを開くボタン */}
                    <button
                      type="button"
                      onClick={() => setIsAiSettingsOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-gray-900/90 hover:bg-gray-800 border border-gray-700 hover:border-cyan-500/50 text-gray-300 hover:text-white text-xs font-semibold transition-all shrink-0"
                      title="表示するAIボタンを追加・外す（カスタマイズ）"
                    >
                      <Settings className="w-3.5 h-3.5 text-cyan-400" />
                      <span>AI設定</span>
                    </button>

                    {/* コピー完了通知 */}
                    {copiedPrompt && (
                      <div className="w-full flex items-center justify-start sm:justify-end">
                        <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/90 px-2.5 py-1 rounded-xl border border-emerald-500/40 flex items-center gap-1 animate-fade-in shadow-md">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          質問文をコピーしました！{copiedPrompt}で送信し、得られた回答はすぐ下の「AIの回答を貼り付ける」で保存できます
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 📝 外部AI見解・調査メモ（Gemini等の調査結果を貼り付けてボタン展開できるエリア） */}
                <StockAiNotesSection ticker={ticker} stockName={stockInfo.name} />

                {/* Multi-perspective Tabs Area */}
                <StockTabs
                  ticker={ticker}
                  stockName={stockInfo.name}
                  timeline={timeline}
                  news={news}
                  disclosures={disclosures}
                  financialTrends={financialTrends}
                  products={products}
                  globalInfo={globalInfo}
                  aiOverview={aiOverview}
                  onOpenPdf={(item) => setPdfItem(item)}
                  onOpenChat={(title, content) => setChatState({ title, content })}
                  onOpenImpact={(title, item) => setImpactState({ title, item })}
                  onOpenPartner={(partner) => setPartnerState(partner)}
                />
              </>
            )}
          </>
        )}

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
          ticker={impactState.item?.ticker || ticker}
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

      {stockInfo && (
        <BuyModal
          isOpen={isBuyModalOpen}
          onClose={() => setIsBuyModalOpen(false)}
          ticker={stockInfo.ticker}
          stockName={stockInfo.name}
          currentPrice={stockInfo.price}
          initialType={buyModalType}
        />
      )}

      {/* 🤖 外部AI設定モーダル */}
      <ExternalAiSettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
      />
    </div>
  );
}
