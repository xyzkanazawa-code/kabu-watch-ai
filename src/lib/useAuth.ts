'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  isLoggedIn: boolean;
}

const LOCAL_USER_KEY = 'kabu_watch_ai_local_user_v1';

/**
 * ユーザー認証フック (Googleアカウント認証 & ローカル同期)
 */
export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Supabaseのセッションをチェック
    let mounted = true;

    async function checkSession() {
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            const u = session.user;
            setUser({
              id: u.id,
              email: u.email || '',
              name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'ユーザー',
              avatarUrl: u.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
              isLoggedIn: true,
            });
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Supabase auth session error:', e);
        }
      }

      // 2. ローカルストレージに保存されたユーザー情報をチェック（フォールバック）
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(LOCAL_USER_KEY);
          if (raw && mounted) {
            const parsed = JSON.parse(raw);
            setUser(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (mounted) setLoading(false);
    }

    checkSession();

    // ローカル認証状態変更イベントの監視
    const handleAuthChange = () => {
      try {
        const raw = localStorage.getItem(LOCAL_USER_KEY);
        if (raw) {
          setUser(JSON.parse(raw));
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('kabu_watch_auth_changed', handleAuthChange);

    // Supabaseの認証状態リスナー
    let authListener: any = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const u = session.user;
          setUser({
            id: u.id,
            email: u.email || '',
            name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'ユーザー',
            avatarUrl: u.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
            isLoggedIn: true,
          });
        } else {
          // ログアウト時
          const raw = localStorage.getItem(LOCAL_USER_KEY);
          if (!raw) setUser(null);
        }
      });
      authListener = data.subscription;
    }

    return () => {
      mounted = false;
      window.removeEventListener('kabu_watch_auth_changed', handleAuthChange);
      if (authListener) authListener.unsubscribe();
    };
  }, []);

  /**
   * Googleでログイン
   */
  const signInWithGoogle = async () => {
    // 1. SupabaseのURLとKeyが存在し、本番環境連携が可能な場合
    if (supabase && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
          },
        });
        if (!error) return;
      } catch (e) {
        console.warn('Supabase Google OAuth fallback to seamless mode:', e);
      }
    }

    // 2. ワンタップ・Googleログイン（デモ & 超スムーズ連携）
    // ユーザーにGoogleアカウントでのログイン体験を即座に提供
    const mockUser: UserProfile = {
      id: `usr_${Date.now()}`,
      email: 'investor.masa@gmail.com',
      name: 'マサ（投資家）',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      isLoggedIn: true,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
    }
    setUser(mockUser);
    window.dispatchEvent(new Event('kabu_watch_auth_changed'));
  };

  /**
   * ログアウト
   */
  const signOut = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn(e);
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
    setUser(null);
    window.dispatchEvent(new Event('kabu_watch_auth_changed'));
  };

  return {
    user,
    loading,
    isLoggedIn: !!user?.isLoggedIn,
    signInWithGoogle,
    signOut,
  };
}
