import React, { useState, useEffect } from 'react';
import { Bot, Send, User, X, Loader2, Sparkles, RefreshCw, Key, Check, HelpCircle, Zap } from 'lucide-react';
import { getStoredApiKey } from '@/lib/apiKeyStorage';
import { ApiKeyModal } from './ApiKeyModal';

interface GeminiChatModalProps {
  contextTitle: string;
  contextContent?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const PRESET_QUESTIONS = [
  'この会社への影響は？',
  '業績への影響は？',
  '提携相手はどんな会社？',
  '過去に似た事例は？',
  'ニュースを初心者向けに超わかりやすく説明して',
  '留意すべきリスクや落とし穴は？',
  '自社株買いや株主還元はどう評価できる？'
];

export const GeminiChatModal: React.FC<GeminiChatModalProps> = ({
  contextTitle,
  contextContent,
  isOpen,
  onClose
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = async (questionText?: string) => {
    const query = questionText || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyForApi = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(apiKey.trim() ? { 'x-gemini-api-key': apiKey.trim() } : {})
        },
        body: JSON.stringify({
          contextTitle,
          contextContent: contextContent || contextTitle,
          userQuestion: query,
          history: historyForApi,
          apiKey: apiKey.trim() || undefined
        })
      });

      const data = await res.json();
      const botReply: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.reply || '回答の生成中にエラーが発生しました。'
      };

      setMessages(prev => [...prev, botReply]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: 'エラーが発生しました。時間を置いて再度お試しください。'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#111827] border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-500/20 overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#0B0F19]/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-400">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  {apiKey.trim() ? 'Gemini 1.5 Flash (APIキー連携中)' : 'AIアナリスト思考エンジン稼働中'}
                </span>
                <span className="text-xs text-gray-400">リアルタイム株式対話</span>
              </div>
              <h2 className="text-sm font-bold text-white mt-1 line-clamp-1">
                {contextTitle}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className={`p-2 rounded-xl transition-all border text-xs flex items-center gap-1.5 font-bold ${
                apiKey.trim() 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20' 
                  : 'bg-gradient-to-r from-purple-950/60 to-pink-950/60 border-purple-500/40 text-purple-300 hover:border-purple-400'
              }`}
              title="Gemini APIキー設定（超かんたん3ステップ）"
            >
              {apiKey.trim() ? <Zap className="w-3.5 h-3.5 text-emerald-400" /> : <Key className="w-3.5 h-3.5 text-purple-400" />}
              <span className="hidden sm:inline">{apiKey.trim() ? 'AI無料枠 有効' : '無料キー設定'}</span>
            </button>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                title="会話履歴をクリア"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preset Questions Chips Area */}
        <div className="px-6 py-3 bg-gray-900/60 border-b border-gray-800">
          <p className="text-[11px] font-semibold text-gray-400 mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            ワンタップで質問する（質問ごとに異なる具体的分析を回答）:
          </p>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {PRESET_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-gray-800/90 hover:bg-cyan-950 hover:border-cyan-500/50 border border-gray-700/80 text-xs text-cyan-200 transition-all disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages Scroll Container */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-950/50">
          {messages.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center text-gray-400 gap-3">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-gray-200">
                このニュースや開示情報について何でもGeminiに質問できます
              </p>
              <p className="text-xs text-gray-400 max-w-sm">
                上のプリセットボタンをタップするか、下の入力欄に質問を入力してください。
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-600/30 border border-emerald-500/40 text-emerald-100 rounded-tr-none'
                    : 'bg-gray-900 border border-gray-800 text-gray-100 rounded-tl-none whitespace-pre-line shadow-md'
                }`}
              >
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-900 border border-gray-800 text-xs text-cyan-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Geminiが分析回答を生成中...
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-gray-900 border-t border-gray-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="質問を入力 (例: 「同業他社との優位性は？」)"
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#0B0F19] border border-gray-700 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-cyan-500 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-bold text-xs hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              送信
            </button>
          </form>
        </div>

      </div>

      {/* 🔑 APIキー設定モーダル */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => {
          setIsApiKeyModalOpen(false);
          setApiKey(getStoredApiKey());
        }}
        onSuccess={() => {
          setApiKey(getStoredApiKey());
        }}
      />
    </div>
  );
};
