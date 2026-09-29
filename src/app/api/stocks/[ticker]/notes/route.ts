import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Supabase接続前やフォールバック用のサーバーメモリ共通ストア
// これにより、複数ユーザー・複数端末からのアクセスで共有されます
interface SharedAiNoteRecord {
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

const memoryNotesStore: Map<string, SharedAiNoteRecord[]> = new Map();

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker;
  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  // 1. Supabaseが利用可能であればSupabaseから取得
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('stock_ai_notes')
        .select('*')
        .eq('ticker', ticker)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return NextResponse.json({ notes: data });
      }
    } catch (e) {
      console.warn('Supabase query failed, falling back to memory store:', e);
    }
  }

  // 2. フォールバック: サーバー内共有メモリから取得
  const list = memoryNotesStore.get(ticker) || [];
  return NextResponse.json({ notes: list });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker;
  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { aiType, title, content, authorName, authorId } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const newRecord: SharedAiNoteRecord = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ticker,
      ai_type: aiType || 'gemini',
      title: title || 'Geminiの見解',
      content: content.trim(),
      author_name: authorName || '投資家メンバー',
      author_id: authorId || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Supabaseへ挿入を試みる
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('stock_ai_notes')
          .insert({
            ticker,
            ai_type: newRecord.ai_type,
            title: newRecord.title,
            content: newRecord.content,
            author_name: newRecord.author_name,
            author_id: newRecord.author_id,
            created_at: newRecord.created_at,
          })
          .select()
          .single();

        if (!error && data) {
          // メモリにもキャッシュ
          const existing = memoryNotesStore.get(ticker) || [];
          memoryNotesStore.set(ticker, [data, ...existing]);
          return NextResponse.json({ note: data, success: true });
        }
      } catch (e) {
        console.warn('Supabase insert failed, storing in memory:', e);
      }
    }

    // 2. メモリ共通ストアに保存
    const existing = memoryNotesStore.get(ticker) || [];
    memoryNotesStore.set(ticker, [newRecord, ...existing]);

    return NextResponse.json({ note: newRecord, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save note' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
  }

  // 1. Supabaseから削除
  if (supabase) {
    try {
      await supabase.from('stock_ai_notes').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete failed:', e);
    }
  }

  // 2. メモリ共通ストアから削除
  const existing = memoryNotesStore.get(ticker) || [];
  memoryNotesStore.set(ticker, existing.filter((n) => n.id !== id));

  return NextResponse.json({ success: true });
}
