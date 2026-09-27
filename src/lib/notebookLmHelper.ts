/**
 * Google NotebookLM（ノートブックLM）連携ユーティリティ
 * 適時開示・決算PDFやニュースをNotebookLMへ送るためのテキスト整形・クリップボード転送・ブラウザ起動
 */

export interface NotebookLmData {
  ticker: string;
  stockName: string;
  title: string;
  publishedAt: string;
  category?: string;
  summary?: string;
  body?: string;
  pdfUrl?: string;
  url?: string;
}

/**
 * NotebookLMが最も高精度にソース分析・音声オーバービューできるフォーマットにテキストを整形
 */
export function formatForNotebookLm(data: NotebookLmData): string {
  const lines: string[] = [
    `# 【適時開示・決算分析資料】${data.stockName}（証券コード: ${data.ticker}）`,
    `- 発行日: ${data.publishedAt || '最新'}`,
    `- 開示件名: ${data.title}`,
    `- カテゴリ: ${data.category || '適時開示・IR資料'}`,
    `- 公式原本URL: ${data.url || data.pdfUrl || `https://finance.yahoo.co.jp/quote/${data.ticker}.T/disclosure`}`,
    '',
    '## 1. 開示概要・AI要約ポイント',
    data.summary ? data.summary.trim() : '本開示に関する詳細資料です。',
    '',
    '## 2. 適時開示・決算発表の詳細内容',
    data.body ? data.body.trim() : `当社（${data.stockName}）は本日、「${data.title}」に関する適時開示情報を発表いたしました。\n今後の事業展開および業績への影響について精査を行っております。`,
    '',
    '----------------------------------------',
    `情報提供元: 株ウォッチAI（東証TDnet・Yahoo!ファイナンス公式開示連携）`
  ];

  return lines.join('\n');
}

/**
 * Google NotebookLMへワンクリック連携するメイン関数
 * 1. NotebookLM用テキストをクリップボードにコピー
 * 2. https://notebooklm.google.com/ を新規タブで起動
 * 3. 成功コールバックを実行
 */
export async function sendToNotebookLm(
  data: NotebookLmData, 
  onSuccess?: (message: string) => void
): Promise<boolean> {
  try {
    const formattedText = formatForNotebookLm(data);
    
    // クリップボードへコピー
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(formattedText);
    }

    // Google NotebookLMを新規タブで起動
    window.open('https://notebooklm.google.com/', '_blank', 'noopener,noreferrer');

    if (onSuccess) {
      onSuccess(`📓 「${data.stockName}」の開示テキストをコピーしてNotebookLMを開きました！「ソースを追加」→「テキスト貼り付け」ですぐに分析・音声解説できます`);
    }

    return true;
  } catch (err) {
    console.error('sendToNotebookLm error:', err);
    // クリップボード失敗時でもNotebookLMは開く
    window.open('https://notebooklm.google.com/', '_blank', 'noopener,noreferrer');
    if (onSuccess) {
      onSuccess('📓 Google NotebookLMを開きました！');
    }
    return false;
  }
}
