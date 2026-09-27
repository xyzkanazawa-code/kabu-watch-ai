import { NextRequest, NextResponse } from 'next/server';
import { analyzeStockImpact, analyzePartnershipCompany } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { title, content, isPartnershipCheck } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const impactData = await analyzeStockImpact(title, content || title);
    let partnerInfo = null;

    if (isPartnershipCheck || title.includes('提携') || title.includes('協業') || title.includes('M&A') || title.includes('買収') || title.includes('共同')) {
      partnerInfo = await analyzePartnershipCompany(title, content || title);
    }

    return NextResponse.json({
      ...impactData,
      partnerInfo
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Analysis error' }, { status: 500 });
  }
}
