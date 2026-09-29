'use client';

export type AiType = 'gemini' | 'chatgpt' | 'claude' | 'perplexity' | 'deepseek' | 'other';

export interface StockAiNote {
  id: string;
  ticker: string;
  aiType: AiType;
  title: string;
  content: string;
  createdAt: number;
  updatedAt?: number;
}

const STORAGE_PREFIX = 'kabu_watch_ai_notes_';

export function getStockAiNotes(ticker: string): StockAiNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${ticker}`);
    if (!raw) return [];
    const notes: StockAiNote[] = JSON.parse(raw);
    return Array.isArray(notes) ? notes.sort((a, b) => b.createdAt - a.createdAt) : [];
  } catch (e) {
    console.error('Failed to load AI notes for ticker:', ticker, e);
    return [];
  }
}

export function saveStockAiNotes(ticker: string, notes: StockAiNote[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${ticker}`, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save AI notes for ticker:', ticker, e);
  }
}

export function addStockAiNote(
  ticker: string,
  noteData: { aiType: AiType; title: string; content: string }
): StockAiNote {
  const current = getStockAiNotes(ticker);
  const newNote: StockAiNote = {
    id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ticker,
    aiType: noteData.aiType,
    title: noteData.title.trim() || `${getAiDefaultName(noteData.aiType)}の見解`,
    content: noteData.content.trim(),
    createdAt: Date.now(),
  };

  const updated = [newNote, ...current];
  saveStockAiNotes(ticker, updated);
  return newNote;
}

export function updateStockAiNote(
  ticker: string,
  id: string,
  updates: Partial<Omit<StockAiNote, 'id' | 'ticker' | 'createdAt'>>
): StockAiNote[] {
  const current = getStockAiNotes(ticker);
  const updated = current.map((n) =>
    n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
  );
  saveStockAiNotes(ticker, updated);
  return updated;
}

export function deleteStockAiNote(ticker: string, id: string): StockAiNote[] {
  const current = getStockAiNotes(ticker);
  const updated = current.filter((n) => n.id !== id);
  saveStockAiNotes(ticker, updated);
  return updated;
}

export function getAiDefaultName(type: AiType): string {
  switch (type) {
    case 'gemini':
      return 'Gemini';
    case 'chatgpt':
      return 'ChatGPT';
    case 'claude':
      return 'Claude';
    case 'perplexity':
      return 'Perplexity';
    case 'deepseek':
      return 'DeepSeek';
    case 'other':
    default:
      return '外部AI';
  }
}
