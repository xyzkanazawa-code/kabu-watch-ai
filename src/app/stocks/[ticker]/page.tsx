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
import { Loader2, ArrowLeft, Bot, Sparkles } from 'lucide-react';

export default function StockCenterPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = (params?.ticker as string) || '7203';

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);

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
  }, [ticker]);

  const loadStockCenterData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stocks/${ticker}`);
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

            {/* 🤖 Geminiさん常駐アシスタントバー */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#11192e] via-[#0d1629] to-[#122238] border border-cyan-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/30 to-purple-600/30 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-md">
                    <Bot className="w-5 h-5 animate-pulse" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-cyan-300">Geminiさん</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                      常駐AIアドバイザー
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-0.5">
                    「{stockInfo.name}」の会社情報・世界シェア・直近決算と市場反応・需給・リスクを詳しく解説中！
                  </p>
                </div>
              </div>

              <button
                onClick={() => setChatState({
                  title: `${stockInfo.name}（${ticker}）についてGeminiさんに質問`,
                  content: `銘柄コード: ${ticker}\n会社名: ${stockInfo.name}\n事業内容: ${aiOverview.whatCompany || stockInfo.description}\n直近決算: ${aiOverview.latestEarnings || ''}\n指標・需給: ${aiOverview.indicators || ''}`
                })}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-extrabold text-xs transition-all shadow-md shadow-cyan-500/20 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>Geminiさんに直接質問する</span>
              </button>
            </div>

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
    </div>
  );
}
