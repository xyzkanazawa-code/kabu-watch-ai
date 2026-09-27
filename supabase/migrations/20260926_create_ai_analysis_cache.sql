-- ========================================================
-- 株ウォッチAI: 共有AIキャッシュ層 (Gemini無料枠最適化)
-- テーブル名: ai_analysis_cache
-- ========================================================

CREATE TABLE IF NOT EXISTS public.ai_analysis_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_hash TEXT UNIQUE NOT NULL,
    ticker VARCHAR(10) NOT NULL,
    title TEXT NOT NULL,
    category VARCHAR(50),
    importance_score INT CHECK (importance_score BETWEEN 1 AND 5),
    summary TEXT,
    market_impact JSONB NOT NULL,
    partner_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_content_hash ON public.ai_analysis_cache (content_hash);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_ticker ON public.ai_analysis_cache (ticker);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_created_at ON public.ai_analysis_cache (created_at DESC);

ALTER TABLE public.ai_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access on ai_analysis_cache"
ON public.ai_analysis_cache
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow service role insert on ai_analysis_cache"
ON public.ai_analysis_cache
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Allow anon insert on ai_analysis_cache"
ON public.ai_analysis_cache
FOR INSERT
TO anon
WITH CHECK (true);
