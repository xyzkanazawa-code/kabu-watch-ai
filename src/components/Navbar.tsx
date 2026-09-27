import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Search, Sparkles, TrendingUp, BellRing, Star, Newspaper, Briefcase, 
  Trophy, Calendar, KeyRound, Zap, LogIn, LogOut, User, Settings, Users, Flame 
} from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { getStoredApiKey } from '@/lib/apiKeyStorage';
import { ApiKeyModal } from './ApiKeyModal';

interface NavbarProps {
  onOpenSearch: () => void;
  favoritesCount: number;
  hasNewAlerts?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch, favoritesCount, hasNewAlerts }) => {
  const pathname = usePathname();
  const { user, isLoggedIn, signInWithGoogle, signOut } = useAuth();
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // APIキーの有無を監視
  useEffect(() => {
    const checkKey = () => {
      setHasApiKey(!!getStoredApiKey());
    };
    checkKey();

    window.addEventListener('kabu_watch_api_key_changed', checkKey);
    return () => {
      window.removeEventListener('kabu_watch_api_key_changed', checkKey);
    };
  }, []);

  return (
    <>
      {/* Top Header Navigation (2段構成でスマホでも溢れない設計) */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0B0F19]/90 border-b border-gray-800/80 px-3 sm:px-4 py-2.5 shadow-lg">
        <div className="max-w-7xl mx-auto space-y-2">
          
          {/* 上段: ロゴ ＆ 検索バー ＆ ログイン/アカウント ＆ 無料キー */}
          <div className="flex items-center justify-between gap-2">
            
            {/* Logo & Brand */}
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-600 p-0.5 shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all">
                <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-mono">
                  株<span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">ウォッチAI</span>
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  PWA
                </span>
              </div>
            </Link>

            {/* Center Search Bar Trigger (PC/Tablet) */}
            <button
              onClick={onOpenSearch}
              className="flex-1 max-w-xs mx-2 hidden md:flex items-center justify-between px-3 py-1.5 rounded-xl bg-gray-900/90 border border-gray-800 hover:border-emerald-500/50 text-gray-400 text-xs transition-all group shadow-inner"
            >
              <div className="flex items-center gap-2 truncate">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
                <span className="truncate">「7203」「日経」「半導体」で検索...</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-semibold text-gray-400 bg-gray-800 border border-gray-700 rounded shadow shrink-0">
                ⌘K
              </kbd>
            </button>

            {/* 右側アクション（検索アイコン、無料キー、Googleログイン） */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              
              {/* スマホ用検索ボタン */}
              <button
                onClick={onOpenSearch}
                className="md:hidden p-2 rounded-xl bg-gray-900 border border-gray-800 text-cyan-400 hover:bg-gray-800 active:scale-95 transition-all"
                title="コード・銘柄検索"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* 🔑 Gemini API無料枠バッジ (BYOK) */}
              <button
                onClick={() => setIsApiKeyModalOpen(true)}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                  hasApiKey
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 shadow-sm'
                    : 'bg-gradient-to-r from-purple-950/60 to-pink-950/60 border-purple-500/40 text-purple-300 hover:border-purple-400 shadow-md shadow-purple-500/10 animate-pulse'
                }`}
                title={hasApiKey ? 'Gemini API無料枠が有効です（クリックでキー管理）' : 'Gemini無料キーを設定してAI機能を解放'}
              >
                {hasApiKey ? <Zap className="w-3.5 h-3.5 text-emerald-400" /> : <KeyRound className="w-3.5 h-3.5 text-purple-400" />}
                <span className="hidden sm:inline">{hasApiKey ? 'AIキー: 有効' : '無料キー'}</span>
              </button>

              {/* 👤 Googleログイン / アカウント */}
              {isLoggedIn && user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1.5 p-1 pl-2 rounded-xl bg-gray-900 border border-emerald-500/50 hover:border-emerald-400 transition-all text-left shadow-sm"
                  >
                    <span className="text-xs font-bold text-gray-200 max-w-[80px] sm:max-w-[120px] truncate">
                      {user.name}
                    </span>
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-7 h-7 rounded-lg object-cover border border-emerald-500/40 shadow-sm shrink-0"
                    />
                  </button>

                  {/* ドロップダウンメニュー */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#111827] border border-gray-800 rounded-2xl shadow-2xl py-1.5 z-50 animate-fadeIn">
                      <div className="px-3.5 py-2 border-b border-gray-800">
                        <span className="text-xs font-bold text-white block truncate">{user.name}</span>
                        <span className="text-[10px] text-gray-400 block truncate">{user.email}</span>
                      </div>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsApiKeyModalOpen(true);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs text-gray-300 hover:text-white hover:bg-gray-800 flex items-center gap-2 transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Gemini APIキー設定</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          signOut();
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>ログアウト</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => signInWithGoogle()}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-white/10 active:scale-95 transition-all shrink-0 cursor-pointer"
                  title="Googleアカウントでワンタップログイン"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Googleログイン</span>
                </button>
              )}

            </div>
          </div>

          {/* 下段: メニューナビゲーションバー（スマホでも横スクロール＆見やすく2段目配置） */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 no-scrollbar text-xs">
            {/* 🏆 Rankings Link */}
            <Link
              href="/rankings"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border shrink-0 transition-all ${
                pathname === '/rankings'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/20'
                  : 'bg-gray-900/90 border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>急変動</span>
            </Link>

            {/* 📅 Weekend Picks Link */}
            <Link
              href="/weekend-picks"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border shrink-0 transition-all ${
                pathname === '/weekend-picks'
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-md shadow-purple-500/20'
                  : 'bg-gray-900/90 border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>週末厳選</span>
            </Link>

            {/* 👥 Community Ranking Link */}
            <Link
              href="/community"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border shrink-0 transition-all ${
                pathname === '/community'
                  ? 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/20'
                  : 'bg-gray-900/90 border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>コミュニティ</span>
            </Link>

            {/* 🔥 Rumors Link */}
            <Link
              href="/rumors"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border shrink-0 transition-all ${
                pathname === '/rumors'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/20'
                  : 'bg-gray-900/90 border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span>噂の株</span>
            </Link>

            {/* Portfolio Link */}
            <Link
              href="/portfolio"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border shrink-0 transition-all ${
                pathname === '/portfolio'
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/20'
                  : 'bg-gray-900/90 border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
              <span>資産管理</span>
            </Link>

            {/* Whats-New Quick Link Badge */}
            <Link
              href="/whats-new"
              className={`relative flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold border shrink-0 transition-all ${
                pathname === '/whats-new'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20'
                  : 'bg-gray-900/90 border-gray-800 text-gray-300 hover:border-gray-700'
              } ${hasNewAlerts ? 'animate-glow' : ''}`}
            >
              <BellRing className={`w-3.5 h-3.5 ${hasNewAlerts ? 'text-emerald-400 animate-bounce' : 'text-gray-400'}`} />
              <span>昨日からの変化</span>
              {hasNewAlerts && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
              )}
            </Link>
          </div>

        </div>
      </header>

      {/* 🔑 APIキー設定モーダル */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSuccess={() => setHasApiKey(true)}
      />

      {/* Bottom PWA Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F19]/95 backdrop-blur-xl border-t border-gray-800/80 md:hidden py-1 px-1">
        <div className="flex items-center justify-around">
          
          <Link
            href="/"
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium transition-all ${
              pathname === '/' ? 'text-emerald-400 font-bold scale-105' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>ホーム</span>
          </Link>

          <Link
            href="/rankings"
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium transition-all ${
              pathname === '/rankings' ? 'text-amber-400 font-bold scale-105' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>順位</span>
          </Link>

          <Link
            href="/community"
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium transition-all ${
              pathname === '/community' ? 'text-amber-400 font-bold scale-105' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>仲間</span>
          </Link>

          <Link
            href="/rumors"
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium transition-all ${
              pathname === '/rumors' ? 'text-rose-400 font-bold scale-105' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Flame className="w-4 h-4 text-rose-500" />
            <span>噂の株</span>
          </Link>

          <Link
            href="/portfolio"
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium transition-all ${
              pathname === '/portfolio' ? 'text-cyan-400 font-bold scale-105' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>資産</span>
          </Link>

          <button
            onClick={onOpenSearch}
            className="flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium text-cyan-400 hover:text-cyan-300 transition-all"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>検索</span>
          </button>

        </div>
      </nav>
    </>
  );
};
