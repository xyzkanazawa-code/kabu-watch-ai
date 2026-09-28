'use client';

import React, { useState } from 'react';
import { NewsItem, DisclosureItem, TimelineItem, FinancialTrend, ProductItem, GlobalInfoItem, StockOverviewAI } from '@/types/stock';
import { Timeline } from './Timeline';
import { Newspaper, Megaphone, Coins, Handshake, Factory, Globe, BarChart, FileText, Bot, Sparkles, Download, CheckCircle, ExternalLink, ArrowUpRight } from 'lucide-react';

interface StockTabsProps {
  ticker: string;
  stockName: string;
  timeline: TimelineItem[];
  news: NewsItem[];
  disclosures: DisclosureItem[];
  financialTrends: FinancialTrend[];
  products: ProductItem[];
  globalInfo: GlobalInfoItem[];
  aiOverview: StockOverviewAI;
  onOpenPdf: (item: any) => void;
  onOpenChat: (title: string, content?: string) => void;
  onOpenImpact: (title: string, item: any) => void;
  onOpenPartner: (partner: any) => void;
}

type TabType = 'news' | 'disclosures' | 'earnings' | 'partnerships' | 'products' | 'global' | 'financials' | 'pdfVault' | 'aiOverview';

export const StockTabs: React.FC<StockTabsProps> = ({
  ticker,
  stockName,
  timeline,
  news,
  disclosures,
  financialTrends,
  products,
  globalInfo,
  aiOverview,
  onOpenPdf,
  onOpenChat,
  onOpenImpact,
  onOpenPartner
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('aiOverview');

  const tabs = [
    { id: 'aiOverview', label: '🤖 Geminiさんの企業徹底解読', count: undefined },
    { id: 'news', label: '📰 最新ニュース', count: news.length },
    { id: 'disclosures', label: '📢 適時開示', count: disclosures.length },
    { id: 'earnings', label: '💰 決算発表', count: disclosures.filter(d => d.category === 'earnings').length },
    { id: 'partnerships', label: '🤝 提携・M&A', count: timeline.filter(t => t.category === 'partnership' || t.category === 'ma').length },
    { id: 'products', label: '🏭 商品・サービス', count: products.length },
    { id: 'global', label: '🌎 海外事業', count: globalInfo.length },
    { id: 'financials', label: '📊 業績推移', count: financialTrends.length },
    { id: 'pdfVault', label: '📄 PDF資料庫', count: disclosures.length }
  ];

  return (
    <div className="w-full space-y-6">
      
      {/* Scrollable Tab Navigation Toolbar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-gray-800">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 border ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10'
                  : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-cyan-500 text-black font-extrabold' : 'bg-gray-800 text-gray-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Display Panels */}
      <div className="w-full">
        
        {/* 🤖 Geminiさんの企業徹底解読 */}
        {activeTab === 'aiOverview' && (
          <div className="p-6 rounded-2xl bg-[#111827] border border-cyan-500/40 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-cyan-600/30 via-indigo-600/30 to-purple-600/30 border border-cyan-500/50 text-cyan-300 shadow-lg shadow-cyan-500/20">
                    <Bot className="w-7 h-7" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      Geminiさんの企業徹底解読
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      専属AIアナリスト
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {stockName}（{ticker}）の会社情報・世界シェア・直近決算・需給・リスクを投資家目線で詳しく解説
                  </p>
                </div>
              </div>

              {/* Chat action button */}
              <button
                onClick={() => onOpenChat(`${stockName}（${ticker}）についての質問`, `銘柄: ${stockName} (${ticker})\n概要: ${aiOverview.summary}\n事業: ${aiOverview.whatCompany || ''}`)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 hover:from-cyan-400 to-blue-600 hover:to-blue-500 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 shrink-0"
              >
                <Sparkles className="w-4 h-4 text-black" />
                <span>Geminiさんにこの銘柄の疑問を聞く</span>
              </button>
            </div>

            {/* 現状の総括・スタンス */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-gray-900 to-indigo-950/40 border border-cyan-500/30 space-y-1.5 shadow-md">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-cyan-500 text-black">
                  CURRENT STANCE
                </span>
                <h3 className="text-xs font-bold text-cyan-300">
                  現状の株価位置づけと総合サマリー
                </h3>
              </div>
              <p className="text-sm text-gray-100 leading-relaxed font-medium">
                {aiOverview.summary}
              </p>
            </div>

            {/* 🏢 何の会社か */}
            {aiOverview.whatCompany && (
              <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800 space-y-2">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Factory className="w-4 h-4 text-cyan-400" />
                  何の会社か（事業内容・世界シェア・強み）
                </h3>
                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-sans">
                  {aiOverview.whatCompany}
                </p>
              </div>
            )}

            {/* 📊 直近の決算 */}
            {aiOverview.latestEarnings && (
              <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800 space-y-2">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-amber-400" />
                  直近の決算と市場のリアルな反応
                </h3>
                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-sans">
                  {aiOverview.latestEarnings}
                </p>
              </div>
            )}

            {/* ⚡ 最近の動き */}
            {aiOverview.recentTrends && aiOverview.recentTrends.length > 0 && (
              <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800 space-y-2.5">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-purple-400" />
                  最近の動き（新製品・アナリスト評価・株主還元）
                </h3>
                <ul className="space-y-2">
                  {aiOverview.recentTrends.map((trend, idx) => (
                    <li key={idx} className="text-xs sm:text-sm text-gray-200 flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0 mt-1.5 shadow-sm shadow-purple-400/50"></span>
                      <span className="leading-relaxed">{trend}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 📈 株価の指標と需給 */}
            {aiOverview.indicators && (
              <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800 space-y-2">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                  <Coins className="w-4 h-4 text-blue-400" />
                  株価の指標と需給動向（信用取引・戻り売り圧力）
                </h3>
                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-sans">
                  {aiOverview.indicators}
                </p>
              </div>
            )}

            {/* 2カラム: 強気材料 vs リスク要因 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Catalysts (強気材料) */}
              <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  強気材料・カタリスト
                </h3>
                <ul className="space-y-2">
                  {(aiOverview.bullPoints || aiOverview.catalysts).map((c, i) => (
                    <li key={i} className="text-xs text-emerald-200 flex items-start gap-2 leading-relaxed">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risks (リスク要因) */}
              <div className="p-5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                <h3 className="text-xs font-bold text-rose-400 flex items-center gap-2 uppercase tracking-wider">
                  <span>⚠️</span>
                  留意すべきリスク・懸念点
                </h3>
                <ul className="space-y-2">
                  {(aiOverview.riskPoints || aiOverview.risks).map((r, i) => (
                    <li key={i} className="text-xs text-rose-200 flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5"></span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 🎯 次の大きなイベント */}
            {aiOverview.nextCatalysts && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 to-orange-950/30 border border-amber-500/30 space-y-1.5">
                <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>🎯</span> 次の大きなイベント・注目焦点
                </h3>
                <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
                  {aiOverview.nextCatalysts}
                </p>
              </div>
            )}

            {/* 🔮 投資見通しと注目ポイント */}
            {aiOverview.investmentOutlook && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/30 to-purple-950/30 border border-cyan-500/30 space-y-1.5">
                <h3 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-300" /> 今後の投資見通し
                </h3>
                <p className="text-xs sm:text-sm text-cyan-100 leading-relaxed">
                  {aiOverview.investmentOutlook}
                </p>
              </div>
            )}

            {/* 📚 主な出典 */}
            {aiOverview.sources && aiOverview.sources.length > 0 && (
              <div className="pt-2 border-t border-gray-800/80 flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                <span className="font-semibold text-gray-500">主な出典・参考資料:</span>
                {aiOverview.sources.map((src, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-300 font-mono">
                    {src}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 📰 1. 最新ニュース / 2. 適時開示 / 3. 決算 / 4. 提携 */}
        {(activeTab === 'news' || activeTab === 'disclosures' || activeTab === 'earnings' || activeTab === 'partnerships') && (
          <Timeline
            items={
              activeTab === 'news'
                ? timeline.filter(t => t.type === 'news' || t.category === 'news')
                : (activeTab === 'disclosures'
                    ? timeline.filter(t => t.rawDisclosureItem)
                    : (activeTab === 'earnings'
                        ? timeline.filter(t => t.category === 'earnings')
                        : timeline.filter(t => t.category === 'partnership' || t.category === 'ma')))
            }
            onOpenPdf={onOpenPdf}
            onOpenChat={onOpenChat}
            onOpenImpact={onOpenImpact}
            onOpenPartner={onOpenPartner}
          />
        )}

        {/* 🏭 5. 商品・サービス一覧 */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {products.map((prod, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-[#111827] border border-gray-800 hover:border-cyan-500/40 transition-all space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20">
                    {prod.category}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-bold">
                    {prod.share}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{prod.name}</h3>
                <p className="text-xs text-gray-300 leading-relaxed bg-gray-950/60 p-3 rounded-xl border border-gray-800/80">
                  {prod.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 🌎 6. 海外情報 */}
        {activeTab === 'global' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {globalInfo.map((g, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-[#111827] border border-gray-800 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-cyan-400" /> {g.region}
                  </h3>
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/30">
                    売上構成比 {g.salesRatio}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {g.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 📊 7. 業績推移（売上/利益） */}
        {activeTab === 'financials' && (
          <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart className="w-5 h-5 text-emerald-400" /> 通期業績推移 (売上高・営業利益・純利益)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/60 text-gray-400">
                    <th className="p-3">決算期</th>
                    <th className="p-3 text-right">売上高(億円)</th>
                    <th className="p-3 text-right">営業利益(億円)</th>
                    <th className="p-3 text-right">純利益(億円)</th>
                    <th className="p-3 text-right">EPS(円)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {financialTrends.map((f, i) => (
                    <tr key={i} className="hover:bg-gray-900/40">
                      <td className="p-3 font-bold text-white">{f.period}</td>
                      <td className="p-3 text-right text-gray-200">{f.sales.toLocaleString()}</td>
                      <td className="p-3 text-right text-emerald-400 font-bold">{f.operatingProfit.toLocaleString()}</td>
                      <td className="p-3 text-right text-cyan-400">{f.netProfit.toLocaleString()}</td>
                      <td className="p-3 text-right text-gray-300">{f.eps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 📄 8. 開示・IR PDF資料庫 */}
        {activeTab === 'pdfVault' && (
          <div className="space-y-3">
            {disclosures.map((d) => (
              <div key={d.id} className="p-4 rounded-xl bg-[#111827] border border-gray-800 hover:border-purple-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-500">{d.publishedAt}</span>
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                        適時開示PDF
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white line-clamp-1 mt-0.5">{d.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpenPdf(d)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-semibold text-xs transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    📄 プレビュー & AI要約
                  </button>
                  <a
                    href={d.pdfUrl}
                    download
                    className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition-all"
                    title="PDFダウンロード"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
