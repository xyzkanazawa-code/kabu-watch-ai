'use client';

export type AiType = 'gemini' | 'chatgpt' | 'claude' | 'perplexity' | 'deepseek' | 'other';

export interface StockAiNote {
  id: string;
  ticker: string;
  aiType: AiType;
  title: string;
  content: string;
  authorName?: string;
  authorId?: string;
  createdAt: number;
  updatedAt?: number;
}

const STORAGE_PREFIX = 'kabu_watch_ai_notes_';

/**
 * ローカルキャッシュから取得（即時表示用）
 */
export function getLocalStockAiNotes(ticker: string): StockAiNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${ticker}`);
    if (!raw) return [];
    const notes: StockAiNote[] = JSON.parse(raw);
    return Array.isArray(notes) ? notes.sort((a, b) => b.createdAt - a.createdAt) : [];
  } catch (e) {
    console.error('Failed to load local AI notes for ticker:', ticker, e);
    return [];
  }
}

/**
 * ローカルキャッシュに保存
 */
export function saveLocalStockAiNotes(ticker: string, notes: StockAiNote[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${ticker}`, JSON.stringify(notes));
    window.dispatchEvent(new CustomEvent('kabu_watch_ai_notes_changed', { detail: { ticker } }));
  } catch (e) {
    console.error('Failed to save local AI notes for ticker:', ticker, e);
  }
}

/**
 * ローカルストレージ内の全銘柄のAI見解キャッシュを取得
 */
export function getAllLocalStockAiNotes(): Record<string, StockAiNote[]> {
  if (typeof window === 'undefined') return {};
  const result: Record<string, StockAiNote[]> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const ticker = key.replace(STORAGE_PREFIX, '');
        const raw = localStorage.getItem(key);
        if (raw) {
          const notes: StockAiNote[] = JSON.parse(raw);
          if (Array.isArray(notes) && notes.length > 0) {
            result[ticker] = notes.sort((a, b) => b.createdAt - a.createdAt);
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to get all local AI notes:', e);
  }
  return result;
}

/**
 * 複数銘柄のAI見解を一括でサーバーから同期
 */
export async function fetchBatchStockAiNotes(tickers: string[]): Promise<Record<string, StockAiNote[]>> {
  if (!tickers || tickers.length === 0) return {};
  try {
    const res = await fetch(`/api/stocks/notes/batch?tickers=${encodeURIComponent(tickers.join(','))}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Batch notes fetch failed');
    const data = await res.json();
    const result: Record<string, StockAiNote[]> = {};

    if (data.notesByTicker) {
      Object.entries(data.notesByTicker).forEach(([ticker, list]: [string, any]) => {
        if (Array.isArray(list)) {
          const formatted: StockAiNote[] = list.map((item: any) => ({
            id: String(item.id),
            ticker: item.ticker,
            aiType: (item.ai_type || item.aiType || 'gemini') as AiType,
            title: item.title,
            content: item.content,
            authorName: item.author_name || item.authorName || '投資家メンバー',
            authorId: item.author_id || item.authorId,
            createdAt: item.created_at ? new Date(item.created_at).getTime() : (item.createdAt || Date.now()),
            updatedAt: item.updated_at ? new Date(item.updated_at).getTime() : (item.updatedAt || undefined),
          }));

          // ローカルキャッシュとマージ
          const local = getLocalStockAiNotes(ticker);
          const idMap = new Map<string, StockAiNote>();
          formatted.forEach((n) => idMap.set(n.id, n));
          local.forEach((n) => {
            if (!idMap.has(n.id)) idMap.set(n.id, n);
          });
          const merged = Array.from(idMap.values()).sort((a, b) => b.createdAt - a.createdAt);
          if (merged.length > 0) {
            if (typeof window !== 'undefined') {
              localStorage.setItem(`${STORAGE_PREFIX}${ticker}`, JSON.stringify(merged));
            }
          }
          result[ticker] = merged;
        }
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kabu_watch_ai_notes_changed', { detail: { tickers } }));
      }
      return result;
    }
  } catch (e) {
    console.warn('Batch fetch notes error, falling back to local:', e);
  }
  return getAllLocalStockAiNotes();
}

/**
 * 共有サーバー（Supabase / サーバー共通キャッシュ）からみんなの見解を取得
 */
export async function fetchSharedStockAiNotes(ticker: string): Promise<StockAiNote[]> {
  try {
    const res = await fetch(`/api/stocks/${ticker}/notes`, { cache: 'no-store' });
    if (!res.ok) throw new Error('API response not ok');
    const data = await res.json();
    if (data.notes && Array.isArray(data.notes)) {
      const formatted: StockAiNote[] = data.notes.map((item: any) => ({
        id: String(item.id),
        ticker: item.ticker,
        aiType: (item.ai_type || item.aiType || 'gemini') as AiType,
        title: item.title,
        content: item.content,
        authorName: item.author_name || item.authorName || '投資家メンバー',
        authorId: item.author_id || item.authorId,
        createdAt: item.created_at ? new Date(item.created_at).getTime() : (item.createdAt || Date.now()),
        updatedAt: item.updated_at ? new Date(item.updated_at).getTime() : (item.updatedAt || undefined),
      }));

      // ローカルキャッシュもマージ更新
      const local = getLocalStockAiNotes(ticker);
      const idMap = new Map<string, StockAiNote>();
      formatted.forEach((n) => idMap.set(n.id, n));
      local.forEach((n) => {
        if (!idMap.has(n.id)) idMap.set(n.id, n);
      });
      const merged = Array.from(idMap.values()).sort((a, b) => b.createdAt - a.createdAt);
      saveLocalStockAiNotes(ticker, merged);

      return merged;
    }
  } catch (err) {
    console.warn('Failed to fetch shared notes from server, using local:', err);
  }
  return getLocalStockAiNotes(ticker);
}

/**
 * 共有サーバーに新しいAI見解を追加投稿（みんなが見れるように保存）
 */
export async function addSharedStockAiNote(
  ticker: string,
  noteData: {
    aiType: AiType;
    title: string;
    content: string;
    authorName?: string;
    authorId?: string;
  }
): Promise<StockAiNote> {
  const localTemp: StockAiNote = {
    id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ticker,
    aiType: noteData.aiType,
    title: noteData.title.trim() || `${getAiDefaultName(noteData.aiType)}の見解`,
    content: noteData.content.trim(),
    authorName: noteData.authorName || '投資家メンバー',
    authorId: noteData.authorId,
    createdAt: Date.now(),
  };

  // 即時ローカル反映
  const currentLocal = getLocalStockAiNotes(ticker);
  saveLocalStockAiNotes(ticker, [localTemp, ...currentLocal]);

  // サーバーへPOST（みんなへ共有）
  try {
    const res = await fetch(`/api/stocks/${ticker}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aiType: noteData.aiType,
        title: localTemp.title,
        content: localTemp.content,
        authorName: localTemp.authorName,
        authorId: localTemp.authorId,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.note) {
        const serverItem: StockAiNote = {
          id: String(data.note.id),
          ticker: data.note.ticker,
          aiType: (data.note.ai_type || noteData.aiType) as AiType,
          title: data.note.title,
          content: data.note.content,
          authorName: data.note.author_name || localTemp.authorName,
          authorId: data.note.author_id,
          createdAt: data.note.created_at ? new Date(data.note.created_at).getTime() : localTemp.createdAt,
        };
        // ローカルの一時IDをサーバーIDで置換
        const updated = getLocalStockAiNotes(ticker).map((n) =>
          n.id === localTemp.id ? serverItem : n
        );
        saveLocalStockAiNotes(ticker, updated);
        return serverItem;
      }
    }
  } catch (err) {
    console.warn('Failed to post shared note to server:', err);
  }

  return localTemp;
}

/**
 * 共有サーバーからAI見解を削除
 */
export async function deleteSharedStockAiNote(ticker: string, id: string): Promise<StockAiNote[]> {
  // ローカル即時削除
  const current = getLocalStockAiNotes(ticker);
  const updated = current.filter((n) => n.id !== id);
  saveLocalStockAiNotes(ticker, updated);

  // サーバーへDELETE
  try {
    await fetch(`/api/stocks/${ticker}/notes?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch (e) {
    console.warn('Failed to delete note from server:', e);
  }

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

/**
 * 年月日のフォーマット（例: 2026年9月29日）
 */
export function formatDateJP(val: number | string): string {
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/**
 * 年月日と時刻のフォーマット（例: 2026年9月29日 19:54）
 */
export function formatDateTimeJP(val: number | string): string {
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${hours}:${minutes}`;
}

/**
 * 短縮年月日（例: 2026/09/29）
 */
export function formatShortDate(val: number | string): string {
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}/${m}/${day}`;
}
