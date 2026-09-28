'use client';

import React, { useState } from 'react';
import { 
  X, Bot, Sparkles, Plus, Trash2, RotateCcw, ExternalLink, 
  Check, Settings, ShieldCheck, HelpCircle
} from 'lucide-react';
import { useExternalAiSettings, ExternalAiItem } from '@/lib/useExternalAiSettings';

interface ExternalAiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExternalAiSettingsModal: React.FC<ExternalAiSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    aiList, 
    toggleAi, 
    addCustomAi, 
    removeCustomAi, 
    resetToDefaults 
  } = useExternalAiSettings();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAiName, setNewAiName] = useState('');
  const [newAiUrl, setNewAiUrl] = useState('');
  const [newAiProvider, setNewAiProvider] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAiName.trim()) {
      setError('AIの名前を入力してください');
      return;
    }
    if (!newAiUrl.trim() || !newAiUrl.startsWith('http')) {
      setError('有効なURL（https://...）を入力してください');
      return;
    }

    addCustomAi(newAiName.trim(), newAiUrl.trim(), newAiProvider.trim() || 'カスタム');
    setNewAiName('');
    setNewAiUrl('');
    setNewAiProvider('');
    setError('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-[#111827] border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-cyan-950/50 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景装飾 */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors z-10"
          title="閉じる"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ヘッダー */}
        <div className="flex items-center gap-3 mb-4 shrink-0 pr-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-inner shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>銘柄ページの外部AIボタン設定</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                自由に追加・解除
              </span>
            </h2>
            <p className="text-[11px] text-gray-400">
              検索した銘柄ページに表示するAI連携ボタンをカスタマイズできます。
            </p>
          </div>
        </div>

        {/* スクロールエリア */}
        <div className="overflow-y-auto space-y-2.5 pr-1 flex-1 text-xs">
          <p className="text-[11px] text-gray-400 bg-gray-900/60 p-2.5 rounded-xl border border-gray-800 leading-relaxed">
            💡 ボタンを押すと銘柄の分析質問文が自動でコピーされ、各AIアプリ・Web画面が開きます。
          </p>

          {/* AIリスト */}
          <div className="space-y-2">
            {aiList.map((ai) => {
              return (
                <div
                  key={ai.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    ai.enabled 
                      ? 'bg-gray-900/80 border-cyan-500/30 shadow-md' 
                      : 'bg-gray-950/60 border-gray-800/80 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* アイコン風バッジ */}
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${ai.bgGradient} flex items-center justify-center text-white font-extrabold text-xs shadow shrink-0 border ${ai.borderClass}`}>
                      {ai.name.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-xs truncate">{ai.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-800 text-gray-300 font-mono">
                          {ai.provider}
                        </span>
                        {ai.isCustom && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            カスタム
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {ai.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* カスタムAI削除ボタン */}
                    {ai.isCustom && (
                      <button
                        onClick={() => removeCustomAi(ai.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="このAIを削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* 有効・無効スイッチ（トグル） */}
                    <button
                      type="button"
                      onClick={() => toggleAi(ai.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        ai.enabled ? 'bg-cyan-500' : 'bg-gray-800'
                      }`}
                      title={ai.enabled ? '銘柄ページから外す' : '銘柄ページに追加する'}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          ai.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 新しいAIの追加フォーム */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 px-3 rounded-2xl border border-dashed border-gray-700 hover:border-cyan-500/50 hover:bg-cyan-500/5 text-gray-300 hover:text-cyan-300 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>お好みのAI（Genspark, NotebookLMなど）を新規追加</span>
            </button>
          ) : (
            <form onSubmit={handleAddSubmit} className="p-3.5 rounded-2xl bg-gray-900 border border-purple-500/40 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  新しいAIアシスタントを追加
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-500 hover:text-gray-300 text-xs"
                >
                  キャンセル
                </button>
              </div>

              {error && (
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 text-[11px]">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">AIの表示名</label>
                  <input
                    type="text"
                    value={newAiName}
                    onChange={(e) => setNewAiName(e.target.value)}
                    placeholder="例: Genspark"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-white text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">提供元・タグ</label>
                  <input
                    type="text"
                    value={newAiProvider}
                    onChange={(e) => setNewAiProvider(e.target.value)}
                    placeholder="例: MainFunc"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-white text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">アクセスURL (Web/アプリ)</label>
                <input
                  type="url"
                  value={newAiUrl}
                  onChange={(e) => setNewAiUrl(e.target.value)}
                  placeholder="https://www.genspark.ai/"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-white text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-md active:scale-95"
              >
                銘柄ページに追加する
              </button>
            </form>
          )}

          {/* デフォルトに戻す */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={resetToDefaults}
              className="text-[11px] text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>標準のAI設定に戻す</span>
            </button>
          </div>
        </div>

        {/* フッター */}
        <div className="pt-3 border-t border-gray-800/80 mt-3 shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
          >
            設定を完了して閉じる
          </button>
        </div>

      </div>
    </div>
  );
};
