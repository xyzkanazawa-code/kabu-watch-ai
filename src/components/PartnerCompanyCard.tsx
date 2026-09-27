'use client';

import React from 'react';
import { PartnerCompanyInfo } from '@/types/stock';
import { Building2, Sparkles, MapPin, User, Calendar, Briefcase, TrendingUp, Users, X, ArrowRightLeft } from 'lucide-react';

interface PartnerCompanyCardProps {
  partner: PartnerCompanyInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PartnerCompanyCard: React.FC<PartnerCompanyCardProps> = ({
  partner,
  isOpen,
  onClose
}) => {
  if (!isOpen || !partner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#111827] border border-rose-500/40 rounded-2xl shadow-2xl shadow-rose-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#0B0F19]/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  提携相手 自動深掘りインテリジェンス
                </span>
                <span className="text-xs text-gray-400 border border-gray-700 px-2 py-0.5 rounded">
                  {partner.listedStatus}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {partner.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* AI シナジー予測 (Core Highlight) */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 via-purple-950/40 to-gray-900 border border-rose-500/30 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 animate-pulse" /> AIシナジー予測分析「この提携で何が変わるか？」
            </div>
            <p className="text-xs text-rose-100 font-medium leading-relaxed bg-black/40 p-3 rounded-lg border border-rose-500/20">
              {partner.synergyPrediction}
            </p>
          </div>

          {/* 提携の核心内容 */}
          <div className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 space-y-1.5">
            <h3 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4 text-cyan-400" /> 今回の提携の核心内容
            </h3>
            <p className="text-xs text-gray-200 leading-relaxed font-semibold">
              {partner.partnershipCore}
            </p>
          </div>

          {/* 相手先企業スペック Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            <div className="p-3.5 rounded-xl bg-gray-900/70 border border-gray-800 space-y-2">
              <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-gray-400" /> 事業内容
              </span>
              <p className="text-xs text-gray-200">{partner.business}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-900/70 border border-gray-800 space-y-2">
              <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> 直近業績規模
              </span>
              <p className="text-xs text-emerald-300 font-mono font-bold">{partner.recentRevenue}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-900/70 border border-gray-800 space-y-2">
              <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-400" /> 代表者 / 設立 / 所在地
              </span>
              <p className="text-xs text-gray-300">
                {partner.representative} | 設立: {partner.established}
              </p>
              <p className="text-[11px] text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {partner.location}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-900/70 border border-gray-800 space-y-2">
              <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-gray-400" /> 主要株主 / 過去の関係性
              </span>
              <div className="text-xs text-gray-300">
                <span className="text-gray-500">過去関係: </span>{partner.pastRelationship}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {partner.majorShareholders.map((s, idx) => (
                  <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                    {s}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* 主な商品・サービス */}
          {partner.mainProducts && partner.mainProducts.length > 0 && (
            <div className="p-3.5 rounded-xl bg-gray-900/50 border border-gray-800">
              <span className="text-[11px] font-semibold text-gray-400 block mb-1.5">
                主な製品・サービス・ブランド:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {partner.mainProducts.map((prod, idx) => (
                  <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-gray-800 text-rose-300 font-medium border border-gray-700">
                    {prod}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
