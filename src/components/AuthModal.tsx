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
  const { signInWithEmail, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  
  // フォームステート
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].url);
  const [investorStyle, setInvestorStyle] = useState('現物長期・高配当狙い');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetEmail = email.trim();
    const targetName = name.trim();

    if (!targetEmail && !targetName) {
      setError('Gmail / メールアドレスまたはお名前を入力してください');
      return;
    }

    // Gmailからニックネームを自動推定
    const resolvedName = targetName || (targetEmail.includes('@') ? targetEmail.split('@')[0] : targetEmail);
    const resolvedEmail = targetEmail || `${resolvedName}@gmail.com`;

    if (mode === 'signup') {
      signUp(resolvedName, resolvedEmail, selectedAvatar, investorStyle, password);
      onClose();
    } else {
      signInWithEmail(resolvedEmail, resolvedName, password);
      onClose();
    }
  };

  const handleDemoLogin = (demoName: string, demoEmail: string) => {
    signInWithEmail(demoEmail, demoName);
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

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {/* Gmail / メールアドレス入力（最優先入力） */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                Gmail / メールアドレス
              </span>
              <span className="text-[10px] text-cyan-400 font-normal">Gmailですぐ登録・ログイン</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="例: masa@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-cyan-500/30 focus:border-cyan-400 focus:outline-none text-white text-xs placeholder-gray-500 transition-colors shadow-inner"
              autoFocus
            />
          </div>

          {/* 名前入力（任意） */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                お名前 / ニックネーム
              </span>
              <span className="text-[10px] text-gray-500 font-normal">(空欄ならGmail名を使用)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: マサ"
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
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>{mode === 'signup' ? 'Gmailで無料登録してはじめる' : 'Gmailでログインする'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* クイックワンタップ・デモ登録 */}
        <div className="mt-5 pt-4 border-t border-gray-800/80 text-center">
          <p className="text-[11px] text-gray-500 mb-2">入力なしですぐに試したい方はこちら</p>
          <button
            type="button"
            onClick={() => handleDemoLogin('マサ（投資家）', 'investor.masa@gmail.com')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-cyan-500/50 text-cyan-300 text-xs font-semibold transition-all cursor-pointer shadow-md"
          >
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span>「マサ（投資家）」としてワンタップログイン</span>
          </button>
        </div>

      </div>
    </div>
  );
};
