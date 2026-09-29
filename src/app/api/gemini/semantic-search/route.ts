import { NextRequest, NextResponse } from 'next/server';
import { searchStocksBySemanticQuery } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const headerKey = request.headers.get('x-gemini-api-key') || '';
    const body = await request.json();
    const query = body?.query;
    const apiKey = body?.apiKey;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query string is required' }, { status: 400 });
    }

    const effectiveKey = apiKey || headerKey || process.env.GEMINI_API_KEY || '';
    const results = await searchStocksBySemanticQuery(query, effectiveKey);

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Semantic search error' }, { status: 500 });
  }
}
