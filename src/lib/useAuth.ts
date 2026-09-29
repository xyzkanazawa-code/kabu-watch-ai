'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  bio?: string;
  investorStyle?: string;
  password?: string;
  isLoggedIn: boolean;
}

// 投資家アバターの洗練されたプリセット一覧
export const AVATAR_PRESETS = [
  { id: 'pro', name: '敏腕投資家', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80' },
  { id: 'cyber', name: 'サイバー投資家', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80' },
  { id: 'bull', name: '強気ブル', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=160&q=80' },
  { id: 'analyst', name: 'AIアナリスト', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80' },
  { id: 'cat', name: '招き猫投資家', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=160&q=80' },
  { id: 'executive', name: 'ファンドマネージャー', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80' },
];

const LOCAL_USER_KEY = 'kabu_watch_ai_local_user_v1';

/**
 * ユーザー認証フック (会員登録・ログイン・プロフィール編集 & ローカル同期)
 */
export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      // 1. Supabaseのセッションをチェック
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            const u = session.user;
            setUser({
              id: u.id,
              email: u.email || '',
              name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'ユーザー',
              avatarUrl: u.user_metadata?.avatar_url || AVATAR_PRESETS[0].url,
              bio: u.user_metadata?.bio || '株式投資を楽しんでいます！',
              investorStyle: u.user_metadata?.investor_style || '現物長期・高配当狙い',
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
            avatarUrl: u.user_metadata?.avatar_url || AVATAR_PRESETS[0].url,
            bio: u.user_metadata?.bio || '株式投資を楽しんでいます！',
            investorStyle: u.user_metadata?.investor_style || '現物長期・高配当狙い',
            isLoggedIn: true,
          });
        } else {
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
   * ユーザー情報を保存
   */
  const saveUser = (newUser: UserProfile) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser));
    }
    setUser(newUser);
    window.dispatchEvent(new Event('kabu_watch_auth_changed'));
  };

const REGISTERED_USERS_DB_KEY = 'kabu_watch_users_registry_v1';

function getRegisteredUsers(): UserProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_DB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveRegisteredUser(userToSave: UserProfile) {
  if (typeof window === 'undefined') return;
  try {
    const users = getRegisteredUsers();
    const existingIndex = users.findIndex(
      (u) => (u.email && u.email.toLowerCase() === userToSave.email.toLowerCase()) || (u.id === userToSave.id)
    );
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...userToSave };
    } else {
      users.push(userToSave);
    }
    localStorage.setItem(REGISTERED_USERS_DB_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save to users registry:', e);
  }
}

  /**
   * Googleでワンタップログイン
   */
  const signInWithGoogle = async () => {
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

    // Googleアカウント模倣のログイン（過去に保存されていればそれを復元）
    const existingUsers = getRegisteredUsers();
    const found = existingUsers.find((u) => u.email === 'investor.masa@gmail.com');

    const defaultUser: UserProfile = found
      ? { ...found, isLoggedIn: true }
      : {
          id: `usr_${Date.now()}`,
          email: 'investor.masa@gmail.com',
          name: 'マサ（投資家）',
          avatarUrl: AVATAR_PRESETS[0].url,
          bio: '成長株と好業績バリュー株をAIで監視中。',
          investorStyle: '現物・スイングトレード',
          isLoggedIn: true,
        };
    saveRegisteredUser(defaultUser);
    saveUser(defaultUser);
  };

  /**
   * 新規会員登録（名前・メール・アバター・パスワード）
   */
  const signUp = (name: string, email: string, avatarUrl?: string, investorStyle?: string, password?: string) => {
    const targetEmail = email.trim() || `${name.trim().toLowerCase()}@kabu-watch.ai`;
    const cleanName = name.trim() || '新規投資家';
    const cleanAvatar = avatarUrl || AVATAR_PRESETS[0].url;

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      email: targetEmail,
      name: cleanName,
      avatarUrl: cleanAvatar,
      bio: '株ウォッチAIで自分専用の持株と仮想売買を追跡中！',
      investorStyle: investorStyle || '現物長期・高配当狙い',
      password: password?.trim() || undefined,
      isLoggedIn: true,
    };

    saveRegisteredUser(newUser);
    saveUser(newUser);
    return newUser;
  };

  /**
   * メールアドレスでのログイン（過去に登録された名前・アバターを完全復元）
   */
  const signInWithEmail = (email: string, name?: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const existingUsers = getRegisteredUsers();
    
    // 過去に登録されたユーザー情報があるか検索
    const foundUser = existingUsers.find(
      (u) => (u.email && u.email.toLowerCase() === cleanEmail) || (name && u.name === name.trim())
    );

    let loggedInUser: UserProfile;

    if (foundUser) {
      // 過去の登録データ（名前、アバター、投資スタイル、自己紹介）を完全復元！
      loggedInUser = {
        ...foundUser,
        name: name?.trim() || foundUser.name,
        isLoggedIn: true,
      };
    } else {
      // 初回ログインの場合は新規保存
      loggedInUser = {
        id: `usr_${Date.now()}`,
        email: cleanEmail,
        name: name?.trim() || cleanEmail.split('@')[0] || '投資家メンバー',
        avatarUrl: AVATAR_PRESETS[0].url,
        bio: '株式投資・売買シミュレーション中',
        investorStyle: '現物長期・高配当狙い',
        password: password?.trim() || undefined,
        isLoggedIn: true,
      };
    }

    saveRegisteredUser(loggedInUser);
    saveUser(loggedInUser);
    return loggedInUser;
  };

  /**
   * プロフィール編集（名前、アバター、自己紹介、投資スタイル）
   */
  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      ...updates,
      isLoggedIn: true,
    };
    saveRegisteredUser(updated);
    saveUser(updated);
    return updated;
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
    signInWithEmail,
    signUp,
    updateProfile,
    signOut,
  };
}
