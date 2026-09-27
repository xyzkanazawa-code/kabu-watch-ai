'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addPortfolioItem, getDefaultMarginExpiryDate } from '@/lib/portfolioStorage';
import { STOCK_MASTER } from '@/lib/dataFetcher';
import { normalizeStockInput, BRAND_TO_STOCK_MAP, lookupStockByTicker, extractTickerCode } from '@/lib/stockLookup';
import { 
  ShoppingCart, X, Check, TrendingUp, Calendar, AlertCircle, 
  HelpCircle, ArrowRight, ShieldCheck, Sparkles, Building2
} from 'lucide-react';

interface BuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker?: string;
  stockName?: string;
  currentPrice?: number;
  newsTitle?: string;
  initialType?: 'simulation' | 'real';
}

export const BuyModal: React.FC<BuyModalProps> = ({
  isOpen,
  onClose,
  ticker: initialTicker = '7203',
  stockName: initialStockName,
  currentPrice: initialCurrentPrice,
  newsTitle,
  initialType = 'simulation',
}) => {
  const router = useRouter();

  const [ticker, setTicker] = useState(initialTicker);
  const [stockName, setStockName] = useState(initialStockName || '');
  const [type, setType] = useState<'simulation' | 'real'>(initialType);
  const [tradeType, setTradeType] = useState<'spot' | 'margin_buy' | 'margin_sell'>('spot');
  const [shares, setShares] = useState<number>(100);
  const [entryPrice, setEntryPrice] = useState<number>(initialCurrentPrice || 2785.5);
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState<string>(getDefaultMarginExpiryDate());
  const [notes, setNotes] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  // 初期値の同期
  useEffect(() => {
    if (isOpen) {
      if (initialType) {
        setType(initialType);
      }
      if (initialTicker) {
        setTicker(initialTicker);
        const master = STOCK_MASTER[initialTicker];
        setStockName(initialStockName || master?.name || `銘柄 (${initialTicker})`);
        setEntryPrice(initialCurrentPrice || master?.price || 2000);
      }
      if (newsTitle) {
        setNotes(`【着目材料】${newsTitle}`);
      } else {
        setNotes('');
      }
      setIsSuccess(false);
    }
  }, [initialTicker, initialStockName, initialCurrentPrice, newsTitle, initialType, isOpen]);

  // 取引区分変更時に期日を自動算出
  const handleTradeTypeChange = (newTradeType: 'spot' | 'margin_buy' | 'margin_sell') => {
    setTradeType(newTradeType);
    if (newTradeType !== 'spot' && !expiryDate) {
      setExpiryDate(getDefaultMarginExpiryDate(entryDate));
    }
  };

  const handleTickerChange = async (rawTicker: string) => {
    // 全角数字・英字を半角数字・小文字に即時矯正
    const normalized = normalizeStockInput(rawTicker);
    setTicker(normalized);

    // 1. もし店舗名・ブランド名（ユニクロ、ドンキ等）が入力された場合
    if (BRAND_TO_STOCK_MAP[normalized]) {
      const brand = BRAND_TO_STOCK_MAP[normalized];
      setTicker(brand.ticker);
      setStockName(brand.officialName);
      const master = STOCK_MASTER[brand.ticker];
      if (master) setEntryPrice(master.price);
      return;
    }

    // 2. 証券コード（数字4桁 または 186A等の英字混在コード）の場合
    const tickerCode = extractTickerCode(normalized);
    if (tickerCode) {
      setTicker(tickerCode);
      const master = STOCK_MASTER[tickerCode];
      if (master) {
        setStockName(master.name);
        setEntryPrice(master.price);
      } else {
        // マスターにない場合もオンラインルックアップ
        const fetched = await lookupStockByTicker(tickerCode);
        setStockName(fetched.name);
        setEntryPrice(fetched.price);
      }
    }
  };

  const handleSharesChange = (delta: number) => {
    setShares((prev) => Math.max(1, prev + delta));
  };

  const totalCost = Math.round(shares * entryPrice);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addPortfolioItem({
      ticker: ticker.trim() || '7203',
      name: stockName || `銘柄 (${ticker})`,
      type,
      tradeType,
      shares: Math.max(1, shares),
      entryPrice: Math.max(0.1, entryPrice),
      entryDate,
      expiryDate: tradeType === 'spot' ? undefined : expiryDate,
      notes,
    });

    setIsSuccess(true);
    setTimeout(() => {
      // 成功後少し待って閉じるか、そのままポートフォリオへ誘導
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className={`relative w-full max-w-lg bg-[#111827] border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all duration-300 ${
        type === 'real'
          ? 'border-purple-500/50 shadow-purple-500/20'
          : 'border-cyan-500/50 shadow-cyan-500/20'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#0B0F19]/90">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border transition-all ${
              type === 'real'
                ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-500/40 text-purple-400'
                : 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border-cyan-500/40 text-cyan-400'
            }`}>
              {type === 'real' ? <ShieldCheck className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded border ${
                  type === 'real'
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                }`}>
                  {ticker || '未選択'}
                </span>
                <span className="text-xs text-gray-300 font-bold">{stockName || '銘柄名'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  type === 'real'
                    ? 'bg-purple-950 text-purple-300 border-purple-600/40'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-600/40'
                }`}>
                  {type === 'real' ? '実保有株' : '仮想トレード'}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                {type === 'real' ? '🏦 実際の保有株を登録' : '🧪 仮想売買（シミュレーション）'}
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

        {/* Content */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-xl font-bold text-white">
              {type === 'simulation' ? '仮想ポジションを追加しました！' : '実保有銘柄を登録しました！'}
            </h3>
            <p className="text-xs text-gray-300">
              最新終値ベースの評価損益・信用期日カウントダウンを自動開始します。
            </p>
            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:text-white text-xs font-bold transition-all"
              >
                閉じる
              </button>
              <button
                onClick={() => {
                  onClose();
                  router.push('/portfolio');
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
              >
                ポートフォリオを見る <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
            
            {/* 0. 銘柄コード & 社名 入力 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                <span>対象銘柄（証券コード・社名）</span>
                <span className="text-[11px] text-gray-500">直接入力または選択</span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-2">
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => handleTickerChange(e.target.value)}
                    placeholder="例: 7203"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm font-bold text-white font-mono focus:outline-none focus:border-cyan-500 uppercase"
                    required
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    value={stockName}
                    onChange={(e) => setStockName(e.target.value)}
                    placeholder="銘柄名 (例: トヨタ自動車)"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm font-bold text-gray-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              {/* 銘柄クイック選択チップ */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['7203 トヨタ', '186A アストロスケール', '6920 レーザーテック', '7011 三菱重工', '9983 ユニクロ'].map((item) => {
                  const code = item.split(' ')[0];
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleTickerChange(code)}
                      className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all ${
                        ticker === code
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1. 種別選択タブ: 仮想検証 or 実保有 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                <span>登録区分</span>
                <span className="text-[11px] text-gray-500">目的に合わせて切り替え可能</span>
              </label>
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-950 rounded-xl border border-gray-800">
                <button
                  type="button"
                  onClick={() => setType('real')}
                  className={`p-2.5 rounded-lg transition-all text-left flex flex-col gap-0.5 ${
                    type === 'real'
                      ? 'bg-purple-600/20 border border-purple-500/50 text-purple-200 shadow-lg shadow-purple-500/10'
                      : 'border border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-900/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <ShieldCheck className={`w-3.5 h-3.5 ${type === 'real' ? 'text-purple-400' : 'text-gray-500'}`} />
                    <span>🏦 実際に保有している株</span>
                  </div>
                  <span className="text-[10px] text-gray-400 pl-5">実資産・ポートフォリオ管理</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('simulation')}
                  className={`p-2.5 rounded-lg transition-all text-left flex flex-col gap-0.5 ${
                    type === 'simulation'
                      ? 'bg-cyan-600/20 border border-cyan-500/50 text-cyan-200 shadow-lg shadow-cyan-500/10'
                      : 'border border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-900/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Sparkles className={`w-3.5 h-3.5 ${type === 'simulation' ? 'text-cyan-400' : 'text-gray-500'}`} />
                    <span>🧪 仮想売買（シミュレーション）</span>
                  </div>
                  <span className="text-[10px] text-gray-400 pl-5">ノーリスク練習・材料検証</span>
                </button>
              </div>
            </div>

            {/* 2. 取引区分: 現物 / 信用買 / 信用売 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">取引区分</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleTradeTypeChange('spot')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    tradeType === 'spot'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  現物
                </button>
                <button
                  type="button"
                  onClick={() => handleTradeTypeChange('margin_buy')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    tradeType === 'margin_buy'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  信用買い (制度6ヶ月)
                </button>
                <button
                  type="button"
                  onClick={() => handleTradeTypeChange('margin_sell')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    tradeType === 'margin_sell'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  信用売り (空売り)
                </button>
              </div>
            </div>

            {/* 3. 株数 & 購入単価 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* 株数 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                  <span>保有株数</span>
                  <span className="text-[11px] text-gray-500 font-mono">1株単位で入力可</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSharesChange(-100)}
                    className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-300 hover:bg-gray-800 font-bold active:scale-95 transition-all"
                  >
                    -100
                  </button>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={shares === 0 ? '' : shares}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                      setShares(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    onBlur={() => {
                      if (shares <= 0) setShares(100);
                    }}
                    placeholder="100"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-center text-sm font-bold text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleSharesChange(100)}
                    className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-300 hover:bg-gray-800 font-bold active:scale-95 transition-all"
                  >
                    +100
                  </button>
                </div>
                {/* クイック株数ボタン */}
                <div className="flex items-center gap-1 pt-1">
                  {[1, 100, 200, 500, 1000].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setShares(num)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                        shares === num
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {num}株
                    </button>
                  ))}
                </div>
              </div>

              {/* 購入単価 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                  <span>購入単価 (円)</span>
                  <span className="text-[11px] text-cyan-400 font-mono">現在値自動セット</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min={0.1}
                    value={entryPrice === 0 ? '' : entryPrice}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setEntryPrice(isNaN(val) ? 0 : val);
                    }}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-right pr-8 text-sm font-bold text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-500">円</span>
                </div>
              </div>

            </div>

            {/* 4. 約定日 & 信用期日 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" /> 購入日 / 約定日
                </label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => {
                    setEntryDate(e.target.value);
                    if (tradeType !== 'spot') {
                      setExpiryDate(getDefaultMarginExpiryDate(e.target.value));
                    }
                  }}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {tradeType !== 'spot' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> 信用期日 (6ヶ月後)
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-gray-950 border border-amber-500/40 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}
            </div>

            {/* 5. メモ欄 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">メモ・購入理由（任意）</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="「〇〇の業務提携開示を見て買い付け」「決算好調で信用買い」など"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-gray-200 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            {/* 合計概算バー */}
            <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-500 block">想定約定代金（概算）</span>
                <span className="text-xs font-semibold text-gray-400">
                  {shares}株 × ¥{entryPrice.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-white font-mono">
                  ¥{totalCost.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 送信ボタン */}
            <div className="pt-2">
              <button
                type="submit"
                className={`w-full py-3.5 rounded-xl font-extrabold text-sm hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg ${
                  type === 'real'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/25 border border-purple-400/30'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black shadow-emerald-500/20'
                }`}
              >
                {type === 'real' ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    実保有株としてポートフォリオに登録
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    仮想トレードを追加（シミュレーション開始）
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
