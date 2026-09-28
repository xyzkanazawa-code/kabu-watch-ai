'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, AVATAR_PRESETS } from '@/lib/useAuth';
import { X, User, Check, Sparkles, Image, ShieldCheck, Heart, Save, LogOut, Lock, Eye, EyeOff, Key } from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STYLE_OPTIONS = [
  '現物長期・高配当狙い',
  '短期スイングトレード',
  'グロース成長株集中',
  'デイトレード・スキャルピング',
  'インデックス・ETF積立',
  '適時開示・テーマ株物色',
];

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, signOut } = useAuth();
  
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [investorStyle, setInvestorStyle] = useState('');
  const [customAvatar, setCustomAvatar] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatarUrl(user.avatarUrl || AVATAR_PRESETS[0].url);
      setBio(user.bio || '');
      setInvestorStyle(user.investorStyle || STYLE_OPTIONS[0]);
      setPassword('');
      setShowPassword(false);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: any = {
      name: name.trim() || user.name,
      avatarUrl: customAvatar.trim() || avatarUrl,
      bio: bio.trim(),
      investorStyle: investorStyle || STYLE_OPTIONS[0],
    };
    if (password.trim()) {
      updates.password = password.trim();
    }
    updateProfile(updates);
    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-[#111827] border border-cyan-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-cyan-950/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景の光彩 */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors"
          title="閉じる"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ヘッダー */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">プロフィール設定・編集</h2>
            <p className="text-xs text-gray-400">名前やお好みのアバターアイコンを変更できます</p>
          </div>
        </div>

        {savedMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4" />
            <span>プロフィールを保存しました！</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          
          {/* 現在のアバタープレビュー ＆ 選択 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 block">
              アバターアイコン
            </label>

            {/* プレビュー表示 */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-950/80 border border-gray-800">
              <img
                src={customAvatar.trim() || avatarUrl}
                alt={name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-500/50 shadow-md"
              />
              <div className="space-y-1">
                <span className="text-xs font-bold text-white block">{name || 'お名前未設定'}</span>
                <span className="text-[11px] text-cyan-400 font-mono block">{investorStyle}</span>
              </div>
            </div>

            {/* プリセット選択 */}
            <div className="grid grid-cols-6 gap-2 pt-1">
              {AVATAR_PRESETS.map((av) => {
                const isSelected = (avatarUrl === av.url && !customAvatar);
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(av.url);
                      setCustomAvatar('');
                    }}
                    className={`relative p-0.5 rounded-xl transition-all ${
                      isSelected 
                        ? 'ring-2 ring-cyan-400 scale-105' 
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    title={av.name}
                  >
                    <img
                      src={av.url}
                      alt={av.name}
                      className="w-full aspect-square rounded-[10px] object-cover"
                    />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-400 rounded-full flex items-center justify-center shadow">
                        <Check className="w-2.5 h-2.5 text-black font-extrabold" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* カスタム画像URL入力 */}
            <div className="pt-1">
              <input
                type="text"
                value={customAvatar}
                onChange={(e) => setCustomAvatar(e.target.value)}
                placeholder="画像URLを指定する場合（https://...）"
                className="w-full px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-[11px] text-gray-300 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 名前・ニックネーム */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 block">
              お名前 / ニックネーム
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: マサ（投資家）"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-cyan-500 focus:outline-none text-white text-xs transition-colors"
              required
            />
          </div>

          {/* 投資スタイル */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 block">
              主な投資スタイル
            </label>
            <select
              value={investorStyle}
              onChange={(e) => setInvestorStyle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-cyan-500 focus:outline-none text-white text-xs transition-colors"
            >
              {STYLE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* 自己紹介 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 block">
              ひとこと自己紹介 / メモ
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="注目のセクターや今年の目標など"
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-gray-950 border border-gray-800 focus:border-cyan-500 focus:outline-none text-white text-xs transition-colors resize-none"
            />
          </div>

          {/* 🔐 パスワードの設定・変更 */}
          <div className="space-y-1.5 pt-1 border-t border-gray-800/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>パスワードの設定・変更</span>
              </label>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                user?.password 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {user?.password ? '● パスワード設定済み' : '▲ パスワード未設定'}
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={user?.password ? '変更したい場合のみ新しいパスワードを入力' : 'パスワードを設定（4文字以上推奨）'}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-cyan-500 focus:outline-none text-white text-xs transition-colors placeholder:text-gray-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                title={showPassword ? '隠す' : '表示する'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-gray-500">
              ※パスワードを設定しておくと、他の端末や別ブラウザからログインする際のセキュリティ保護になります。
            </p>
          </div>

          {/* 保存ボタン */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 mt-2"
          >
            <Save className="w-4 h-4" />
            <span>変更内容を保存する</span>
          </button>
        </form>

        {/* 🚪 アカウントの削除・ログアウトボタン */}
        <div className="pt-4 mt-4 border-t border-gray-800/80 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">この端末のログイン情報をクリア</span>
          <button
            type="button"
            onClick={() => {
              signOut();
              onClose();
            }}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>アカウントを消去・ログアウト</span>
          </button>
        </div>

      </div>
    </div>
  );
};
