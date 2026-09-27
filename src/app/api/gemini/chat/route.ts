import { NextRequest, NextResponse } from 'next/server';
import { askGeminiAboutItem } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const headerKey = request.headers.get('x-gemini-api-key') || '';
    const { contextTitle, contextContent, userQuestion, history, apiKey } = await request.json();

    if (!contextTitle || !userQuestion) {
      return NextResponse.json({ error: 'Context title and user question are required' }, { status: 400 });
    }

    const effectiveKey = apiKey || headerKey || process.env.GEMINI_API_KEY || '';
    const reply = await askGeminiAboutItem(
      contextTitle, 
      contextContent || contextTitle, 
      userQuestion, 
      history || [],
      effectiveKey
    );

    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Chat error' }, { status: 500 });
  }
}
