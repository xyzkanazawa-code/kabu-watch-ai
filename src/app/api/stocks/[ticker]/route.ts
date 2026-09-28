import { NextRequest, NextResponse } from 'next/server';
import { fetchStockInfo, fetchMergedTimeline, fetchFinancialTrends, fetchProductList, fetchGlobalInfo, fetchDisclosures, fetchGoogleNews } from '@/lib/dataFetcher';
import { generateStockOverallOverview } from '@/lib/gemini';

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const ticker = params.ticker;
    const stockInfo = await fetchStockInfo(ticker);
    const timeline = await fetchMergedTimeline(ticker, stockInfo.name);
    const disclosures = await fetchDisclosures(ticker, stockInfo.name);
    const news = await fetchGoogleNews(ticker, stockInfo.name);
    const financialTrends = fetchFinancialTrends(ticker);
    const products = fetchProductList(ticker);
    const globalInfo = fetchGlobalInfo(ticker);

    const { searchParams } = new URL(request.url);
    const customApiKey = searchParams.get('apiKey') || request.headers.get('x-gemini-key') || undefined;

    // AI 銘柄全体総合分析（実際の指標・信用残高・最新ニュース・開示を丸ごと投入）
    const aiOverview = await generateStockOverallOverview(ticker, stockInfo, news, disclosures, customApiKey);

    return NextResponse.json({
      stockInfo,
      timeline,
      disclosures,
      news,
      financialTrends,
      products,
      globalInfo,
      aiOverview
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
