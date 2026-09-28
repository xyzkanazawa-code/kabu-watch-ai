'use client';

import { useState, useEffect } from 'react';

export interface ExternalAiItem {
  id: string;
  name: string;
  provider: string;
  url: string;
  urlWithPrompt?: (prompt: string) => string;
  bgGradient: string;
  textColor: string;
  borderClass: string;
  enabled: boolean;
  isCustom?: boolean;
  description: string;
}

export const DEFAULT_AI_ASSISTANTS: ExternalAiItem[] = [
  {
    id: 'gemini',
    name: 'Gemini',
    provider: 'Google',
    url: 'https://gemini.google.com/app',
    bgGradient: 'from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500',
    textColor: 'text-white',
    borderClass: 'border-cyan-400/40',
    enabled: true,
    description: 'Google公式AI。直近決算・世界シェアの深掘りに最適'
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    provider: 'OpenAI',
    url: 'https://chatgpt.com/',
    urlWithPrompt: (prompt: string) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
    bgGradient: 'from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600',
    textColor: 'text-white',
    borderClass: 'border-emerald-400/40',
    enabled: true,
    description: 'OpenAI製。多角的な事業分析・シナリオ予測に'
  },
  {
    id: 'claude',
    name: 'Claude',
    provider: 'Anthropic',
    url: 'https://claude.ai/new',
    bgGradient: 'from-amber-700 to-orange-800 hover:from-amber-600 hover:to-orange-700',
    textColor: 'text-white',
    borderClass: 'border-amber-400/40',
    enabled: false,
    description: 'Anthropic製。決算短信や財務数値の論理的分析に優れる'
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    provider: 'Perplexity',
    url: 'https://www.perplexity.ai/',
    urlWithPrompt: (prompt: string) => `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`,
    bgGradient: 'from-cyan-700 to-blue-800 hover:from-cyan-600 hover:to-blue-700',
    textColor: 'text-white',
    borderClass: 'border-cyan-400/40',
    enabled: true,
    description: 'リアルタイム検索特化。最新の報道・アナリスト評価を即調査'
  },
  {
    id: 'copilot',
    name: 'Copilot',
    provider: 'Microsoft',
    url: 'https://copilot.microsoft.com/',
    bgGradient: 'from-sky-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600',
    textColor: 'text-white',
    borderClass: 'border-sky-400/40',
    enabled: false,
    description: 'Microsoft製。Windows端末やEdgeとの連携に快適'
  },
  {
    id: 'grok',
    name: 'Grok',
    provider: 'xAI',
    url: 'https://x.com/i/grok',
    bgGradient: 'from-gray-800 to-zinc-900 hover:from-gray-700 hover:to-zinc-800',
    textColor: 'text-white',
    borderClass: 'border-gray-500/40',
    enabled: false,
    description: 'xAI製。X（Twitter）のリアルタイム投資家センチメント・噂に即応'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    provider: 'DeepSeek',
    url: 'https://chat.deepseek.com/',
    bgGradient: 'from-blue-700 to-cyan-800 hover:from-blue-600 hover:to-cyan-700',
    textColor: 'text-white',
    borderClass: 'border-blue-400/40',
    enabled: false,
    description: '高度推論モデル。詳細な財務計算や技術優位性の検証に'
  }
];

const STORAGE_KEY = 'kabu_watch_external_ai_settings_v1';

export function useExternalAiSettings() {
  const [aiList, setAiList] = useState<ExternalAiItem[]>(DEFAULT_AI_ASSISTANTS);
  const [isLoaded, setIsLoaded] = useState(false);

  // 初回ロード
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ExternalAiItem[];
        // デフォルトとマージして新しいAI項目が追加されても欠落しないようにする
        const merged: ExternalAiItem[] = [...DEFAULT_AI_ASSISTANTS];
        parsed.forEach((item) => {
          const idx = merged.findIndex((m) => m.id === item.id);
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], enabled: item.enabled };
          } else if (item.isCustom) {
            merged.push(item);
          }
        });
        setAiList(merged);
      }
    } catch (e) {
      console.error('Failed to load AI settings', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 保存ヘルパー
  const saveAiList = (newList: ExternalAiItem[]) => {
    setAiList(newList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to save AI settings', e);
    }
  };

  // 表示のON / OFF（外す・追加する）切り替え
  const toggleAi = (id: string) => {
    const updated = aiList.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    saveAiList(updated);
  };

  // カスタムAIの新規追加
  const addCustomAi = (name: string, url: string, provider = 'カスタムAI') => {
    const id = `custom_${Date.now()}`;
    const newAi: ExternalAiItem = {
      id,
      name,
      provider,
      url,
      bgGradient: 'from-violet-700 to-purple-900 hover:from-violet-600 hover:to-purple-800',
      textColor: 'text-white',
      borderClass: 'border-purple-400/40',
      enabled: true,
      isCustom: true,
      description: 'ユーザー追加の外部AIアシスタント'
    };
    saveAiList([...aiList, newAi]);
  };

  // カスタムAIの削除
  const removeCustomAi = (id: string) => {
    const updated = aiList.filter((item) => item.id !== id);
    saveAiList(updated);
  };

  // 初期設定に戻す
  const resetToDefaults = () => {
    saveAiList(DEFAULT_AI_ASSISTANTS);
  };

  return {
    aiList,
    enabledAiList: aiList.filter((item) => item.enabled),
    isLoaded,
    toggleAi,
    addCustomAi,
    removeCustomAi,
    resetToDefaults
  };
}
