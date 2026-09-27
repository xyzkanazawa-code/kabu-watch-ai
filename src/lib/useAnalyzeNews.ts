import useSWR from 'swr';
import { getStoredApiKey } from './apiKeyStorage';

export interface AnalyzeNewsParams {
  url?: string;
  title?: string;
  body?: string;
  ticker?: string;
  type?: string;
  enabled?: boolean;
}

export interface AnalyzeNewsResponse {
  cached: boolean;
  cached_at: string;
  content_hash: string;
  ticker: string;
  title: string;
  category: string;
  importance_score: number;
  summary: string;
  market_impact: {
    salesImpact?: { type: string; detail: string };
    profitImpact?: { type: string; detail: string };
    fullYearForecastImpact?: { type: string; detail: string };
    competitorImpact?: string;
    shortTermCatalyst?: string;
    midLongTermPoints?: string;
    matrix?: {
      importanceScore?: number;
      earningsImpact?: string;
      financialImpact?: string;
      businessImpact?: string;
      marketImpact?: string;
    };
  };
  partner_details?: any;
}

const fetcher = async ([endpoint, params]: [string, AnalyzeNewsParams]): Promise<AnalyzeNewsResponse> => {
  const userKey = getStoredApiKey();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(userKey ? { 'x-gemini-api-key': userKey } : {})
    },
    body: JSON.stringify({
      url: params.url,
      title: params.title,
      body: params.body,
      ticker: params.ticker,
      type: params.type,
      apiKey: userKey || undefined,
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || 'Failed to fetch AI news analysis');
  }

  return res.json();
};

/**
 * 共有AIキャッシュ付き ニュース分析 SWR フック
 * クライアント側でも Stale-While-Revalidate により瞬時にキャッシュを再利用
 */
export function useAnalyzeNews(params: AnalyzeNewsParams) {
  const shouldFetch = params.enabled !== false && (!!params.title || !!params.url);

  // SWR キャッシュキー
  const key = shouldFetch
    ? ['/api/analyze-news', { url: params.url, title: params.title, body: params.body, ticker: params.ticker, type: params.type }]
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<AnalyzeNewsResponse>(
    key,
    fetcher as any,
    {
      revalidateOnFocus: false,      // フォーカス時の不要な再リクエスト防止
      revalidateIfStale: false,      // AI分析結果は静的・不変のため再検証不要
      dedupingInterval: 120000,      // 2分間クライアント内での重複実行を完全防止
    }
  );

  return {
    data,
    error,
    isLoading: isLoading || (shouldFetch && !data && !error),
    isCached: !!data?.cached,
    cachedAt: data?.cached_at,
    isValidating,
    mutate,
  };
}
