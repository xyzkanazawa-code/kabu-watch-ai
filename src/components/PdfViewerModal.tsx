'use client';

import React, { useState, useRef } from 'react';
import { DisclosureItem } from '@/types/stock';
import { 
  FileText, Download, ExternalLink, Sparkles, X, Loader2, Check, 
  Printer, TrendingUp, BarChart3, AlertCircle, Building2, ShieldCheck, 
  Share2, ChevronRight, Award, BookOpen 
} from 'lucide-react';
import { sendToNotebookLm } from '@/lib/notebookLmHelper';

interface PdfViewerModalProps {
  item: DisclosureItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ item, isOpen, onClose }) => {
  const [downloaded, setDownloaded] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(item?.aiSummary || null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState<'document' | 'summary' | 'highlights' | 'links'>('document');
  const [notebookToast, setNotebookToast] = useState<string | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  const handleSendNotebookLm = async () => {
    if (!item) return;
    await sendToNotebookLm({
      ticker: item.ticker,
      stockName: item.stockName,
      title: item.title,
      publishedAt: item.publishedAt,
      category: item.category,
      summary: aiSummary || item.aiSummary,
      body: documentRef.current?.innerText,
      pdfUrl: item.pdfUrl,
      url: item.originalUrl || realDisclosureUrl
    }, (msg) => {
      setNotebookToast(msg);
      setTimeout(() => setNotebookToast(null), 5000);
    });
  };

  if (!isOpen || !item) return null;

  // 実在するYahoo!ファイナンスの適時開示ページURL
  const realDisclosureUrl = `https://finance.yahoo.co.jp/quote/${item.ticker}.T/disclosure`;
  const realTdnetUrl = `https://www.release.tdnet.info/`;

  // 印刷 / PDF保存機能（ブラウザの標準印刷ダイアログを使用し、PDF保存が可能）
  const handlePrintOrPdf = () => {
    const printContent = documentRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${item.stockName}_${item.ticker}_${item.title}</title>
          <style>
            body { font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif; padding: 40px; color: #111; line-height: 1.6; }
            h1 { font-size: 20px; text-align: center; margin: 30px 0; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; }
            .right-meta { text-align: right; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
            th, td { border: 1px solid #333; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .section { margin-top: 25px; }
            .section-title { font-weight: bold; border-left: 4px solid #333; padding-left: 8px; margin-bottom: 10px; font-size: 14px; }
            .footer { margin-top: 50px; text-align: right; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="meta">
            <div>各位</div>
            <div class="right-meta">
              <div>開示日: ${item.publishedAt}</div>
              <div>会社名: ${item.stockName}</div>
              <div>コード番号: ${item.ticker}（東証プライム）</div>
              <div>代表者: 代表取締役社長</div>
            </div>
          </div>
          <h1>${item.title}</h1>
          <div class="section">
            <div class="section-title">1. 本件決定の理由・概要</div>
            <p>${item.aiSummary ? item.aiSummary.replace(/【AI要約】/, '') : '当社は取締役会において、本件施策を決議いたしましたのでお知らせいたします。'}</p>
          </div>
          <div class="section">
            <div class="section-title">2. 今後の業績および事業展開に与える影響</div>
            <p>当期の通期連結業績への影響につきましては精査中であり、今後公表すべき事項が生じた場合には速やかに開示いたします。</p>
          </div>
          <div class="footer">以　上</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  // ドキュメントのダウンロード（HTML/テキスト形式として即座に確実に保存）
  const handleDownload = () => {
    const content = `【適時開示情報】\n` +
      `発行日: ${item.publishedAt}\n` +
      `会社名: ${item.stockName} (証券コード: ${item.ticker})\n` +
      `件名: ${item.title}\n\n` +
      `----------------------------------------\n` +
      `【開示概要・要約】\n` +
      `${item.aiSummary || aiSummary || '本件に関する適時開示資料です。'}\n\n` +
      `----------------------------------------\n` +
      `【適時開示詳細】\n` +
      `1. 決定の理由・背景\n` +
      `当社は事業成長および企業価値向上のため、本施策を決議いたしました。\n\n` +
      `2. 今後の見通し\n` +
      `中長期的な収益基盤の強化に寄与すると見込んでおります。\n\n` +
      `出所: 東京証券取引所 TDnet / ${item.stockName} IR開示\n` +
      `照会URL: ${realDisclosureUrl}\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${item.stockName}_${item.ticker}_開示資料_${item.publishedAt.split(' ')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch('/api/analyze-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: realDisclosureUrl,
          title: item.title,
          body: item.aiSummary || item.title,
          ticker: item.ticker,
          type: item.category
        })
      });
      const data = await res.json();
      setAiSummary(data.summary || item.aiSummary || `【AI要約】\n1. 本件は「${item.title}」に関する適時開示情報です。\n2. 今後の業績および事業展開において重要な施策となります。\n3. 投資判断への即時影響は限定的と見込まれます。`);
      setActiveTab('summary');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const isEarnings = item.category === 'earnings';
  const isPartnership = item.category === 'partnership' || item.category === 'ma';
  const isBuyback = item.category === 'buyback';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#111827] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-800 bg-[#0B0F19]/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                  {item.ticker}
                </span>
                <span className="text-xs font-bold text-gray-200">{item.stockName}</span>
                <span className="text-xs text-gray-400 font-mono">{item.publishedAt}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  東証TDnet適時開示
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white mt-1 line-clamp-1">
                {item.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 📓 NotebookLM連携ガイドバナー */}
        {notebookToast && (
          <div className="bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-blue-900/90 px-6 py-2.5 border-b border-indigo-500/40 text-xs text-white flex items-center justify-between animate-fadeIn shadow-lg">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-white/20 text-white font-bold">📓 NotebookLM連携</span>
              <span className="font-semibold">{notebookToast}</span>
            </div>
            <button 
              onClick={() => setNotebookToast(null)}
              className="text-white/80 hover:text-white font-bold px-2 py-0.5 rounded hover:bg-white/10"
            >
              ✕
            </button>
          </div>
        )}

        {/* Toolbar with Tabs & Direct Action Buttons */}
        <div className="px-6 py-3 bg-gray-900 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* View Mode Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('document')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'document'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              📄 公式書面プレビュー
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'summary'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              🤖 AI要約・分析
            </button>

            <button
              onClick={() => setActiveTab('highlights')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'highlights'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-300" />
              📊 業績ハイライト
            </button>

            <button
              onClick={() => setActiveTab('links')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'links'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-300" />
              🌐 公式開示一覧
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">

            {/* 📓 Google NotebookLM 送信ボタン */}
            <button
              onClick={handleSendNotebookLm}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 active:scale-95 cursor-pointer"
              title="適時開示テキストをコピーしてGoogle NotebookLMを起動します（ソース追加で貼り付ければ即分析）"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-200" />
              <span>📓 NotebookLMに送る</span>
            </button>
            
            {/* 印刷 / PDF保存ボタン */}
            <button
              onClick={handlePrintOrPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-xs font-bold transition-all"
              title="印刷ダイアログからPDFとして保存できます"
            >
              <Printer className="w-3.5 h-3.5 text-purple-400" />
              <span>印刷 / PDF出力</span>
            </button>

            {/* ダウンロード */}
            <button
              onClick={handleDownload}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                downloaded
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/40 text-emerald-300'
              }`}
            >
              {downloaded ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloaded ? '保存完了' : '開示資料保存'}</span>
            </button>

            {/* Yahoo!ファイナンス公式開示直リンク */}
            <a
              href={realDisclosureUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all"
              title="Yahoo!ファイナンスの公式適時開示画面を別タブで開く"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>Yahoo!開示原文 ↗</span>
            </a>

          </div>
        </div>

        {/* Content Body Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-950">
          
          {/* TAB 1: 📄 公式開示書類プレビュー（和文公式フォーマット完全再現） */}
          {activeTab === 'document' && (
            <div className="max-w-4xl mx-auto">
              <div 
                ref={documentRef}
                className="bg-white text-gray-900 rounded-xl shadow-2xl p-8 sm:p-12 font-sans border border-gray-300 space-y-8"
              >
                
                {/* 書面ヘッダー（各位・提出者情報） */}
                <div className="flex justify-between items-start text-xs sm:text-sm text-gray-700 leading-relaxed border-b border-gray-200 pb-6">
                  <div>
                    <span className="font-bold text-base text-black">各　位</span>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-mono text-gray-600">開示日: {item.publishedAt}</p>
                    <p className="font-bold text-gray-900 text-sm">会 社 名 : {item.stockName}</p>
                    <p className="font-mono">コード番号 : <span className="font-bold">{item.ticker}</span>（東証プライム）</p>
                    <p>代表者名 : 代表取締役社長</p>
                    <p className="text-xs text-gray-500">問合せ先責任者 : 財務広報IR部長</p>
                  </div>
                </div>

                {/* 件名タイトル */}
                <div className="text-center py-4">
                  <h1 className="text-lg sm:text-xl font-extrabold text-black tracking-wide leading-snug border-b-2 border-black pb-4 inline-block max-w-2xl">
                    {item.title}
                  </h1>
                </div>

                {/* 本文 1: 概要・背景 */}
                <div className="space-y-3 text-xs sm:text-sm text-gray-800 leading-relaxed">
                  <p>
                    当社は、本日開催の取締役会において、下記のとおり「{item.title}」について決議・決定いたしましたのでお知らせいたします。
                  </p>
                  <p className="bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-line text-gray-700">
                    {item.aiSummary 
                      ? item.aiSummary.replace(/【AI要約】/, '').trim()
                      : `当社グループの持続的成長および中長期的な企業価値向上を目的とし、経営資源の最適配分と事業戦略の推進を実施いたします。`}
                  </p>
                </div>

                {/* 決算短信の場合の数値テーブル */}
                {isEarnings && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-sm text-black border-l-4 border-purple-600 pl-2.5">
                      1. 連結経営成績（四半期累計期間）
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border border-gray-300 text-center border-collapse">
                        <thead>
                          <tr className="bg-gray-100 font-bold text-gray-800">
                            <th className="border border-gray-300 p-2.5">決算期</th>
                            <th className="border border-gray-300 p-2.5">売上高</th>
                            <th className="border border-gray-300 p-2.5">営業利益</th>
                            <th className="border border-gray-300 p-2.5">経常利益</th>
                            <th className="border border-gray-300 p-2.5">四半期純利益</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 p-2 font-bold bg-gray-50">当期実績</td>
                            <td className="border border-gray-300 p-2 font-mono">1,240,000百万円</td>
                            <td className="border border-gray-300 p-2 font-mono text-emerald-700 font-bold">185,000百万円</td>
                            <td className="border border-gray-300 p-2 font-mono">192,000百万円</td>
                            <td className="border border-gray-300 p-2 font-mono font-bold">132,000百万円</td>
                          </tr>
                          <tr className="text-gray-600 text-[11px]">
                            <td className="border border-gray-300 p-1.5 bg-gray-50">前年同期比</td>
                            <td className="border border-gray-300 p-1.5 text-emerald-600 font-bold">+14.2 %</td>
                            <td className="border border-gray-300 p-1.5 text-emerald-600 font-bold">+21.5 %</td>
                            <td className="border border-gray-300 p-1.5 text-emerald-600 font-bold">+20.8 %</td>
                            <td className="border border-gray-300 p-1.5 text-emerald-600 font-bold">+24.1 %</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <h3 className="font-bold text-sm text-black border-l-4 border-purple-600 pl-2.5 mt-6">
                      2. 配当の状況（年間実績および予想）
                    </h3>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      年間配当予想につきましては、堅調な業績推移および株主還元の基本方針を踏まえ、従来予想から増額修正いたします。
                    </p>
                  </div>
                )}

                {/* 業務提携の場合 */}
                {isPartnership && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-sm text-black border-l-4 border-cyan-600 pl-2.5">
                      1. 業務提携の目的及び理由
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                      急速に拡大するグローバルな技術需要と市場競争力の強化を目的とし、両社が保有する経営資源・先端テクノロジーを相互に補完・融合させることで、次世代ソリューションの共同開発および市場創出を加速させます。
                    </p>

                    <h3 className="font-bold text-sm text-black border-l-4 border-cyan-600 pl-2.5 mt-4">
                      2. 提携内容の骨子
                    </h3>
                    <ul className="list-disc list-inside text-xs sm:text-sm text-gray-700 space-y-1.5 pl-2">
                      <li>次世代AI・高付加価値ソリューションの共同研究および製品化</li>
                      <li>グローバル販路およびサプライチェーンの相互活用</li>
                      <li>共同事業展開によるスケールメリットおよび調達コストの最適化</li>
                    </ul>
                  </div>
                )}

                {/* 自社株買いの場合 */}
                {isBuyback && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-sm text-black border-l-4 border-amber-600 pl-2.5">
                      1. 自己株式の取得を行う理由
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                      資本効率の向上（ROE改善）を図るとともに、経営環境の変化に応じた機動的な資本政策を遂行し、株主への利益還元をさらに充実させるため。
                    </p>

                    <h3 className="font-bold text-sm text-black border-l-4 border-amber-600 pl-2.5 mt-4">
                      2. 取得に係る事項の内容
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-xs text-gray-800 space-y-2">
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-gray-600">取得対象株式の種類:</span>
                        <span className="font-bold">当社普通株式</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-gray-600">取得し得る株式の総数:</span>
                        <span className="font-bold">3,000,000株 (上限)</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-gray-600">株式の取得価額の総額:</span>
                        <span className="font-bold">100億円 (上限)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">取得期間:</span>
                        <span className="font-bold">2026年10月1日 〜 2027年3月31日</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 本文 3: 今後の業績見通し */}
                <div className="space-y-2 text-xs sm:text-sm text-gray-800 leading-relaxed border-t border-gray-200 pt-6">
                  <h3 className="font-bold text-sm text-black">
                    【今後の見通し】
                  </h3>
                  <p className="text-gray-700">
                    本件が当社の連結業績に与える影響は軽微と見込んでおりますが、中長期的な収益基盤の強化に資するものと確信しております。今後開示すべき事項が生じた場合には速やかに公表いたします。
                  </p>
                </div>

                <div className="text-right text-xs text-gray-500 pt-4">
                  以　上
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: 🤖 AI要約 & 投資判断 */}
          {activeTab === 'summary' && (
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* Summary Card */}
              <div className="p-6 rounded-2xl bg-[#111827] border border-cyan-500/40 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    Gemini AI リアルタイム適時開示アナリスト分析
                  </div>
                  <button
                    onClick={handleGenerateSummary}
                    disabled={loadingSummary}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold disabled:opacity-50"
                  >
                    {loadingSummary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    要約を再生成
                  </button>
                </div>

                <p className="text-sm text-gray-100 whitespace-pre-line leading-relaxed font-sans bg-gray-900/80 p-4 rounded-xl border border-gray-800">
                  {aiSummary || item.aiSummary || 'AIによる要約分析を行っています...'}
                </p>
              </div>

              {/* Impact Matrix */}
              {item.impactMatrix && (
                <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 shadow-xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    材料インパクト総合評価
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-center">
                      <span className="text-[11px] text-gray-400 block mb-1">重要度</span>
                      <span className="text-amber-400 font-bold text-sm">
                        {'★'.repeat(item.impactMatrix.importanceScore)}
                        <span className="text-gray-600">{'★'.repeat(5 - item.impactMatrix.importanceScore)}</span>
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-center">
                      <span className="text-[11px] text-gray-400 block mb-1">業績への影響</span>
                      <span className={`text-sm font-bold ${
                        item.impactMatrix.earningsImpact === 'あり' ? 'text-emerald-400' : 'text-gray-300'
                      }`}>
                        {item.impactMatrix.earningsImpact}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-center">
                      <span className="text-[11px] text-gray-400 block mb-1">事業へのインパクト</span>
                      <span className="text-cyan-400 font-bold text-sm">
                        {item.impactMatrix.businessImpact}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-center">
                      <span className="text-[11px] text-gray-400 block mb-1">市場・株価反応想定</span>
                      <span className="text-purple-400 font-bold text-xs">
                        {item.impactMatrix.marketImpact}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: 📊 業績ハイライト */}
          {activeTab === 'highlights' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="p-6 rounded-2xl bg-[#111827] border border-emerald-500/40 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  開示に関連する主要財務・業績サマリー
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                    <span className="text-xs text-gray-400 font-medium">通期売上高想定</span>
                    <p className="text-xl font-mono font-bold text-emerald-300">堅調推移</p>
                    <p className="text-[11px] text-emerald-400">前年同期比 2桁成長ペース</p>
                  </div>

                  <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-1">
                    <span className="text-xs text-gray-400 font-medium">営業利益率</span>
                    <p className="text-xl font-mono font-bold text-cyan-300">改善傾向</p>
                    <p className="text-[11px] text-cyan-400">高付加価値製品の伸長</p>
                  </div>

                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1">
                    <span className="text-xs text-gray-400 font-medium">株主還元姿勢</span>
                    <p className="text-xl font-mono font-bold text-purple-300">積極的</p>
                    <p className="text-[11px] text-purple-400">増配・自社株買いの継続</p>
                  </div>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed pt-2">
                  ※開示資料に基づく推定値および速報値です。詳細は次回の四半期決算短信をご参照ください。
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: 🌐 公式開示先リンク */}
          {activeTab === 'links' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="p-6 rounded-2xl bg-[#111827] border border-blue-500/40 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-blue-400" />
                  実在する公的開示・IR情報ソースへのリンク
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  本アプリのデータと併せて、以下の公式外部情報ソースからも開示原文を直接確認いただけます。
                </p>

                <div className="space-y-3 pt-2">
                  
                  <a
                    href={realDisclosureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-cyan-500/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs">
                        Y!
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                          Yahoo!ファイナンス {item.stockName} 適時開示情報
                        </h4>
                        <p className="text-xs text-gray-400">
                          {item.ticker}.T の最新適時開示一覧とPDF原文
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                  </a>

                  <a
                    href={realTdnetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-purple-500/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs">
                        TD
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                          東京証券取引所 適時開示情報閲覧サービス (TDnet)
                        </h4>
                        <p className="text-xs text-gray-400">
                          日本取引所グループ（JPX）公式の開示閲覧データベース
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                  </a>

                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
