'use client';

import { STOCK_MASTER } from './dataFetcher';

const FAVORITES_KEY = 'kabu_watch_favorites';
const FAVORITES_META_KEY = 'kabu_watch_favorites_meta';
const READ_ITEMS_KEY = 'kabu_watch_read_items';
const LAST_ACCESS_KEY = 'kabu_watch_last_access';
const LOCAL_USER_KEY = 'kabu_watch_ai_local_user_v1';

export interface FavoriteStockMeta {
  ticker: string;
  name: string;
  sector?: string;
  price?: number;
  changePercent?: number;
  updatedAt?: number;
}

/**
 * ログイン中ユーザーかどうかのチェック
 */
export function isUserLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (!raw) return false;
    const user = JSON.parse(raw);
    return !!user?.isLoggedIn;
  } catch {
    return false;
  }
}

export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  // 未ログイン（フリーユーザー）時はお気に入りを表示しない（セキュリティ＆会員特典保護）
  if (!isUserLoggedIn()) {
    return [];
  }

  try {
    const data = localStorage.getItem(FAVORITES_KEY);
    if (!data) {
      // ログイン会員の初期デフォルト銘柄
      const defaults = ['7203', '6920', '9984', '6758'];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(data);
  } catch {
    return ['7203', '6920', '9984', '6758'];
  }
}

export function getAllFavoriteMetas(): Record<string, FavoriteStockMeta> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(FAVORITES_META_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function getFavoriteMeta(ticker: string): FavoriteStockMeta | null {
  if (STOCK_MASTER[ticker]) {
    const s = STOCK_MASTER[ticker];
    return {
      ticker: s.ticker,
      name: s.name,
      sector: s.sector,
      price: s.price,
      changePercent: s.changePercent,
    };
  }
  const allMetas = getAllFavoriteMetas();
  return allMetas[ticker] || null;
}

export function saveFavoriteMeta(ticker: string, meta: Partial<FavoriteStockMeta>): void {
  if (typeof window === 'undefined') return;
  try {
    const allMetas = getAllFavoriteMetas();
    const existing = allMetas[ticker] || { ticker, name: meta.name || `銘柄 (${ticker})` };
    allMetas[ticker] = {
      ...existing,
      ...meta,
      ticker,
      name: meta.name || existing.name || `銘柄 (${ticker})`,
      updatedAt: Date.now()
    };
    localStorage.setItem(FAVORITES_META_KEY, JSON.stringify(allMetas));
  } catch (err) {
    console.warn('saveFavoriteMeta error:', err);
  }
}

export function addFavorite(
  ticker: string, 
  meta?: { name?: string; sector?: string; price?: number; changePercent?: number }
): string[] {
  if (!isUserLoggedIn()) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kabu_watch_open_auth_modal'));
    }
    return [];
  }

  const current = getFavorites();
  
  // 会社名メタデータがあれば保存
  if (meta && meta.name) {
    saveFavoriteMeta(ticker, {
      ticker,
      name: meta.name,
      sector: meta.sector,
      price: meta.price,
      changePercent: meta.changePercent
    });
  } else if (STOCK_MASTER[ticker]) {
    const s = STOCK_MASTER[ticker];
    saveFavoriteMeta(ticker, {
      ticker: s.ticker,
      name: s.name,
      sector: s.sector,
      price: s.price,
      changePercent: s.changePercent
    });
  }

  if (!current.includes(ticker)) {
    const next = [...current, ticker];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    return next;
  }
  return current;
}

export const addToWatchlist = addFavorite;

export function removeFavorite(ticker: string): string[] {
  const current = getFavorites();
  const next = current.filter(t => t !== ticker);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next;
}

export function isFavorite(ticker: string): boolean {
  return getFavorites().includes(ticker);
}

export function getReadItemIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(READ_ITEMS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function markItemAsRead(itemId: string): void {
  const current = getReadItemIds();
  if (!current.includes(itemId)) {
    const next = [...current, itemId];
    localStorage.setItem(READ_ITEMS_KEY, JSON.stringify(next));
  }
}

export function getLastAccessTimestamp(): string {
  if (typeof window === 'undefined') return new Date().toISOString();
  try {
    const data = localStorage.getItem(LAST_ACCESS_KEY);
    if (!data) {
      const now = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 昨日の日時を初期セット
      localStorage.setItem(LAST_ACCESS_KEY, now);
      return now;
    }
    return data;
  } catch {
    return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  }
}

export function updateLastAccessTimestamp(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_ACCESS_KEY, new Date().toISOString());
}
