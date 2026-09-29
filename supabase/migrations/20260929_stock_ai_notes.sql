-- ========================================================
-- 株ウォッチAI: 外部AI調査メモ・見解共有テーブル
-- テーブル名: stock_ai_notes
-- 全ユーザーが投稿・閲覧可能な共有ナレッジベース
-- ========================================================

CREATE TABLE IF NOT EXISTS public.stock_ai_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker VARCHAR(10) NOT NULL,
    ai_type VARCHAR(50) NOT NULL, -- 'gemini', 'chatgpt', 'claude', 'perplexity', 'deepseek', 'other'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_name TEXT DEFAULT '投資家メンバー',
    author_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 検索・ソート用インデックス（銘柄コード + 投稿日時降順）
CREATE INDEX IF NOT EXISTS idx_stock_ai_notes_ticker_created 
ON public.stock_ai_notes (ticker, created_at DESC);

-- Row Level Security (RLS) 設定
ALTER TABLE public.stock_ai_notes ENABLE ROW LEVEL SECURITY;

-- 全員（匿名ユーザー・全訪問者）が閲覧可能
CREATE POLICY "Allow public read on stock_ai_notes"
ON public.stock_ai_notes
FOR SELECT
TO public
USING (true);

-- 登録許可
CREATE POLICY "Allow insert on stock_ai_notes"
ON public.stock_ai_notes
FOR INSERT
TO public
WITH CHECK (true);

-- 更新許可
CREATE POLICY "Allow update on stock_ai_notes"
ON public.stock_ai_notes
FOR UPDATE
TO public
USING (true);

-- 削除許可
CREATE POLICY "Allow delete on stock_ai_notes"
ON public.stock_ai_notes
FOR DELETE
TO public
USING (true);
