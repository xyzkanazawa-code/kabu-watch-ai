'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, Search, X, Loader2, ArrowRight, CheckCircle2, Tag, 
  Hash, Building2, Store, Star, Flame, Zap, TrendingUp, DollarSign,
  BarChart3, ShieldAlert
} from 'lucide-react';
import { SemanticSearchResult } from '@/types/stock';
import { STOCK_MASTER } from '@/lib/dataFetcher';
import { normalizeStockInput, findBrandSuggestions, extractTickerCode } from '@/lib/stockLookup';
import { saveFavoriteMeta, addFavorite, removeFavorite, getFavorites } from '@/lib/storage';
import { getStoredApiKey } from '@/lib/apiKeyStorage';

interface SemanticSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

// 言葉で探せるAIスクリーニングの人気プリセット
const SCREENING_PRESETS = [
  { label: '今注目の低位株', query: '今注目の低位株', icon: Flame, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { label: '出来高が異常にできてる株', query: 'ここ最近出来高が異常にできてる株', icon: Zap, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  { label: '株価500円以下の割安低位株', query: '株価500円以下の割安低位株', icon: DollarSign, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { label: '高配当×好業績バリュー株', query: '高配当 好業績 バリュー株', icon: TrendingUp, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { label: '次世代AI・半導体関連の本命', query: '次世代AI 半導体 関連株', icon: Sparkles, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { label: '防衛・国策テーマ株', query: '防衛 国策テーマ株', icon: BarChart3, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
];

// 身近な店舗名・ブランド逆引き例
const BRAND_PRESETS = [
  'ユニクロ (9983)',
  'ドンキ (7532)',
  'スシロー (3563)',
  '無印良品 (7453)',
  'サイゼリヤ (7581)',
  'ニトリ (9843)',
  '7203 トヨタ',
  '6920 レーザーテック'
];

export const SemanticSearchModal: React.FC<SemanticSearchModalProps> = ({ isOpen, onClose, initialQuery }) => {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [liveTickerName, setLiveTickerName] = useState<{ ticker: string; name: string; sector: string; price: number } | null>(null);
  const [favTickers, setFavTickers] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFavTickers(getFavorites());
      if (initialQuery) {
        setQuery(initialQuery);
        handleSearch(initialQuery);
      }
    }
  }, [isOpen, initialQuery]);

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

  // 店舗名・ブランド名からの即時抽出
  const brandSuggestions = useMemo(() => {
    return findBrandSuggestions(query);
  }, [query]);

  // 証券コードの即時ルックアップ
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
    const normalized = normalizeStockInput(e.target.value);
    setQuery(normalized);
  };

  const handleSearch = async (targetQuery?: string) => {
    const raw = targetQuery !== undefined ? targetQuery : query;
    const q = normalizeStockInput(raw);
    if (!q) return;

    if (targetQuery !== undefined) {
      setQuery(targetQuery);
    }

    setLoading(true);
    setSearched(true);

    // スクリーニング系キーワードが含まれる場合はコード直接一致の先行表示を行わない
    const isScreening = ['500円', '低位', '出来高', '防衛', '高配当', '半導体', 'ai', '宇宙', '割安'].some(k => q.includes(k));

    // 証券コード直接一致の場合の先行表示
    const code = extractTickerCode(q);
    if (code && !targetQuery && !isScreening && q.length <= 6) {
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
    }

    try {
      const apiKey = getStoredApiKey();
      const res = await fetch('/api/gemini/semantic-search', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-api-key': apiKey } : {})
        },
        body: JSON.stringify({ query: q, apiKey })
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-[#111827] border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/60 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-800 bg-[#0B0F19]/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-emerald-500/20 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                AI言葉で探せる銘柄スクリーニング＆検索
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-400">
                「低位株」「出来高急増」「高配当」など、投資したい言葉でGeminiが銘柄を抽出
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            title="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Box & Presets Area */}
        <div className="p-4 sm:p-5 border-b border-gray-800 space-y-3.5 bg-gray-900/50">
          
          {/* 検索入力フォーム */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="relative flex items-center"
          >
            <Search className="absolute left-4 w-4 h-4 text-cyan-400" />
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="例: 今注目の低位株、出来高急増、7203、ユニクロ..."
              className="w-full pl-11 pr-24 py-3 rounded-2xl bg-[#0B0F19] border border-gray-700 hover:border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs sm:text-sm transition-all"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-20 text-gray-400 hover:text-white p-1 rounded-full"
                title="クリア"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-extrabold text-xs hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-1 shadow-md active:scale-95 cursor-pointer"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>探す</span>
            </button>
          </form>

          {/* 🎯 証券コード直接確定バナー */}
          {liveTickerName && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 to-cyan-950/40 border border-emerald-500/40 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                  [{liveTickerName.ticker}]
                </span>
                <span className="text-sm font-extrabold text-white">
                  {liveTickerName.name}
                </span>
                <span className="text-[11px] text-gray-400">
                  ({liveTickerName.sector})
                </span>
              </div>
              <Link
                href={`/stocks/${liveTickerName.ticker}`}
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs flex items-center gap-1 transition-all"
              >
                開く <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* 💡 お店の名前・曖昧キーワードからの提案 */}
          {query.trim().length > 0 && brandSuggestions.length > 0 && !query.match(/^\d{4}$/) && (
            <div className="space-y-1.5 p-3 rounded-xl bg-gradient-to-r from-cyan-950/40 to-gray-900 border border-cyan-500/30 animate-fadeIn">
              <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-cyan-400" />
                もしかしてこの会社ですか？（店舗・ブランド逆引き）
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {brandSuggestions.map((item, bIdx) => (
                  <Link
                    key={bIdx}
                    href={`/stocks/${item.ticker}`}
                    onClick={onClose}
                    className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-cyan-400/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">[{item.ticker}] {item.officialName}</span>
                      <span className="text-[10px] text-emerald-400 ml-1.5">店名: {item.brandName}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 🔥 言葉で探せる人気スクリーニングチップ群 */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              言葉で選ぶスクリーニング（ワンタップ検索）:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SCREENING_PRESETS.map((preset, idx) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(preset.query);
                      handleSearch(preset.query);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 hover:scale-102 active:scale-95 shadow-sm ${preset.color}`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 店名・コード例のチップ */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[10px] text-gray-500 font-semibold">定番例:</span>
            {BRAND_PRESETS.map((bp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const clean = bp.split(' ')[0];
                  setQuery(clean);
                  handleSearch(clean);
                }}
                className="text-[10px] text-gray-400 hover:text-cyan-300 bg-gray-850 hover:bg-gray-800 px-2 py-0.5 rounded-md border border-gray-800 transition-colors"
              >
                {bp}
              </button>
            ))}
          </div>

        </div>

        {/* Results Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3.5">
          
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-cyan-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white animate-pulse">
                  Geminiが「{query}」に合致する銘柄をAIスクリーニング中...
                </p>
                <p className="text-xs text-gray-400">
                  東証全銘柄から株価帯・出来高急増・材料を高速照合しています
                </p>
              </div>
            </div>
          )}

          {/* 初期表示（まだ検索していない時）の親切なスクリーニング案内 */}
          {!loading && !searched && (
            <div className="py-8 px-4 text-center space-y-4 border border-dashed border-gray-800 rounded-2xl bg-gray-950/40">
              <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  自由な言葉でどんな銘柄でも探せます
                </h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                  上のタグを押すか、入力欄に「低位株」「ここ最近出来高が急増している株」「PBR1倍割れで増配傾向の株」など自由に入力してください。Geminiが条件に合う銘柄を即座にピックアップします。
                </p>
              </div>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <p className="text-sm">該当する銘柄が見つかりませんでした。</p>
              <p className="text-xs text-gray-500">「低位株」「出来高急増」などの人気タグをお試しください。</p>
            </div>
          )}

          {/* 結果一覧 */}
          {!loading && results.map((item, idx) => {
            const isFav = favTickers.includes(item.ticker);
            return (
              <div
                key={idx}
                className="group relative p-4 rounded-2xl bg-gradient-to-r from-[#111827] via-gray-900/90 to-[#111827] border border-gray-800 hover:border-cyan-500/50 hover:bg-gray-850/80 transition-all shadow-lg space-y-2.5"
              >
                {/* 銘柄名 & コード & お気に入り */}
                <div className="flex items-start justify-between gap-2">
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
                    className="flex-1 group/title"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-extrabold flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {item.ticker}
                      </span>
                      <h3 className="font-extrabold text-white text-base group-hover/title:text-cyan-300 transition-colors">
                        {item.name}
                      </h3>
                      <span className="text-[11px] text-gray-400 border border-gray-800 px-2 py-0.5 rounded bg-gray-950">
                        {item.sector}
                      </span>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleWatch(e, item.ticker, item.name, item.sector)}
                      className={`p-2 rounded-xl border transition-all ${
                        isFav 
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-amber-400'
                      }`}
                      title={isFav ? 'ウォッチ解除' : 'ウォッチリストに追加'}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                      一致度 {item.confidenceScore}%
                    </span>
                  </div>
                </div>

                {/* AI選定・スクリーニング根拠 */}
                <div className="p-3 rounded-xl bg-gray-950/80 border border-gray-800/80 space-y-1">
                  <div className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    AIスクリーニング選定理由:
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    {item.relevanceReason}
                  </p>
                </div>

                {/* 特徴タグ & 詳細リンクボタン */}
                <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.representativeProducts?.map((p, pIdx) => (
                      <span key={pIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-gray-800 text-gray-300 font-medium border border-gray-700/50">
                        #{p}
                      </span>
                    ))}
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
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-xs transition-all active:scale-95"
                  >
                    <span>銘柄詳細・開示を見る</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
