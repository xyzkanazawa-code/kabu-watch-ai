import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { memoryNotesStore, SharedAiNoteRecord } from '@/lib/stockAiNotesMemoryStore';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickersParam = searchParams.get('tickers');

  if (!tickersParam) {
    return NextResponse.json({ notesByTicker: {} });
  }

  const tickers = tickersParam
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  if (tickers.length === 0) {
    return NextResponse.json({ notesByTicker: {} });
  }

  const result: Record<string, any[]> = {};
  tickers.forEach((t) => {
    result[t] = [];
  });

  // 1. Supabaseから取得を試みる
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('stock_ai_notes')
        .select('*')
        .in('ticker', tickers)
        .order('created_at', { ascending: false });

      if (!error && data && Array.isArray(data)) {
        data.forEach((note: any) => {
          if (result[note.ticker]) {
            result[note.ticker].push(note);
          }
        });
        return NextResponse.json({ notesByTicker: result });
      }
    } catch (e) {
      console.warn('Supabase batch query failed, falling back to memory store:', e);
    }
  }

  // 2. メモリストアから取得
  tickers.forEach((t) => {
    const list = memoryNotesStore.get(t) || [];
    result[t] = list;
  });

  return NextResponse.json({ notesByTicker: result });
}
