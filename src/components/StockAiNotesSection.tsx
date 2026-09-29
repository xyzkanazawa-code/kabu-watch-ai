'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Bot, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  ClipboardPaste, 
  Clock, 
  Calendar,
  Users,
  Globe,
  ExternalLink,
  MessageSquareText,
  FileText,
  CheckCircle2,
  X,
  Loader2
} from 'lucide-react';
import { 
  StockAiNote, 
  AiType, 
  getLocalStockAiNotes,
  fetchSharedStockAiNotes,
  addSharedStockAiNote,
  deleteSharedStockAiNote,
  getAiDefaultName,
  formatDateJP,
  formatDateTimeJP,
  formatShortDate
} from '@/lib/stockAiNotesStorage';
import { useAuth } from '@/lib/useAuth';

interface Props {
  ticker: string;
  stockName: string;
}

const AI_OPTIONS: { id: AiType; name: string; gradient: string; border: string; text: string; iconColor: string }[] = [
  {
    id: 'gemini',
    name: 'Gemini',
    gradient: 'from-blue-600 via-indigo-600 to-cyan-500',
    border: 'border-cyan-500/40',
    text: 'text-cyan-300',
    iconColor: 'text-cyan-400',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    gradient: 'from-emerald-600 to-teal-700',
    border: 'border-emerald-500/40',
    text: 'text-emerald-300',
    iconColor: 'text-emerald-400',
  },
  {
    id: 'claude',
    name: 'Claude',
    gradient: 'from-amber-600 to-orange-700',
    border: 'border-amber-500/40',
    text: 'text-amber-300',
    iconColor: 'text-amber-400',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    gradient: 'from-teal-600 to-cyan-700',
    border: 'border-teal-500/40',
    text: 'text-teal-300',
    iconColor: 'text-teal-400',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    gradient: 'from-blue-700 to-sky-600',
    border: 'border-sky-500/40',
    text: 'text-sky-300',
    iconColor: 'text-sky-400',
  },
  {
    id: 'other',
    name: 'その他メモ',
    gradient: 'from-purple-600 to-pink-600',
    border: 'border-purple-500/40',
    text: 'text-purple-300',
    iconColor: 'text-purple-400',
  },
];

// 長文AI回答を見やすくレンダリングするフォーマッタ
const FormattedAiContent: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');

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
    <div className="space-y-2 font-sans select-text">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        // 大見出し # 
        if (trimmed.startsWith('# ')) {
          return (
            <h3 key={idx} className="text-base sm:text-lg font-black text-cyan-300 pt-3 pb-1 border-b border-cyan-500/30 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              {renderFormattedLine(trimmed.replace(/^#\s+/, ''))}
            </h3>
          );
        }

        // 中見出し ## 
        if (trimmed.startsWith('## ')) {
          return (
            <h4 key={idx} className="text-sm sm:text-base font-bold text-white pt-2.5 pb-0.5 text-cyan-100 flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-cyan-400 rounded-full shrink-0" />
              {renderFormattedLine(trimmed.replace(/^##\s+/, ''))}
            </h4>
          );
        }

        // 小見出し ### 
        if (trimmed.startsWith('### ')) {
          return (
            <h5 key={idx} className="text-xs sm:text-sm font-bold text-amber-300 pt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0" />
              {renderFormattedLine(trimmed.replace(/^###\s+/, ''))}
            </h5>
          );
        }

        // 箇条書き - または *
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
          const bulletContent = trimmed.replace(/^[-*•]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-2 text-xs sm:text-sm text-gray-200 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
              <span className="flex-1">{renderFormattedLine(bulletContent)}</span>
            </div>
          );
        }

        // 数字付き箇条書き 1. 2. etc.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2 text-xs sm:text-sm text-gray-200 leading-relaxed">
              <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold shrink-0 mt-0.5">
                {numMatch[1]}
              </span>
              <span className="flex-1">{renderFormattedLine(numMatch[2])}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="text-xs sm:text-sm text-gray-200 leading-relaxed">
            {renderFormattedLine(line)}
          </p>
        );
      })}
    </div>
  );
};

export const StockAiNotesSection: React.FC<Props> = ({ ticker, stockName }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<StockAiNote[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // フォーム用ステート
  const [selectedAi, setSelectedAi] = useState<AiType>('gemini');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [authorNameInput, setAuthorNameInput] = useState('');
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [pasteSuccess, setPasteSuccess] = useState(false);

  useEffect(() => {
    // 1. 即座にローカルキャッシュを表示して体感速度UP
    const local = getLocalStockAiNotes(ticker);
    setNotes(local);
    if (local.length > 0 && !expandedId) {
      setExpandedId(local[0].id);
    }

    // 2. 共有サーバー（全ユーザー共通）から最新の見解を取得
    loadSharedNotes();
  }, [ticker]);

  const loadSharedNotes = async () => {
    setIsLoading(true);
    try {
      const serverNotes = await fetchSharedStockAiNotes(ticker);
      setNotes(serverNotes);
      if (serverNotes.length > 0 && !expandedId) {
        setExpandedId(serverNotes[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddModal = (aiType: AiType = 'gemini') => {
    setSelectedAi(aiType);
    setNoteTitle(`${getAiDefaultName(aiType)}の見解`);
    setNoteContent('');
    setAuthorNameInput(user?.name || 'マサ');
    setIsModalOpen(true);
    setPasteSuccess(false);
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setNoteContent(text);
          setPasteSuccess(true);
          setTimeout(() => setPasteSuccess(false), 3000);
        }
      }
    } catch (e) {
      console.warn('Clipboard read failed or permission denied:', e);
    }
  };

  const handleSave = async () => {
    if (!noteContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const author = authorNameInput.trim() || user?.name || '投資家メンバー';
      const created = await addSharedStockAiNote(ticker, {
        aiType: selectedAi,
        title: noteTitle.trim() || `${getAiDefaultName(selectedAi)}の見解`,
        content: noteContent.trim(),
        authorName: author,
        authorId: user?.id,
      });

      // リスト更新と展開
      const updated = await fetchSharedStockAiNotes(ticker);
      setNotes(updated);
      setExpandedId(created.id);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save shared note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('このAI見解メモを削除しますか？（共有サーバーからも削除されます）')) {
      const updated = await deleteSharedStockAiNote(ticker, id);
      setNotes(updated);
      if (expandedId === id) {
        setExpandedId(updated.length > 0 ? updated[0].id : null);
      }
    }
  };

  const handleCopy = (content: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(content);
      setIsCopied(id);
      setTimeout(() => setIsCopied(null), 3000);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getAiStyle = (type: AiType) => {
    return AI_OPTIONS.find((o) => o.id === type) || AI_OPTIONS[0];
  };

  return (
    <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-[#0e1628] via-[#0b1120] to-[#080d19] p-4 sm:p-5 shadow-xl space-y-4 animate-border-breathing relative overflow-hidden">
      {/* セクションヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800/80">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            {/* 薄っすら点滅するネオンピン */}
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                AI調査メモ・見解ストック
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                <Globe className="w-2.5 h-2.5" />
                全投資家で共有中 ({notes.length}件)
              </span>
            </div>
            <p className="text-[11px] text-gray-300 mt-0.5">
              端末のGeminiなどで調べた回答を貼り付けると、<strong>入力年月日・調査日つき</strong>でみんなが見られる知見として保存・共有されます
            </p>
          </div>
        </div>

        {/* 貼り付け・新規追加ボタン */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAddModal('gemini')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer border border-cyan-400/40"
          >
            <ClipboardPaste className="w-4 h-4" />
            <span>AIの回答を貼り付ける（共有）</span>
          </button>
        </div>
      </div>

      {/* 保存されたAI見解ボタン一覧 */}
      {notes.length === 0 ? (
        <div className="py-6 px-4 rounded-xl border border-dashed border-gray-800 bg-gray-900/40 text-center space-y-2">
          <Bot className="w-8 h-8 text-gray-600 mx-auto" />
          <p className="text-xs font-semibold text-gray-300">
            まだこの銘柄のAI見解メモが保存されていません
          </p>
          <p className="text-[11px] text-gray-400 max-w-md mx-auto">
            上の「外部AIワンタップ相談」でGeminiに質問したあと、得られた長文の回答を「AIの回答を貼り付ける」からペーストすると、入力年月日つきの「Geminiの見解」ボタンが作成され、みんなで共有できます！
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={() => handleOpenAddModal('gemini')}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/60 text-cyan-300 text-xs font-bold transition-all shadow-md animate-ai-glow-pulse flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span>+ Geminiの見解を貼り付ける</span>
            </button>
            <button
              onClick={() => handleOpenAddModal('chatgpt')}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/60 text-emerald-300 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-300" />
              <span>+ ChatGPTの見解を貼り付ける</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* ボタン群（各AIボタン + 薄っすら点滅パルスグロー + 入力年月日バッジ + 文字数） */}
          <div className="flex items-center gap-2 flex-wrap">
            {notes.map((note) => {
              const style = getAiStyle(note.aiType);
              const isExpanded = expandedId === note.id;
              const dateStr = formatShortDate(note.createdAt);

              return (
                <button
                  key={note.id}
                  onClick={() => toggleExpand(note.id)}
                  className={`relative inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 border ${
                    isExpanded
                      ? `bg-gradient-to-r ${style.gradient} text-white ${style.border} ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/30 animate-ai-glow-pulse`
                      : `bg-gray-900/95 hover:bg-gray-800 text-gray-100 border-cyan-500/50 hover:border-cyan-400 animate-ai-glow-pulse`
                  }`}
                  title={`${note.title}（入力年月日: ${formatDateTimeJP(note.createdAt)}）`}
                >
                  {/* 薄っすら点滅するネオン光輪インジケーター */}
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                  </span>

                  <Sparkles className={`w-3.5 h-3.5 ${isExpanded ? 'text-white' : style.iconColor}`} />
                  <span className="font-extrabold">{note.title}</span>
                  
                  {/* 📅 入力年月日バッジ */}
                  <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isExpanded ? 'bg-black/30 text-cyan-100' : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    <Calendar className="w-2.5 h-2.5" />
                    {dateStr}
                  </span>

                  {/* 文字数 */}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    isExpanded ? 'bg-black/30 text-white/90' : 'bg-gray-800 text-gray-300'
                  }`}>
                    {note.content.length.toLocaleString()}文字
                  </span>

                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-gray-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* 展開されたAI見解の本文パネル */}
          {expandedId && (() => {
            const currentNote = notes.find((n) => n.id === expandedId);
            if (!currentNote) return null;
            const style = getAiStyle(currentNote.aiType);

            return (
              <div className="rounded-xl border border-cyan-500/40 bg-[#0d1527]/95 p-4 sm:p-5 space-y-4 shadow-2xl animate-fade-in">
                {/* 見解パネルの上部コントロールバー */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r ${style.gradient} text-white text-xs font-black shadow-sm`}>
                        <Bot className="w-3.5 h-3.5" />
                        {getAiDefaultName(currentNote.aiType)}
                      </span>
                      <h4 className="text-sm sm:text-base font-black text-white">
                        {currentNote.title}
                      </h4>
                    </div>

                    {/* 🗓️ 入力年月日・時間 ＆ 投稿者情報 */}
                    <div className="flex items-center gap-3 text-xs text-gray-300 flex-wrap pt-0.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-semibold text-[11px]">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        入力年月日: <strong>{formatDateTimeJP(currentNote.createdAt)}</strong>
                      </span>

                      {currentNote.authorName && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                          <Users className="w-3 h-3 text-indigo-400" />
                          共有者: <span className="text-gray-200 font-bold">{currentNote.authorName}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={(e) => handleCopy(currentNote.content, currentNote.id, e)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold transition-colors"
                      title="見解の全文をコピー"
                    >
                      {isCopied === currentNote.id ? (
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

                    <button
                      onClick={(e) => handleDelete(currentNote.id, e)}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 text-xs font-semibold border border-rose-800/40 transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setExpandedId(null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800/90 hover:bg-gray-700 text-gray-300 hover:text-white text-xs transition-colors ml-1"
                      title="折りたたむ"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>閉じる</span>
                    </button>
                  </div>
                </div>

                {/* 見解本文（長文でも読みやすいスクロール＆タイポグラフィ） */}
                <div className="max-h-[550px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700">
                  <FormattedAiContent content={currentNote.content} />
                </div>

                <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px] text-gray-400">
                  <span>文字数: {currentNote.content.length.toLocaleString()}文字 ｜ 全員に共有中</span>
                  <button
                    onClick={() => setExpandedId(null)}
                    className="text-cyan-400 hover:text-cyan-300 underline font-semibold"
                  >
                    ↑ 折りたたむ
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 📝 貼り付け・共有モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0f172a] border border-cyan-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* モーダルヘッダー */}
            <div className="px-5 py-4 bg-gradient-to-r from-gray-900 via-[#101b33] to-gray-900 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <ClipboardPaste className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {stockName} のAI見解・調査結果を貼り付け
                  </h3>
                  <p className="text-[11px] text-emerald-300 flex items-center gap-1 font-semibold">
                    <Globe className="w-3 h-3" />
                    保存すると入力年月日（本日: {formatDateJP(Date.now())}）つきで全投資家に共有されます
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* モーダルボディ */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* AI選択 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">
                  調査したAIを選択:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {AI_OPTIONS.map((ai) => {
                    const isSelected = selectedAi === ai.id;
                    return (
                      <button
                        key={ai.id}
                        type="button"
                        onClick={() => {
                          setSelectedAi(ai.id);
                          if (!noteTitle || noteTitle.endsWith('の見解')) {
                            setNoteTitle(`${ai.name}の見解`);
                          }
                        }}
                        className={`px-2 py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                          isSelected
                            ? `bg-gradient-to-b ${ai.gradient} text-white ${ai.border} ring-2 ring-cyan-400/40 shadow-md`
                            : 'bg-gray-900/80 text-gray-300 border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{ai.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* タイトル入力 ＆ 投稿者名 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">
                    ボタンの表示名・見出し:
                  </label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="例: Geminiの見解, 決算深掘り, テクニカル分析"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white text-xs outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">
                    投稿者名:
                  </label>
                  <input
                    type="text"
                    value={authorNameInput}
                    onChange={(e) => setAuthorNameInput(e.target.value)}
                    placeholder="マサ"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white text-xs outline-none transition-all"
                  />
                </div>
              </div>

              {/* クリップボード貼り付けボタン ＆ 本文エリア */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-300">
                    貼り付ける長文・回答内容:
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold transition-all active:scale-95"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>クリップボードから自動貼り付け</span>
                  </button>
                </div>

                {pasteSuccess && (
                  <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 animate-fade-in">
                    <CheckCircle2 className="w-3 h-3" />
                    クリップボードの内容を貼り付けました！
                  </p>
                )}

                <textarea
                  rows={9}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="ここにGemini等で調べた回答の長い文章をペーストしてください..."
                  className="w-full p-3.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white text-xs leading-relaxed outline-none transition-all placeholder:text-gray-600 resize-y"
                />
                <div className="flex justify-between items-center text-[11px] text-gray-500">
                  <span>本日（{formatDateJP(Date.now())}）の日付で共有保存されます</span>
                  <span>文字数: {noteContent.length.toLocaleString()}文字</span>
                </div>
              </div>
            </div>

            {/* モーダルフッター */}
            <div className="px-5 py-3.5 bg-gray-900/90 border-t border-gray-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!noteContent.trim() || isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black shadow-lg shadow-cyan-500/25 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>共有保存中...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    <span>みんなに共有保存する</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
