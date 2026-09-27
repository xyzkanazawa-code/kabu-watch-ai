'use client';

import React from 'react';
import Link from 'next/link';
import { TimelineItem, CategoryType } from '@/types/stock';
import { STOCK_MASTER } from '@/lib/dataFetcher';
import { sendToNotebookLm } from '@/lib/notebookLmHelper';
import { FileText, Newspaper, TrendingUp, Handshake, Box, Calendar, Bot, Zap, ExternalLink, Building2, Star, ShoppingCart, BookOpen } from 'lucide-react';

interface TimelineProps {
  items: TimelineItem[];
  onOpenPdf: (item: any) => void;
  onOpenChat: (title: string, content?: string) => void;
  onOpenImpact: (title: string, item: any) => void;
  onOpenPartner: (partner: any) => void;
  onOpenBuy?: (ticker: string, stockName?: string, currentPrice?: number, newsTitle?: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  items,
  onOpenPdf,
  onOpenChat,
  onOpenImpact,
  onOpenPartner,
  onOpenBuy
}) => {

  // 出所の表示を人間にわかりやすく整形
  const formatSource = (source?: string) => {
    if (!source) return '適時開示 / Web';
    if (source.startsWith('http')) {
      if (source.includes('tdnet')) return '適時開示 (TDnet)';
      if (source.includes('nikkei')) return '日本経済新聞';
      if (source.includes('google')) return 'Googleニュース';
      if (source.includes('yahoo')) return 'Yahoo!ファイナンス';
      if (source.endsWith('.pdf')) return '開示資料 (PDF)';
      try {
        const u = new URL(source);
        return u.hostname;
      } catch {
        return '適時開示';
      }
    }
    return source;
  };

  // カテゴリバッジ表示ヘルパー
  const getCategoryBadge = (category: CategoryType) => {
    switch (category) {
      case 'earnings':
        return { label: '🟣 決算', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'forecast':
        return { label: '🔵 業績予想修正', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'dividend':
        return { label: '🟢 配当・株主還元', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'buyback':
        return { label: '🟠 自社株買い・消却', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'ma':
        return { label: '🔴 M&A', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      case 'partnership':
        return { label: '🟡 業務提携・資本提携', bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' };
      case 'product':
        return { label: '🟤 新商品・新技術', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30' };
      case 'personnel':
        return { label: '⚪ 人事・組織変更', bg: 'bg-gray-500/10 text-gray-300 border-gray-500/30' };
      case 'news':
        return { label: '📰 ニュース', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
      case 'monthly':
        return { label: '📊 月次情報', bg: 'bg-teal-500/10 text-teal-400 border-teal-500/30' };
      default:
        return { label: '🟢 その他', bg: 'bg-gray-500/10 text-gray-400 border-gray-500/30' };
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400 border border-dashed border-gray-800 rounded-2xl">
        タイムラインデータがありません。
      </div>
    );
  }

  return (
    <div className="relative border-l-2 border-gray-800 ml-4 pl-6 space-y-6">
      {items.map((item) => {
        const badge = getCategoryBadge(item.category);
        const isFiveStar = item.impactMatrix?.importanceScore === 5;
        const hasGlow = item.isNew || isFiveStar;

        // 銘柄コードと会社名の判定
        let resolvedTicker = item.ticker;
        let resolvedStockName = item.stockName;

        if (!resolvedTicker && item.title) {
          const match = item.title.match(/[\[\(]([0-9]{4}|[0-9]{3}[A-Za-z0-9])[\]\)]/);
          if (match) {
            resolvedTicker = match[1];
          }
        }

        if (!resolvedStockName && resolvedTicker && STOCK_MASTER[resolvedTicker]) {
          resolvedStockName = STOCK_MASTER[resolvedTicker].name;
        }

        return (
          <div key={item.id} className="relative group">
            
            {/* Timeline Dot Indicator */}
            <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 transition-all ${
              item.category === 'partnership' || item.category === 'ma'
                ? 'bg-rose-500 border-rose-300 shadow-lg shadow-rose-500/50'
                : (item.category === 'earnings' ? 'bg-purple-500 border-purple-300' : 'bg-cyan-500 border-cyan-300')
            }`} />

            {/* Main Content Card */}
            <div className={`p-4 md:p-5 rounded-2xl bg-[#111827] border transition-all ${
              hasGlow 
                ? 'border-emerald-500/60 animate-glow' 
                : 'border-gray-800 hover:border-gray-700'
            }`}>
              
              {/* Card Top Meta */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* 🏢 会社名＆証券コードバッジ (クリックで銘柄画面へ直接ジャンプ可能) */}
                  {(resolvedTicker || resolvedStockName) && (
                    <Link
                      href={resolvedTicker ? `/stocks/${resolvedTicker}` : '#'}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-950/90 to-blue-950/90 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/50 hover:border-cyan-300 text-white font-bold text-xs transition-all shadow-md group/badge"
                      title={`${resolvedStockName || resolvedTicker} の銘柄詳細を見る`}
                    >
                      <Building2 className="w-3.5 h-3.5 text-cyan-400 group-hover/badge:scale-110 transition-transform shrink-0" />
                      {resolvedTicker && (
                        <span className="font-mono text-cyan-300 font-extrabold tracking-wide">
                          [{resolvedTicker}]
                        </span>
                      )}
                      <span className="text-white group-hover/badge:text-cyan-200 font-bold truncate max-w-[200px] sm:max-w-none">
                        {resolvedStockName || (resolvedTicker ? STOCK_MASTER[resolvedTicker]?.name : '') || resolvedTicker}
                      </span>
                    </Link>
                  )}

                  {/* カテゴリバッジ */}
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${badge.bg}`}>
                    {badge.label}
                  </span>
                  {item.isNew && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-black animate-pulse">
                      NEW
                    </span>
                  )}
                  {isFiveStar && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      <Star className="w-3 h-3 fill-amber-300" /> ★★★★★
                    </span>
                  )}
                </div>

                <div className="text-xs font-mono text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  {item.publishedAt}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                {item.title}
              </h3>

              {/* Snippet or Summary */}
              {item.snippet && (
                <p className="mt-2 text-xs text-gray-300 bg-gray-950/60 p-3 rounded-xl border border-gray-800/80 leading-relaxed font-sans whitespace-pre-line">
                  {item.snippet}
                </p>
              )}

              {/* Action Buttons Toolbar */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-800/80">
                <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                  <span className="text-gray-500">出所:</span>
                  <span>{formatSource(item.sourceOrPdf)}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  
                  {/* Geminiに聞く */}
                  <button
                    onClick={() => onOpenChat(item.title, item.snippet)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold text-xs transition-all"
                  >
                    <Bot className="w-3.5 h-3.5 text-cyan-400" />
                    Geminiに聞く
                  </button>

                  {/* 株価影響ディープ分析 */}
                  <button
                    onClick={() => onOpenImpact(item.title, item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition-all"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    株価影響分析
                  </button>

                  {/* PDFプレビューボタン (適時開示の場合) */}
                  {item.rawDisclosureItem && (
                    <>
                      <button
                        onClick={() => onOpenPdf(item.rawDisclosureItem)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-semibold text-xs transition-all"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-400" />
                        PDF閲覧 / 要約
                      </button>

                      {/* 📓 Google NotebookLM 送信 */}
                      <button
                        onClick={() => {
                          const disc = item.rawDisclosureItem;
                          sendToNotebookLm({
                            ticker: disc?.ticker || resolvedTicker || '',
                            stockName: disc?.stockName || resolvedStockName || '',
                            title: disc?.title || item.title,
                            publishedAt: disc?.publishedAt || item.publishedAt,
                            category: item.category,
                            summary: disc?.aiSummary || item.snippet,
                            pdfUrl: disc?.pdfUrl || item.url,
                            url: disc?.originalUrl || item.url
                          });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 border border-indigo-500/40 text-indigo-300 font-semibold text-xs transition-all active:scale-95 cursor-pointer"
                        title="適時開示テキストをコピーしてGoogle NotebookLMを開きます"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        📓 NotebookLM
                      </button>
                    </>
                  )}

                  {/* 提携深掘りボタン */}
                  {(item.category === 'partnership' || item.category === 'ma') && (
                    <button
                      onClick={() => onOpenPartner(item.rawNewsItem?.partnerInfo || item.rawDisclosureItem?.partnerInfo)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs transition-all"
                    >
                      <Building2 className="w-3.5 h-3.5 text-rose-400" />
                      提携相手深掘り
                    </button>
                  )}

                  {/* 仮想購入ボタン */}
                  {onOpenBuy && (
                    <button
                      onClick={() => onOpenBuy(item.ticker || '7203', item.stockName, undefined, item.title)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold text-xs transition-all"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-cyan-400" />
                      仮想購入
                    </button>
                  )}

                  {/* 原文直リンク */}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
                    title="原文リンク"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                </div>
              </div>

            </div>

          </div>
        );
      })}
    </div>
  );
};
