'use client';

import React, { useState, useEffect } from 'react';
import { 
  getStoredApiKey, setStoredApiKey, removeStoredApiKey, validateApiKey 
} from '@/lib/apiKeyStorage';
import { 
  KeyRound, ExternalLink, CheckCircle2, AlertCircle, 
  ClipboardCopy, X, Eye, EyeOff, ShieldCheck, Sparkles, 
  Trash2, RefreshCw, Zap, ArrowRight, HelpCircle
} from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // 初期化：保存されているキーがあれば読み込む
  useEffect(() => {
    if (isOpen) {
      const stored = getStoredApiKey();
      setApiKey(stored);
      setHasSavedKey(!!stored);
      setTestResult(stored ? { valid: true, message: '現在このキーが有効です（無料枠消費）' } : null);
      setShowKey(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // クリップボードから1タップで自動貼り付け
  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const trimmed = text.trim();
          setApiKey(trimmed);
          setActiveStep(3);
          // 自動でテスト実行
          handleTestAndSave(trimmed);
        } else {
          alert('クリップボードにキーがありません。先にGoogle AI Studioでキーをコピーしてください。');
        }
      } else {
        alert('下の入力枠に直接貼り付け（ペースト）してください。');
      }
    } catch (e) {
      console.warn('Clipboard read failed:', e);
      alert('ブラウザのセキュリティ設定により自動貼り付けがブロックされました。下の入力枠に直接貼り付けてください。');
    }
  };

  // 接続テスト & 保存
  const handleTestAndSave = async (keyToTest?: string) => {
    const key = (keyToTest || apiKey).trim();
    if (!key) {
      setTestResult({ valid: false, message: 'APIキーを入力してください。' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await validateApiKey(key);
    setIsTesting(false);

    if (result.valid) {
      setStoredApiKey(key);
      setHasSavedKey(true);
      setTestResult({
        valid: true,
        message: `接続成功！${result.modelName || 'Gemini 1.5 Flash'} が有効化されました。`,
      });
      if (onSuccess) onSuccess();
    } else {
      setTestResult({
        valid: false,
        message: result.error || 'キーの認証に失敗しました。正しいキーかご確認ください。',
      });
    }
  };

  // キーの削除
  const handleDeleteKey = () => {
    if (confirm('登録済みのAPIキーを削除しますか？\n（削除後はAI要約の即時解析ができなくなります）')) {
      removeStoredApiKey();
      setApiKey('');
      setHasSavedKey(false);
      setTestResult(null);
      setActiveStep(1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#111827] border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-500/20 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#0B0F19]/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  完全無料・毎月0円
                </span>
                <span className="text-xs text-gray-400 font-bold">Google公式枠利用 (BYOK)</span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                Gemini APIキーの超かんたん設定
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* 説明バナー */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/30 border border-cyan-500/30 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs sm:text-sm">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>なぜAPIキーが必要なの？</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Googleアカウントをお持ちなら、誰でも**1日1,500回まで無料**でGemini AIを使えます。
              あなた専用の無料キーを登録することで、**利用料0円のまま無制限にニュース深掘り質問やAIポートフォリオ診断**ができるようになります！
            </p>
            <div className="text-[11px] text-gray-400 flex items-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>キーはあなたの端末（ブラウザ）内にのみ安全に保存され、外部に送信されません。</span>
            </div>
          </div>

          {/* 3ステップ ナビゲーション */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>小学生でもできる！3ステップ設定ガイド</span>
            </h3>

            {/* STEP 1 */}
            <div className={`p-4 rounded-2xl border transition-all ${
              hasSavedKey ? 'bg-gray-900/40 border-gray-800' : 'bg-gray-900 border-cyan-500/40 shadow-lg shadow-cyan-500/5'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-300 font-mono font-extrabold text-xs flex items-center justify-center border border-cyan-500/40 shrink-0">
                    1
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">Googleで無料キーをもらう</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      下のボタンを押すと、Googleの公式画面が別タブで開きます。
                    </p>
                  </div>
                </div>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setActiveStep(2)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 shrink-0 transition-all active:scale-95"
                >
                  <span>Google AI Studioを開く</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* STEP 2 */}
            <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300 font-mono font-extrabold text-xs flex items-center justify-center border border-purple-500/40 shrink-0">
                  2
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white">「APIキーを作成」を押してコピー</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    開いた画面にある青いボタン <strong className="text-cyan-300">「APIキーを作成（Create API Key）」</strong> を押し、表示された文字を <strong className="text-emerald-300">「コピー」</strong> します。
                  </p>
                </div>
              </div>
            </div>

            {/* STEP 3 */}
            <div className="p-4 rounded-2xl bg-gray-900 border border-emerald-500/40 shadow-lg shadow-emerald-500/5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono font-extrabold text-xs flex items-center justify-center border border-emerald-500/40 shrink-0">
                    3
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">ここに貼り付けるだけ！</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      コピーしたら、下の「自動貼り付け」ボタンを押してください。
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                >
                  <ClipboardCopy className="w-3.5 h-3.5" />
                  <span>📋 自動貼り付け</span>
                </button>
              </div>

              {/* APIキー入力フィールド */}
              <div className="space-y-1.5 pt-1">
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="AQ.Ab8... または AIzaSy..."
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2.5 pr-20 text-xs sm:text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white"
                      title={showKey ? '隠す' : '表示'}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 接続テスト結果メッセージ */}
              {testResult && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 animate-fadeIn ${
                  testResult.valid
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                }`}>
                  {testResult.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-800 bg-[#0B0F19] flex items-center justify-between gap-3">
          {hasSavedKey ? (
            <button
              type="button"
              onClick={handleDeleteKey}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold p-2 rounded-lg hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>キーを削除する</span>
            </button>
          ) : (
            <div className="text-[11px] text-gray-500">
              ※ キーはいつでも変更・削除できます
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-all"
            >
              閉じる
            </button>
            <button
              type="button"
              disabled={isTesting || !apiKey.trim()}
              onClick={() => handleTestAndSave()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 disabled:opacity-50 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>接続テスト中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>保存してAI機能を有効化</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
