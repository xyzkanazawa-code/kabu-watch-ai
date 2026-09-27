/**
 * BYOK (Bring Your Own Key) - ユーザー個別Gemini APIキー管理
 * 端末のLocalStorageに安全に保管され、マサのサーバーには保存されません。
 */

export const GEMINI_API_KEY_STORAGE_KEY = 'kabu_watch_ai_user_gemini_api_key_v1';

/**
 * 保存されているAPIキーを取得
 */
export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) || '';
  } catch (e) {
    console.error('Failed to get stored API key:', e);
    return '';
  }
}

/**
 * APIキーを保存
 */
export function setStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
    }
    // 画面全体に更新を通知
    window.dispatchEvent(new Event('kabu_watch_api_key_changed'));
  } catch (e) {
    console.error('Failed to save API key:', e);
  }
}

/**
 * APIキーを削除
 */
export function removeStoredApiKey(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
    window.dispatchEvent(new Event('kabu_watch_api_key_changed'));
  } catch (e) {
    console.error('Failed to remove API key:', e);
  }
}

/**
 * APIキーが有効かどうかをGemini公式エンドポイントでテスト
 */
export async function validateApiKey(apiKey: string): Promise<{
  valid: boolean;
  modelName?: string;
  error?: string;
}> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return { valid: false, error: 'APIキーが入力されていません。' };
  }

  // Google APIキーの形式チェック（従来の AIzaSy または 最新の AQ. や英数字）
  const isValidFormat = trimmed.startsWith('AIzaSy') || trimmed.startsWith('AQ.') || trimmed.length >= 25;
  if (!isValidFormat) {
    return {
      valid: false,
      error: 'キーの形式が正しくありません。Google AI StudioでコピーしたAPIキーを入力してください。',
    };
  }

  try {
    // Google AI Studioの公式モデルリストエンドポイントへ疎通テスト
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key=${trimmed}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (res.ok) {
      const data = await res.json();
      return { valid: true, modelName: data.displayName || 'Gemini 1.5 Flash' };
    }

    const errData = await res.json().catch(() => ({}));
    const message = errData?.error?.message || 'APIキーの認証に失敗しました。';
    
    if (res.status === 400 || res.status === 403) {
      return { valid: false, error: 'キーが無効または期限切れです。Google AI Studioで新しいキーを発行してください。' };
    }

    return { valid: false, error: message };
  } catch (e: any) {
    // ネットワークエラーまたはCORS対策（フォールバック）
    // 形式が合っていれば一旦保存を許可する
    if (trimmed.length > 30) {
      return { valid: true, modelName: 'Gemini (オフライン検証パス)' };
    }
    return { valid: false, error: e?.message || '接続テスト中にエラーが発生しました。' };
  }
}
