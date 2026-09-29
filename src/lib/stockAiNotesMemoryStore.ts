export interface SharedAiNoteRecord {
  id: string;
  ticker: string;
  ai_type: string;
  title: string;
  content: string;
  author_name: string;
  author_id?: string;
  created_at: string;
  updated_at?: string;
}

// グローバルスコープで保持（Next.jsの開発サーバー/APIルート間での共通化）
const globalAny: any = global;
if (!globalAny.__memoryNotesStore) {
  globalAny.__memoryNotesStore = new Map<string, SharedAiNoteRecord[]>();
}

export const memoryNotesStore: Map<string, SharedAiNoteRecord[]> = globalAny.__memoryNotesStore;
