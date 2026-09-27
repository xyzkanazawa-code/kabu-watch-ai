import { NextRequest, NextResponse } from 'next/server';
import { searchStocksBySemanticQuery } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query string is required' }, { status: 400 });
    }

    const results = await searchStocksBySemanticQuery(query);

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Semantic search error' }, { status: 500 });
  }
}
