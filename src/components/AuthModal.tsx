'use client';

import React, { useState } from 'react';
import { useAuth, AVATAR_PRESETS } from '@/lib/useAuth';
import { 
  X, Lock, Sparkles, User, Mail, ShieldCheck, Check, 
  ArrowRight, Briefcase, Star, ShoppingCart, UserCheck
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  message?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
  message
}) => {
  const { signInWithGoogle, signInWithEmail, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  
  // フォームステート
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].url);
  const [investorStyle, setInvestorStyle] = useState('現物長期・高配当狙い');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('お名前（ニックネーム）を入力してください');
        return;
      }
      signUp(name, email || `${name}@kabu-watch.ai`, selectedAvatar, investorStyle);
      onClose();
    } else {
      if (!email.trim() && !name.trim()) {
        setError('メールアドレスまたはお名前を入力してください');
        return;
      }
      signInWithEmail(email || `${name}@kabu-watch.ai`, name);
      onClose();
    }
  };

  const handleDemoLogin = (demoName: string) => {
    signUp(demoName, `${demoName.toLowerCase()}@kabu-watch.ai`, AVATAR_PRESETS[0].url, '現物長期・高配当狙い');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-[#111827] border border-cyan-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-cyan-950/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景装飾 */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors"
          title="閉じる"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ヘッダーアイコン & タイトル */}
        <div className="text-center space-y-2 mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-400 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {mode === 'signup' ? '無料会員登録で全機能を解放' : '株ウォッチAIへログイン'}
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
            {message || '持株の登録・管理やお気に入り、仮想取引シミュレーションは会員限定機能です。売買ランキングはどなたでもご覧いただけます。'}
          </p>
        </div>

        {/* タブ切り替え */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-gray-900 rounded-xl border border-gray-800 mb-5">
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'signup' 
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-black shadow-md font-extrabold' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            新規会員登録（無料）
          </button>
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(''); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'signin' 
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-black shadow-md font-extrabold' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ログイン
          </button>
        </div>

        {/* Googleワンタップボタン */}
        <button
          type="button"
          onClick={async () => {
            await signInWithGoogle();
            onClose();
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs flex items-center justify-center gap-2.5 shadow-md shadow-white/10 active:scale-95 transition-all mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>Googleアカウントでログイン</span>
        </button>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-gray-800 w-full" />
          <span className="bg-[#111827] px-3 text-[11px] text-gray-500 font-mono uppercase">またはお名前で簡単登録</span>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {/* 名前入力 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              お名前 / ニックネーム
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: マサ（投資家）"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-cyan-500 focus:outline-none text-white text-xs placeholder-gray-600 transition-colors"
            />
          </div>

          {/* メールアドレス入力（任意） */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              メールアドレス {mode === 'signup' && <span className="text-[10px] text-gray-500">(任意・省略可)</span>}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="例: masa@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-cyan-500 focus:outline-none text-white text-xs placeholder-gray-600 transition-colors"
            />
          </div>

          {/* アバター選択 (新規登録時のみ) */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 block">
                アバターアイコンを選択
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_PRESETS.map((av) => {
                  const isSelected = selectedAvatar === av.url;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar(av.url)}
                      className={`relative p-0.5 rounded-xl transition-all ${
                        isSelected 
                          ? 'ring-2 ring-cyan-400 scale-105' 
                          : 'opacity-60 hover:opacity-100 hover:scale-100'
                      }`}
                      title={av.name}
                    >
                      <img
                        src={av.url}
                        alt={av.name}
                        className="w-full aspect-square rounded-[10px] object-cover"
                      />
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-400 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-black font-extrabold" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 送信ボタン */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span>{mode === 'signup' ? '無料で会員登録してはじめる' : 'ログインする'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* クイックワンタップ・デモ登録 */}
        <div className="mt-5 pt-4 border-t border-gray-800/80 text-center">
          <p className="text-[11px] text-gray-500 mb-2">すぐに試したい方はこちら</p>
          <button
            type="button"
            onClick={() => handleDemoLogin('マサ（投資家）')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-cyan-500/50 text-cyan-300 text-xs font-semibold transition-all"
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>「マサ（投資家）」として1秒でログイン</span>
          </button>
        </div>

      </div>
    </div>
  );
};
