'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { WhatsNewDashboard } from '@/components/WhatsNewDashboard';
import { SemanticSearchModal } from '@/components/SemanticSearchModal';
import { getFavorites, getLastAccessTimestamp, updateLastAccessTimestamp } from '@/lib/storage';

export default function WhatsNewPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [diffs, setDiffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastAccessTime, setLastAccessTime] = useState<string>('');

  useEffect(() => {
    const favs = getFavorites();
    const lastTime = getLastAccessTimestamp();
    setFavorites(favs);
    setLastAccessTime(lastTime);

    loadWhatsNewDiffs(favs);
  }, []);

  const loadWhatsNewDiffs = async (favTickers: string[]) => {
    setLoading(true);
    try {
      const res = await fetch('/api/whats-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers: favTickers })
      });
      const data = await res.json();
      setDiffs(data.diffs || []);
      
      // 今回アクセスしたタイムスタンプを更新
      updateLastAccessTimestamp();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        favoritesCount={favorites.length}
        hasNewAlerts={diffs.some(d => d.hasGlow)}
      />

      <WhatsNewDashboard
        diffs={diffs}
        loading={loading}
        lastAccessTime={lastAccessTime}
      />

      <SemanticSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
