-- ========================================================
-- 株ウォッチAI: 共有AIキャッシュ層 (Gemini無料枠最適化)
-- テーブル名: ai_analysis_cache
-- ========================================================

-- テーブル作成
CREATE TABLE IF NOT EXISTS public.ai_analysis_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_hash TEXT UNIQUE NOT NULL,               -- ニュースURLまたは(ticker+title)のSHA-256ハッシュ
    ticker VARCHAR(10) NOT NULL,                    -- 銘柄コード (例: 7203, 6920)
    title TEXT NOT NULL,                            -- ニュース/開示タイトル
    category VARCHAR(50),                           -- 決算、提携、業績修正など
    importance_score INT CHECK (importance_score BETWEEN 1 AND 5), -- 重要度 (1〜5)
    summary TEXT,                                   -- 3行要約
    market_impact JSONB NOT NULL,                   -- 売上・利益・業績予想・競合・短期/長期への影響
    partner_details JSONB,                          -- 提携先企業情報・シナジー予測（該当する場合のみ）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- クエリ高速化用インデックス
CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_content_hash ON public.ai_analysis_cache (content_hash);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_ticker ON public.ai_analysis_cache (ticker);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_created_at ON public.ai_analysis_cache (created_at DESC);

-- Row Level Security (RLS) 設定
ALTER TABLE public.ai_analysis_cache ENABLE ROW LEVEL SECURITY;

-- 全員（匿名ユーザー含め）読み取り可能ポリシー
CREATE POLICY "Allow public read-only access on ai_analysis_cache"
ON public.ai_analysis_cache
FOR SELECT
TO public
USING (true);

-- サービスロール（サーバー側API）による挿入・更新許可
CREATE POLICY "Allow service role insert on ai_analysis_cache"
ON public.ai_analysis_cache
FOR INSERT
TO service_role
WITH CHECK (true);

-- 匿名ユーザーからのINSERTも許可（クライアント直接またはANON_KEY使用時）
CREATE POLICY "Allow anon insert on ai_analysis_cache"
ON public.ai_analysis_cache
FOR INSERT
TO anon
WITH CHECK (true);

-- ========================================================
-- 市場ランキングとAI急変動分析キャッシュ
-- ========================================================
CREATE TABLE IF NOT EXISTS public.market_rankings_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_type VARCHAR(50) NOT NULL, -- 'gainers', 'losers', 'volume', 'stop_high', 'stop_low'
  rank_position INT NOT NULL,
  ticker VARCHAR(10) NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  change_percent NUMERIC NOT NULL,
  volume BIGINT NOT NULL,
  ai_reason TEXT,
  updated_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ranking_type, rank_position, updated_date)
);

CREATE INDEX IF NOT EXISTS idx_market_rankings_cache_query 
ON public.market_rankings_cache (ranking_type, updated_date);

ALTER TABLE public.market_rankings_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access on market_rankings_cache"
ON public.market_rankings_cache FOR SELECT TO public USING (true);
CREATE POLICY "Allow insert on market_rankings_cache"
ON public.market_rankings_cache FOR INSERT TO public WITH CHECK (true);

-- ========================================================
-- 週末AIおすすめ銘柄スクリーニング
-- ========================================================
CREATE TABLE IF NOT EXISTS public.weekend_stock_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_date DATE NOT NULL,
  horizon VARCHAR(20) NOT NULL, -- 'short', 'mid', 'long'
  ticker VARCHAR(10) NOT NULL,
  name TEXT NOT NULL,
  current_price NUMERIC NOT NULL,
  sector TEXT NOT NULL,
  catalyst TEXT NOT NULL,
  ai_analysis TEXT NOT NULL,
  risk_factors TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekend_stock_picks_date_horizon 
ON public.weekend_stock_picks (target_date, horizon);

ALTER TABLE public.weekend_stock_picks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access on weekend_stock_picks"
ON public.weekend_stock_picks FOR SELECT TO public USING (true);
CREATE POLICY "Allow insert on weekend_stock_picks"
ON public.weekend_stock_picks FOR INSERT TO public WITH CHECK (true);

