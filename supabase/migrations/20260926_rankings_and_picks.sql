-- ========================================================
-- 拡張マイグレーション: ランキングAI分析 ＆ 週末AI厳選銘柄
-- ========================================================

-- 1. 市場ランキングとAI分析の当日キャッシュ
CREATE TABLE IF NOT EXISTS public.market_rankings_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_type VARCHAR(50) NOT NULL, -- 'gainers', 'losers', 'volume', 'stop_high', 'stop_low'
  rank_position INT NOT NULL,
  ticker VARCHAR(10) NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  change_percent NUMERIC NOT NULL,
  volume BIGINT NOT NULL,
  ai_reason TEXT, -- なぜ上がったのか/下がったのか
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

-- 2. 週末AIおすすめ銘柄
CREATE TABLE IF NOT EXISTS public.weekend_stock_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_date DATE NOT NULL, -- 対象の土曜日の日付
  horizon VARCHAR(20) NOT NULL, -- 'short', 'mid', 'long'
  ticker VARCHAR(10) NOT NULL,
  name TEXT NOT NULL,
  current_price NUMERIC NOT NULL,
  sector TEXT NOT NULL,
  catalyst TEXT NOT NULL, -- 注目理由・材料
  ai_analysis TEXT NOT NULL, -- 詳細分析コメント
  risk_factors TEXT NOT NULL, -- リスク要因
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekend_stock_picks_date_horizon 
ON public.weekend_stock_picks (target_date, horizon);

ALTER TABLE public.weekend_stock_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access on weekend_stock_picks"
ON public.weekend_stock_picks FOR SELECT TO public USING (true);

CREATE POLICY "Allow insert on weekend_stock_picks"
ON public.weekend_stock_picks FOR INSERT TO public WITH CHECK (true);
