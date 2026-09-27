import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 環境変数定義
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Supabaseクライアントの初期化（URLとKeyがある場合）
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

// ========================================================
// インメモリ共有キャッシュ（Supabase接続前のフォールバック & 超高速レイヤー）
// サーバープロセス起動中、Geminiへの重複APIコールを完全に防ぎます。
// ========================================================
export interface CachedAnalysisRecord {
  id: string;
  content_hash: string;
  ticker: string;
  title: string;
  category: string;
  importance_score: number;
  summary: string;
  market_impact: any;
  partner_details: any;
  created_at: string;
}

// サーバー起動中のグローバルメモリキャッシュ
const memoryCacheStore = new Map<string, CachedAnalysisRecord>();

/**
 * キャッシュから分析結果を取得
 * 1. Supabaseが設定されていればSupabaseを優先照会
 * 2. 設定なしまたは失敗時はインメモリキャッシュを照会
 */
export async function getCachedAnalysis(contentHash: string): Promise<CachedAnalysisRecord | null> {
  // まずインメモリをチェック（超高速 0.01ms）
  if (memoryCacheStore.has(contentHash)) {
    return memoryCacheStore.get(contentHash)!;
  }

  // Supabaseが利用可能であればDBから照会
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('ai_analysis_cache')
        .select('*')
        .eq('content_hash', contentHash)
        .maybeSingle();

      if (!error && data) {
        // メモリ側にも載せておく
        memoryCacheStore.set(contentHash, data as CachedAnalysisRecord);
        return data as CachedAnalysisRecord;
      }
    } catch (err) {
      console.warn('Supabase cache query error (falling back to memory):', err);
    }
  }

  return null;
}

/**
 * 分析結果をキャッシュに保存
 * 1. SupabaseへINSERT (設定されている場合)
 * 2. インメモリキャッシュにも同時に保存
 */
export async function setCachedAnalysis(record: Omit<CachedAnalysisRecord, 'id' | 'created_at'>): Promise<CachedAnalysisRecord> {
  const newRecord: CachedAnalysisRecord = {
    ...record,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cache_${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  // メモリキャッシュに保存
  memoryCacheStore.set(record.content_hash, newRecord);

  // Supabaseが利用可能な場合はDBに永続化保存
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('ai_analysis_cache')
        .insert({
          content_hash: record.content_hash,
          ticker: record.ticker,
          title: record.title,
          category: record.category,
          importance_score: record.importance_score,
          summary: record.summary,
          market_impact: record.market_impact,
          partner_details: record.partner_details,
        })
        .select()
        .single();

      if (!error && data) {
        memoryCacheStore.set(record.content_hash, data as CachedAnalysisRecord);
        return data as CachedAnalysisRecord;
      } else if (error) {
        console.warn('Supabase cache insert warning:', error.message);
      }
    } catch (err) {
      console.warn('Supabase cache insert error:', err);
    }
  }

  return newRecord;
}
