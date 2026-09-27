'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Search, X, Loader2, ArrowRight, CheckCircle2, Tag, Hash, Building2, Store, HelpCircle, Star } from 'lucide-react';
import { SemanticSearchResult } from '@/types/stock';
import { STOCK_MASTER } from '@/lib/dataFetcher';
import { normalizeStockInput, findBrandSuggestions, BRAND_TO_STOCK_MAP, extractTickerCode } from '@/lib/stockLookup';
import { saveFavoriteMeta, addFavorite, removeFavorite, getFavorites } from '@/lib/storage';
import Link from 'next/link';

interface SemanticSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_QUERIES = [
  '7203 トヨタ自動車',
  '186A アストロスケール',
  '141A トライアル',
  'ユニクロ (9983)',
  'ドンキ (7532)',
  'スシロー (3563)',
  '無印良品 (7453)',
  'サイゼリヤ (7581)',
  'マクドナルド (2702)',
  'セブンイレブン (3382)',
  'ニトリ (9843)',
  '6920 レーザーテック',
  '7011 三菱重工業'
];

export const SemanticSearchModal: React.FC<SemanticSearchModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [liveTickerName, setLiveTickerName] = useState<{ ticker: string; name: string; sector: string; price: number } | null>(null);
  const [favTickers, setFavTickers] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFavTickers(getFavorites());
    }
  }, [isOpen]);

  const handleToggleWatch = (e: React.MouseEvent, ticker: string, name: string, sector?: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (favTickers.includes(ticker)) {
      const next = removeFavorite(ticker);
      setFavTickers(next);
    } else {
      const next = addFavorite(ticker, { name, sector });
      setFavTickers(next);
    }
  };

  // 1. 店舗名・ブランド名・曖昧な名称からの「この会社ですか？」候補（即時0秒抽出）
  const brandSuggestions = useMemo(() => {
    return findBrandSuggestions(query);
  }, [query]);

  // 2. 証券コード（数字4桁 または 186A等の英字混在）の即時ルックアップ
  useEffect(() => {
    const code = extractTickerCode(query);
    if (!code) {
      setLiveTickerName(null);
      return;
    }

    if (STOCK_MASTER[code]) {
      const s = STOCK_MASTER[code];
      setLiveTickerName({
        ticker: code,
        name: s.name,
        sector: s.sector,
        price: s.price
      });
      return;
    }

    // 未登録コードの場合は高速stock-lookup APIから会社名とリアルタイム株価を取得
    let isMounted = true;
    fetch(`/api/stock-lookup?ticker=${code}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && data.name && !data.name.includes('東証銘柄 (')) {
          setLiveTickerName({
            ticker: code,
            name: data.name,
            sector: data.sector || '東証上場銘柄',
            price: data.price || 1000
          });
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [query]);


  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 全角数字・英字を半角数字・小文字に即座に矯正（186a等の小文字でもOK）
    const normalized = normalizeStockInput(e.target.value);
    setQuery(normalized);
  };

  const handleSearch = async (targetQuery?: string) => {
    const raw = targetQuery !== undefined ? targetQuery : query;
    const q = normalizeStockInput(raw);
    if (!q) return;

    // もし英数字コード（7203, 186A, 186a等）が直接入力された場合、候補を即時表示しつつAPIも呼び出す
    const code = extractTickerCode(q);
    if (code && !targetQuery) {
      const master = STOCK_MASTER[code];
      const name = master ? master.name : (liveTickerName?.name || `証券コード ${code}`);
      const sector = master ? master.sector : (liveTickerName?.sector || '東証上場');
      setResults([
        {
          ticker: code,
          name,
          sector,
          relevanceReason: `証券コード【${code}】完全一致。${name}の詳細情報センターを開きます。`,
          representativeProducts: [name, sector],
          confidenceScore: 100
        }
      ]);
      setSearched(true);
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch('/api/gemini/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setResults(data.results);
      }
    } catch (err) {
      console.error('Semantic search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#111827] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#0B0F19]/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                銘柄検索 ＆ 店舗・AI逆引き
              </h2>
              <p className="text-xs text-gray-400">証券コード・お店の名前（ユニクロ、ドンキ等）・曖昧なキーワードから自動特定</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Box */}
        <div className="p-6 border-b border-gray-800 space-y-4 bg-gray-900/40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="relative flex items-center"
          >
            <Search className="absolute left-4 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="証券コード (7203)、店舗名 (ユニクロ、ドンキ、スシロー)、社名..."
              className="w-full pl-12 pr-28 py-3.5 rounded-xl bg-[#0B0F19] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition-all"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-semibold text-xs hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md active:scale-95"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {query.match(/^\d{4}$/) ? 'コード検索' : '検索実行'}
            </button>
          </form>

          {/* 🎯 証券コード入力時のリアルタイム会社名確定バナー */}
          {liveTickerName && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 to-cyan-950/40 border border-emerald-500/40 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Hash className="w-3 h-3" /> {liveTickerName.ticker}
                </span>
                <span className="text-sm font-extrabold text-white">
                  {liveTickerName.name}
                </span>
                <span className="text-xs text-gray-400">
                  ({liveTickerName.sector})
                </span>
                {liveTickerName.price > 0 && (
                  <span className="text-xs font-mono font-bold text-gray-200 hidden sm:inline">
                    ¥{liveTickerName.price.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleToggleWatch(e, liveTickerName.ticker, liveTickerName.name, liveTickerName.sector)}
                  className={`p-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
                    favTickers.includes(liveTickerName.ticker)
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white'
                  }`}
                  title="ウォッチリストに追加/解除"
                >
                  <Star className={`w-3.5 h-3.5 ${favTickers.includes(liveTickerName.ticker) ? 'fill-amber-400 text-amber-400' : ''}`} />
                  <span className="hidden sm:inline">{favTickers.includes(liveTickerName.ticker) ? 'ウォッチ中' : 'ウォッチ追加'}</span>
                </button>
                <Link
                  href={`/stocks/${liveTickerName.ticker}`}
                  onClick={() => {
                    saveFavoriteMeta(liveTickerName.ticker, {
                      ticker: liveTickerName.ticker,
                      name: liveTickerName.name,
                      sector: liveTickerName.sector,
                      price: liveTickerName.price,
                    });
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs flex items-center gap-1 transition-all shrink-0 shadow"
                >
                  会社ページを開く <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* 💡 お店の名前・曖昧なキーワードからの「この会社ですか？」提案カード群 */}
          {query.trim().length > 0 && brandSuggestions.length > 0 && !query.match(/^\d{4}$/) && (
            <div className="space-y-2 animate-fadeIn p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-gray-900 border border-cyan-500/40">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-cyan-400" />
                  もしかしてこの会社ですか？（店舗・ブランド逆引き）
                </span>
                <span className="text-[11px] text-gray-400">
                  {brandSuggestions.length}件の候補
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {brandSuggestions.map((item, bIdx) => (
                  <Link
                    key={bIdx}
                    href={`/stocks/${item.ticker}`}
                    onClick={onClose}
                    className="p-2.5 rounded-xl bg-gray-900/90 hover:bg-gray-800 border border-gray-800 hover:border-cyan-400/60 transition-all flex items-start justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono text-[10px] font-bold">
                          {item.ticker}
                        </span>
                        <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {item.officialName}
                        </h4>
                      </div>
                      <p className="text-[11px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                        店舗・店名: {item.brandName}
                      </p>
                      <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5 mt-1" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Preset Chips */}
          <div>
            <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 mb-2">
              <Tag className="w-3 h-3 text-cyan-400" /> おすすめ検索例（店名・コード・略称）:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_QUERIES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const clean = preset.split(' ')[0]; // ユニクロ (9983) -> ユニクロ
                    setQuery(clean);
                    handleSearch(clean);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-gray-800/80 hover:bg-cyan-950 hover:border-cyan-500/50 border border-gray-700/60 text-xs text-gray-300 transition-all text-left"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Scroll Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-cyan-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-medium animate-pulse">Gemini 1.5 Flash が検索意図・証券コードを分析中...</p>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              該当する銘柄が見つかりませんでした。別の証券コードやキーワードでお試しください。
            </div>
          )}

          {!loading && results.map((item, idx) => {
            const isFav = favTickers.includes(item.ticker);
            return (
              <div
                key={idx}
                className="group relative p-4 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-cyan-500/50 hover:bg-gray-800/60 transition-all shadow-md"
              >
                <div className="flex items-start justify-between">
                  <Link
                    href={`/stocks/${item.ticker}`}
                    onClick={() => {
                      saveFavoriteMeta(item.ticker, {
                        ticker: item.ticker,
                        name: item.name,
                        sector: item.sector,
                      });
                      onClose();
                    }}
                    className="flex-1"
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {item.ticker}
                      </span>
                      <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
                        {item.name}
                      </h3>
                      <span className="text-xs text-gray-400 border border-gray-700 px-2 py-0.5 rounded">
                        {item.sector}
                      </span>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={(e) => handleToggleWatch(e, item.ticker, item.name, item.sector)}
                      className={`p-2 rounded-lg border transition-all ${
                        isFav 
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-amber-400'
                      }`}
                      title={isFav ? 'ウォッチ解除' : 'ウォッチリストに追加'}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                    <div className="hidden sm:flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {item.confidenceScore === 100 ? 'コード一致' : `一致度 ${item.confidenceScore}%`}
                    </div>
                  </div>
                </div>

                <Link
                  href={`/stocks/${item.ticker}`}
                  onClick={() => {
                    saveFavoriteMeta(item.ticker, {
                      ticker: item.ticker,
                      name: item.name,
                      sector: item.sector,
                    });
                    onClose();
                  }}
                  className="block mt-2"
                >
                  <p className="text-xs text-gray-300 leading-relaxed bg-gray-950/60 p-2.5 rounded-lg border border-gray-800/60">
                    <span className="text-cyan-400 font-semibold">分析根拠: </span>
                    {item.relevanceReason}
                  </p>

                  {item.representativeProducts && item.representativeProducts.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-gray-500">代表製品/キーワード:</span>
                      {item.representativeProducts.map((p, pIdx) => (
                        <span key={pIdx} className="text-[11px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-medium">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-end text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                    銘柄詳細・適時開示・AI影響度を開く <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
