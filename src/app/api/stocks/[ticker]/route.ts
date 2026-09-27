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

    // AI 銘柄全体総合分析
    const recentNewsTitles = news.slice(0, 4).map(n => n.title);
    const aiOverview = await generateStockOverallOverview(ticker, stockInfo.name, recentNewsTitles);

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
