'use client';

import React from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle,
  FileText,
  Table as TableIcon
} from 'lucide-react';
import { AiType } from '@/lib/stockAiNotesStorage';

interface SmartAiContentProps {
  content: string;
  aiType?: AiType;
}

// AIタイプ別のアクセントカラー設定
const AI_THEME = {
  gemini: {
    badgeBg: 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300',
    headingColor: 'text-cyan-300 border-cyan-500/30',
    bulletColor: 'bg-cyan-400',
    iconColor: 'text-cyan-400',
    boldHighlight: 'bg-cyan-950/50 text-cyan-100 border-cyan-700/40',
  },
  chatgpt: {
    badgeBg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
    headingColor: 'text-emerald-300 border-emerald-500/30',
    bulletColor: 'bg-emerald-400',
    iconColor: 'text-emerald-400',
    boldHighlight: 'bg-emerald-950/50 text-emerald-100 border-emerald-700/40',
  },
  claude: {
    badgeBg: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
    headingColor: 'text-amber-300 border-amber-500/30',
    bulletColor: 'bg-amber-400',
    iconColor: 'text-amber-400',
    boldHighlight: 'bg-amber-950/50 text-amber-100 border-amber-700/40',
  },
  perplexity: {
    badgeBg: 'bg-teal-950/60 border-teal-500/40 text-teal-300',
    headingColor: 'text-teal-300 border-teal-500/30',
    bulletColor: 'bg-teal-400',
    iconColor: 'text-teal-400',
    boldHighlight: 'bg-teal-950/50 text-teal-100 border-teal-700/40',
  },
  deepseek: {
    badgeBg: 'bg-sky-950/60 border-sky-500/40 text-sky-300',
    headingColor: 'text-sky-300 border-sky-500/30',
    bulletColor: 'bg-sky-400',
    iconColor: 'text-sky-400',
    boldHighlight: 'bg-sky-950/50 text-sky-100 border-sky-700/40',
  },
  other: {
    badgeBg: 'bg-purple-950/60 border-purple-500/40 text-purple-300',
    headingColor: 'text-purple-300 border-purple-500/30',
    bulletColor: 'bg-purple-400',
    iconColor: 'text-purple-400',
    boldHighlight: 'bg-purple-950/50 text-purple-100 border-purple-700/40',
  },
};

/**
 * どんなAI（Gemini, ChatGPT, Claude, Perplexity, DeepSeek等）からコピーした文章でも
 * 見出し、太字、箇条書き、テーブル、出典番号などを自動検知して最高に見やすく整形するスマートレンダラー
 */
export const SmartAiContent: React.FC<SmartAiContentProps> = ({ content, aiType = 'gemini' }) => {
  if (!content) return null;

  const theme = AI_THEME[aiType] || AI_THEME.other;

  // インラインテキストの装飾（**太字**、出典 [1]、コード等）
  const renderInlineFormatted = (text: string) => {
    // 1. 出典番号 [1], [2] などをPerplexity風タグに置換
    // 2. **太字** を強調
    const parts = text.split(/(\*\*.*?\*\*|\[\d+\])/g);

    return parts.map((part, i) => {
      // **太字**
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        const inner = part.slice(2, -2);
        return (
          <strong 
            key={i} 
            className={`font-black px-1.5 py-0.5 mx-0.5 rounded text-white border ${theme.boldHighlight}`}
          >
            {inner}
          </strong>
        );
      }
      // 出典 [1], [2]
      if (/^\[\d+\]$/.test(part)) {
        return (
          <span 
            key={i} 
            className="inline-flex items-center text-[10px] font-mono font-bold px-1 py-0.2 mx-0.5 rounded bg-gray-800 text-teal-300 border border-teal-500/30 align-super"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // 改行コード統一
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = normalized.split('\n');

  // テーブル検出用の簡易パーサー処理
  const elements: React.ReactNode[] = [];
  let currentTable: string[][] = [];

  const flushTable = () => {
    if (currentTable.length === 0) return;
    const tableData = [...currentTable];
    currentTable = [];

    const headers = tableData[0] || [];
    const rows = tableData.slice(1);

    elements.push(
      <div key={`table-${elements.length}`} className="my-3 overflow-x-auto rounded-xl border border-gray-800 bg-gray-950/70">
        <table className="min-w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/90 text-gray-300 font-bold">
              {headers.map((h, hIdx) => (
                <th key={hIdx} className="px-3 py-2 border-r border-gray-800 last:border-r-0 whitespace-nowrap">
                  {renderInlineFormatted(h.trim())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-gray-850/50 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 text-gray-200 border-r border-gray-800/60 last:border-r-0">
                    {renderInlineFormatted(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // テーブル行の判定（| a | b | c |）
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
      const cells = trimmed.split('|').slice(1, -1);
      // 区切り線（|---|---|）はスキップ
      if (cells.every(c => /^[-:\s]+$/.test(c))) {
        continue;
      }
      currentTable.push(cells);
      continue;
    } else {
      flushTable();
    }

    // 空行
    if (!trimmed) {
      elements.push(<div key={`empty-${i}`} className="h-2.5" />);
      continue;
    }

    // 水平区切り線（--- や ***）
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(<hr key={`hr-${i}`} className="my-3 border-gray-800/80" />);
      continue;
    }

    // 1. 大見出し: # または #見出し
    if (/^#+\s+/.test(trimmed) || /^#{1,3}[^#\s]/.test(trimmed)) {
      const level = (trimmed.match(/^#+/) || ['#'])[0].length;
      const clean = trimmed.replace(/^#+\s*/, '');

      if (level === 1) {
        elements.push(
          <div key={`h1-${i}`} className={`text-base sm:text-lg font-black pt-3 pb-1 border-b flex items-center gap-2 ${theme.headingColor}`}>
            <Sparkles className={`w-4 h-4 shrink-0 ${theme.iconColor}`} />
            <span>{renderInlineFormatted(clean)}</span>
          </div>
        );
      } else if (level === 2) {
        elements.push(
          <div key={`h2-${i}`} className="text-sm sm:text-base font-extrabold text-white pt-2.5 pb-0.5 flex items-center gap-1.5">
            <span className={`w-1.5 h-3.5 rounded-full shrink-0 ${theme.bulletColor}`} />
            <span>{renderInlineFormatted(clean)}</span>
          </div>
        );
      } else {
        elements.push(
          <div key={`h3-${i}`} className={`text-xs sm:text-sm font-bold pt-2 flex items-center gap-1.5 ${theme.headingColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.bulletColor}`} />
            <span>{renderInlineFormatted(clean)}</span>
          </div>
        );
      }
      continue;
    }

    // 2. 日本語特有の見出し: 【見出し】 や [見出し] や ■見出し, ◆見出し, ●見出し, ▼見出し
    if (/^[【\[■◆●▼▶▲]\s*.*?[\s】\]:]?$/.test(trimmed) || /^(【.*?】|\[.*?\])/.test(trimmed)) {
      elements.push(
        <div key={`jp-h-${i}`} className={`text-xs sm:text-sm font-extrabold pt-2 pb-0.5 flex items-center gap-1.5 ${theme.headingColor}`}>
          <span className={`w-1.5 h-3 rounded-full shrink-0 ${theme.bulletColor}`} />
          <span>{renderInlineFormatted(trimmed)}</span>
        </div>
      );
      continue;
    }

    // 3. Claude/ChatGPTで頻出の太字のみの行（例: **1. 業績ハイライト** や **強みと弱み:**）
    if (/^\*\*[^*]+?\*\*[:：]?$/.test(trimmed)) {
      const clean = trimmed.replace(/^\*\*/, '').replace(/\*\*[:：]?$/, '');
      elements.push(
        <div key={`bold-h-${i}`} className="text-xs sm:text-sm font-bold text-white pt-2 pb-0.5 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.bulletColor}`} />
          <span className="text-cyan-100">{clean}</span>
        </div>
      );
      continue;
    }

    // 4. リスト・箇条書き（-, *, +, •, ・, ◆, ■ など）
    if (/^[-*+•・◆■▶]\s+/.test(trimmed) || /^・/.test(trimmed)) {
      const clean = trimmed.replace(/^[-*+•・◆■▶]\s*/, '');
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2 pl-2 text-xs sm:text-sm text-gray-200 leading-relaxed">
          <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${theme.bulletColor}`} />
          <span className="flex-1">{renderInlineFormatted(clean)}</span>
        </div>
      );
      continue;
    }

    // 5. 数字付き箇条書き（1. 2. や １． ２． や ① ② (1) (2)）
    const numMatch = trimmed.match(/^(\d+|[０-９]+|[①-⑳]|\(\d+\))[\.\s、]\s*(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 pl-2 text-xs sm:text-sm text-gray-200 leading-relaxed">
          <span className={`px-1.5 py-0.2 rounded border text-[10px] font-mono font-bold shrink-0 mt-0.5 ${theme.badgeBg}`}>
            {numMatch[1]}
          </span>
          <span className="flex-1">{renderInlineFormatted(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // 通常の文章段落
    elements.push(
      <p key={`p-${i}`} className="text-xs sm:text-sm text-gray-200 leading-relaxed font-sans">
        {renderInlineFormatted(line)}
      </p>
    );
  }

  // 最後に残ったテーブルがあれば排出
  flushTable();

  return (
    <div className="space-y-2 font-sans select-text">
      {elements}
    </div>
  );
};
