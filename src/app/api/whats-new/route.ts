import { NextRequest, NextResponse } from 'next/server';
import { fetchStockInfo, fetchDisclosures, fetchGoogleNews } from '@/lib/dataFetcher';

export async function POST(request: NextRequest) {
  try {
    const { tickers } = await request.json();

    if (!Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json({ diffs: [] });
    }

    const diffs = await Promise.all(
      tickers.map(async (ticker: string) => {
        const stockInfo = await fetchStockInfo(ticker);
        const news = await fetchGoogleNews(ticker, stockInfo.name);
        const disclosures = await fetchDisclosures(ticker, stockInfo.name);

        const newNewsCount = news.filter(n => n.isNew).length;
        const newDisclosureCount = disclosures.filter(d => d.isNew).length;
        const newEarningsCount = disclosures.filter(d => d.isNew && d.category === 'earnings').length;
        const newPartnershipCount = disclosures.filter(d => d.isNew && d.category === 'partnership').length + news.filter(n => n.isNew && n.category === 'partnership').length;

        // 業績修正・配当修正変更ハイライト
        const modifiedForecast = disclosures.find(d => d.isNew && d.category === 'forecast');
        const modifiedDividend = disclosures.find(d => d.isNew && d.category === 'dividend');

        const hasWarningChange = !!(modifiedForecast || modifiedDividend);
        const warningDetail = modifiedForecast 
          ? `【業績予想修正】${modifiedForecast.title}` 
          : (modifiedDividend ? `【配当予想変更】${modifiedDividend.title}` : undefined);

        const totalNewItems = newNewsCount + newDisclosureCount;

        return {
          ticker,
          stockName: stockInfo.name,
          price: stockInfo.price,
          changePercent: stockInfo.changePercent,
          newNewsCount,
          newDisclosureCount,
          newEarningsCount,
          newPartnershipCount,
          hasWarningChange,
          warningDetail,
          totalNewItems,
          hasGlow: totalNewItems > 0 || hasWarningChange
        };
      })
    );

    return NextResponse.json({ diffs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Whats new error' }, { status: 500 });
  }
}
