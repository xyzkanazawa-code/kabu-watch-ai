'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Bot, 
  X, 
  Copy, 
  Check, 
  Calendar, 
  Clock, 
  ExternalLink, 
  FileText, 
  ChevronRight,
  User
} from 'lucide-react';
import { StockAiNote, AiType, formatDateTimeJP } from '@/lib/stockAiNotesStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  stockName: string;
  notes: StockAiNote[];
}

const AI_OPTIONS_MAP: Record<AiType, { name: string; gradient: string; border: string; text: string; iconColor: string }> = {
  gemini: {
    name: 'Gemini',
    gradient: 'from-blue-600 via-indigo-600 to-cyan-500',
    border: 'border-cyan-500/40',
    text: 'text-cyan-300',
    iconColor: 'text-cyan-400',
  },
  chatgpt: {
    name: 'ChatGPT',
    gradient: 'from-emerald-600 to-teal-700',
    border: 'border-emerald-500/40',
    text: 'text-emerald-300',
    iconColor: 'text-emerald-400',
  },
  claude: {
    name: 'Claude',
    gradient: 'from-amber-600 to-orange-700',
    border: 'border-amber-500/40',
    text: 'text-amber-300',
    iconColor: 'text-amber-400',
  },
  perplexity: {
    name: 'Perplexity',
    gradient: 'from-teal-600 to-cyan-700',
    border: 'border-teal-500/40',
    text: 'text-teal-300',
    iconColor: 'text-teal-400',
  },
  deepseek: {
    name: 'DeepSeek',
    gradient: 'from-blue-700 to-sky-600',
    border: 'border-sky-500/40',
    text: 'text-sky-300',
    iconColor: 'text-sky-400',
  },
  other: {
    name: '外部AIメモ',
    gradient: 'from-purple-600 to-pink-600',
    border: 'border-purple-500/40',
    text: 'text-purple-300',
    iconColor: 'text-purple-400',
  },
};

export const WatchlistAiNoteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  ticker,
  stockName,
  notes,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentNote = notes[selectedIndex] || notes[0];
  const aiConfig = currentNote ? (AI_OPTIONS_MAP[currentNote.aiType] || AI_OPTIONS_MAP.other) : AI_OPTIONS_MAP.gemini;

  const handleCopy = () => {
    if (!currentNote) return;
    navigator.clipboard.writeText(`${currentNote.title}\n\n${currentNote.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderFormattedLine = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-white font-black bg-cyan-950/40 px-1 py-0.5 rounded">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-[#0f172a] border border-cyan-500/40 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-ai-glow-pulse"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="p-4 sm:p-5 border-b border-gray-800 bg-gradient-to-r from-gray-900 via-[#131f37] to-gray-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {ticker}
                </span>
                <span className="text-xs text-gray-400 font-semibold">
                  登録されたAI見解
                </span>
                {notes.length > 1 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                    全{notes.length}件
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-white mt-0.5 truncate max-w-xs sm:max-w-md">
                {stockName}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 複数見解がある場合のタブバー */}
        {notes.length > 1 && (
          <div className="px-4 py-2 border-b border-gray-800/80 bg-gray-950/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {notes.map((note, idx) => {
              const active = idx === selectedIndex;
              const conf = AI_OPTIONS_MAP[note.aiType] || AI_OPTIONS_MAP.other;
              return (
                <button
                  key={note.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20 font-black'
                      : 'bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>{note.title}</span>
                  <span className={`text-[10px] ${active ? 'text-black/70' : 'text-gray-500'}`}>
                    {new Date(note.createdAt).getMonth() + 1}/{new Date(note.createdAt).getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 見解本文エリア */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {currentNote ? (
            <div className="space-y-4">
              {/* メタ情報バー */}
              <div className="p-3 rounded-2xl bg-gray-900/80 border border-gray-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black bg-gradient-to-r ${aiConfig.gradient} text-white shadow-sm flex items-center gap-1`}>
                    <Bot className="w-3 h-3" />
                    {aiConfig.name}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {currentNote.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    {formatDateTimeJP(currentNote.createdAt)}
                  </span>
                  {currentNote.authorName && (
                    <span className="flex items-center gap-1 text-gray-400">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      {currentNote.authorName}
                    </span>
                  )}
                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all flex items-center gap-1 font-bold text-xs cursor-pointer border border-gray-700"
                    title="見解をコピー"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">コピー済</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>コピー</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 見解の長文テキスト */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f1d] border border-gray-800/80 text-gray-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap select-text space-y-2">
                {currentNote.content.split('\n').map((line, idx) => {
                  const trimmed = line.trim();
                  if (!trimmed) return <div key={idx} className="h-2" />;
                  if (trimmed.startsWith('#')) {
                    const clean = trimmed.replace(/^#+\s*/, '');
                    return (
                      <div key={idx} className="font-extrabold text-cyan-300 text-sm sm:text-base border-b border-gray-800 pb-1 pt-2">
                        {clean}
                      </div>
                    );
                  }
                  if (trimmed.startsWith('- ') || trimmed.startsWith('・') || trimmed.startsWith('* ')) {
                    const clean = trimmed.replace(/^[-・*]\s*/, '');
                    return (
                      <div key={idx} className="flex items-start gap-2 pl-2">
                        <span className="text-cyan-400 mt-1 text-xs">◆</span>
                        <div className="flex-1">{renderFormattedLine(clean)}</div>
                      </div>
                    );
                  }
                  return <div key={idx}>{renderFormattedLine(line)}</div>;
                })}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <FileText className="w-10 h-10 text-gray-600 mx-auto" />
              <p className="text-sm">見解データが見つかりませんでした。</p>
            </div>
          )}
        </div>

        {/* フッターアクションバー */}
        <div className="p-4 border-t border-gray-800 bg-[#0c1324] flex items-center justify-between gap-3">
          <Link
            href={`/stocks/${ticker}`}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-200 hover:text-white border border-gray-700 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>銘柄詳細・AI見解追加へ</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </Link>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-black text-xs transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
