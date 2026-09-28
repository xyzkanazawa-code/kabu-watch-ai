// 店舗名・ブランド名・サービス名・略称から正式上場企業と証券コードを逆引きするマスター辞書 & 銘柄ルックアップ
import { STOCK_MASTER } from './dataFetcher';
import { PtsInfo } from '@/types/stock';

export interface BrandSuggestion {
  query: string;
  ticker: string;
  officialName: string;
  brandName: string;
  description: string;
  sector: string;
  price?: number;
}

// 全角数字・英字を半角数字・小文字に矯正する関数
export function normalizeStockInput(input: string): string {
  if (!input) return '';
  return input
    // 全角数字 (０-９) を半角 (0-9) に変換
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    // 全角英字 (Ａ-Ｚ, ａ-ｚ) を半角に変換
    .replace(/[Ａ-Ｚａ-ｚ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    // 全角スペースを半角スペースに
    .replace(/　/g, ' ')
    // アルファベットを小文字に統一
    .toLowerCase()
    .trim();
}

// 店舗名・ブランド名・略称と上場企業の網羅的マッピング
export const BRAND_TO_STOCK_MAP: Record<string, { ticker: string; officialName: string; brandName: string; description: string; sector: string }> = {
  // アパレル・日用品・雑貨
  'ユニクロ': { ticker: '9983', officialName: 'ファーストリテイリング', brandName: 'ユニクロ (UNIQLO)', description: '世界最大級のアパレルSPA。ユニクロ・GUを展開。', sector: '小売業' },
  'uniqlo': { ticker: '9983', officialName: 'ファーストリテイリング', brandName: 'ユニクロ (UNIQLO)', description: '世界最大級のアパレルSPA。ユニクロ・GUを展開。', sector: '小売業' },
  'gu': { ticker: '9983', officialName: 'ファーストリテイリング', brandName: 'ジーユー (GU)', description: 'ファーストリテイリング傘下の低価格アパレルブランド。', sector: '小売業' },
  'ジーユー': { ticker: '9983', officialName: 'ファーストリテイリング', brandName: 'ジーユー (GU)', description: 'ファーストリテイリング傘下の低価格アパレルブランド。', sector: '小売業' },
  '無印': { ticker: '7453', officialName: '良品計画', brandName: '無印良品 (MUJI)', description: '衣料品・生活雑貨・食品を展開するグローバルブランド「無印良品」。', sector: '小売業' },
  '無印良品': { ticker: '7453', officialName: '良品計画', brandName: '無印良品 (MUJI)', description: '衣料品・生活雑貨・食品を展開するグローバルブランド「無印良品」。', sector: '小売業' },
  'muji': { ticker: '7453', officialName: '良品計画', brandName: '無印良品 (MUJI)', description: '衣料品・生活雑貨・食品を展開するグローバルブランド「無印良品」。', sector: '小売業' },
  'ニトリ': { ticker: '9843', officialName: 'ニトリホールディングス', brandName: 'ニトリ / デコホーム', description: '家具・インテリアの製造小売り国内最大手。島忠も傘下。', sector: '小売業' },
  '島忠': { ticker: '9843', officialName: 'ニトリホールディングス', brandName: '島忠 (シマホ)', description: 'ホームセンター・家具店。ニトリHD傘下。', sector: '小売業' },
  'シマホ': { ticker: '9843', officialName: 'ニトリホールディングス', brandName: '島忠 (シマホ)', description: 'ホームセンター・家具店。ニトリHD傘下。', sector: '小売業' },
  'ワークマン': { ticker: '7564', officialName: 'ワークマン', brandName: 'WORKMAN / ワークマンプラス', description: '作業服・アウトドア・カジュアルウェアの高機能格安チェーン。', sector: '小売業' },
  'workman': { ticker: '7564', officialName: 'ワークマン', brandName: 'WORKMAN / ワークマンプラス', description: '作業服・アウトドア・カジュアルウェアの高機能格安チェーン。', sector: '小売業' },
  'しまむら': { ticker: '8227', officialName: 'しまむら', brandName: 'ファッションセンターしまむら / アベイル', description: '郊外中心にファストファッションを展開する衣料専門店大手。', sector: '小売業' },
  'アベイル': { ticker: '8227', officialName: 'しまむら', brandName: 'Avail (アベイル)', description: 'しまむら傘下のヤングカジュアル衣料専門店。', sector: '小売業' },
  'abcマート': { ticker: '2670', officialName: 'エービーシー・マート', brandName: 'ABC-MART', description: '靴・スニーカー小売の国内首位。', sector: '小売業' },
  'セリア': { ticker: '2782', officialName: 'セリア', brandName: 'Seria (セリア)', description: '100円ショップ業界2位。デザイン性・女性向け雑貨に強み。', sector: '小売業' },
  'seria': { ticker: '2782', officialName: 'セリア', brandName: 'Seria (セリア)', description: '100円ショップ業界2位。デザイン性・女性向け雑貨に強み。', sector: '小売業' },
  'キャンドゥ': { ticker: '2698', officialName: 'キャンドゥ', brandName: 'Can★Do (キャンドゥ)', description: '100円ショップ大手。イオン傘下。', sector: '小売業' },
  'ダイソー': { ticker: '2782', officialName: 'セリア (上場類似企業)', brandName: '100均（※ダイソーは大創産業で非上場）', description: '大創産業(DAISO)は非上場です。100均大手の上場企業としてはセリア(2782)やキャンドゥ(2698)があります。', sector: '小売業' },

  // ディスカウント・スーパー・コンビニ
  'ドンキ': { ticker: '7532', officialName: 'パン・パシフィック・インターナショナルHD', brandName: 'ドン・キホーテ / MEGAドンキ', description: '総合ディスカウント店「ドン・キホーテ」、ユニーを展開。', sector: '小売業' },
  'ドンキホーテ': { ticker: '7532', officialName: 'パン・パシフィック・インターナショナルHD', brandName: 'ドン・キホーテ / MEGAドンキ', description: '総合ディスカウント店「ドン・キホーテ」、ユニーを展開。', sector: '小売業' },
  'ドン・キホーテ': { ticker: '7532', officialName: 'パン・パシフィック・インターナショナルHD', brandName: 'ドン・キホーテ / MEGAドンキ', description: '総合ディスカウント店「ドン・キホーテ」、ユニーを展開。', sector: '小売業' },
  'セブン': { ticker: '3382', officialName: 'セブン＆アイ・ホールディングス', brandName: 'セブン-イレブン / イトーヨーカドー', description: '世界最大規模のコンビニ「セブン-イレブン」を展開する流通巨大企業。', sector: '小売業' },
  'セブンイレブン': { ticker: '3382', officialName: 'セブン＆アイ・ホールディングス', brandName: 'セブン-イレブン / イトーヨーカドー', description: '世界最大規模のコンビニ「セブン-イレブン」を展開する流通巨大企業。', sector: '小売業' },
  'イトーヨーカドー': { ticker: '3382', officialName: 'セブン＆アイ・ホールディングス', brandName: 'イトーヨーカドー / ヨークベニマル', description: 'セブン＆アイ傘下の総合スーパー事業。', sector: '小売業' },
  'ファミマ': { ticker: '8001', officialName: '伊藤忠商事 (親会社)', brandName: 'ファミリーマート (伊藤忠商事傘下)', description: 'ファミリーマートは伊藤忠商事(8001)の完全子会社です。', sector: '卸売業' },
  'ファミリーマート': { ticker: '8001', officialName: '伊藤忠商事 (親会社)', brandName: 'ファミリーマート (伊藤忠商事傘下)', description: 'ファミリーマートは伊藤忠商事(8001)の完全子会社です。', sector: '卸売業' },
  'ローソン': { ticker: '9433', officialName: 'KDDI / 三菱商事 (共同親会社)', brandName: 'ローソン (KDDI・三菱商事傘下)', description: 'ローソンはKDDI(9433)および三菱商事(8058)が共同経営しています。', sector: '情報・通信業' },
  'イオン': { ticker: '8267', officialName: 'イオン', brandName: 'イオン / マックスバリュ / トップバリュ', description: '総合スーパー(GMS)・ショッピングモール国内最大手。', sector: '小売業' },
  'マックスバリュ': { ticker: '8267', officialName: 'イオン', brandName: 'マックスバリュ (イオン傘下)', description: 'イオングループの食品スーパーチェーン。', sector: '小売業' },
  'ミニストップ': { ticker: '9946', officialName: 'ミニストップ', brandName: 'MINISTOP', description: 'イオングループのファストフード併設型コンビニ。', sector: '小売業' },

  // 外食・レストラン・カフェ・ファストフード
  'マック': { ticker: '2702', officialName: '日本マクドナルドホールディングス', brandName: 'マクドナルド (McDonald\'s)', description: '国内ハンバーガーチェーン首位。圧倒的集客力とブランド力。', sector: '小売業' },
  'マクド': { ticker: '2702', officialName: '日本マクドナルドホールディングス', brandName: 'マクドナルド (McDonald\'s)', description: '国内ハンバーガーチェーン首位。圧倒的集客力とブランド力。', sector: '小売業' },
  'マクドナルド': { ticker: '2702', officialName: '日本マクドナルドホールディングス', brandName: 'マクドナルド (McDonald\'s)', description: '国内ハンバーガーチェーン首位。圧倒的集客力とブランド力。', sector: '小売業' },
  'スシロー': { ticker: '3563', officialName: 'FOOD & LIFE COMPANIES', brandName: 'スシロー / 杉玉 / 京樽', description: '回転寿司「スシロー」を運営する回転寿司売上首位企業。海外展開も加速。', sector: '小売業' },
  'くら寿司': { ticker: '2695', officialName: 'くら寿司', brandName: '無添くら寿司', description: '回転寿司大手。「ビッくらポン」や全皿抗菌カバーなど独自システム。', sector: '小売業' },
  'はま寿司': { ticker: '7550', officialName: 'ゼンショーホールディングス', brandName: 'はま寿司 / すき家 / なか卯 / ココス', description: '外食産業国内売上首位。すき家・はま寿司・なか卯・ココス・ロッテリアを展開。', sector: '小売業' },
  'すき家': { ticker: '7550', officialName: 'ゼンショーホールディングス', brandName: 'すき家 (ゼンショーHD)', description: '牛丼チェーン店舗数国内首位の「すき家」を中核とする外食最大手。', sector: '小売業' },
  'ココス': { ticker: '7550', officialName: 'ゼンショーホールディングス', brandName: 'ココス (COCO\'S)', description: 'ゼンショーHD傘下のファミリーレストランチェーン。', sector: '小売業' },
  'ロッテリア': { ticker: '7550', officialName: 'ゼンショーホールディングス', brandName: 'ロッテリア / ゼッテリア', description: 'ゼンショーHD傘下のハンバーガーチェーン。', sector: '小売業' },
  'サイゼ': { ticker: '7581', officialName: 'サイゼリヤ', brandName: 'サイゼリヤ (Saizeriya)', description: '低価格イタリアンレストラン。徹底した効率経営と直営農場で高利益率。', sector: '小売業' },
  'サイゼリヤ': { ticker: '7581', officialName: 'サイゼリヤ', brandName: 'サイゼリヤ (Saizeriya)', description: '低価格イタリアンレストラン。徹底した効率経営と直営農場で高利益率。', sector: '小売業' },
  'ガスト': { ticker: '3197', officialName: 'すかいらーくホールディングス', brandName: 'ガスト / バーミヤン / しゃぶ葉', description: 'ファミレス国内首位。ガスト・バーミヤン・ジョナサン・しゃぶ葉を展開。', sector: '小売業' },
  'バーミヤン': { ticker: '3197', officialName: 'すかいらーくホールディングス', brandName: 'バーミヤン (すかいらーくHD)', description: 'すかいらーく傘下の中華ファミリーレストラン。', sector: '小売業' },
  'しゃぶ葉': { ticker: '3197', officialName: 'すかいらーくホールディングス', brandName: 'しゃぶ葉 (すかいらーくHD)', description: 'すかいらーく傘下の高成長しゃぶしゃぶ食べ放題チェーン。', sector: '小売業' },
  '丸亀製麺': { ticker: '3397', officialName: 'トリドールホールディングス', brandName: '丸亀製麺 / コナズ珈琲', description: '讃岐うどん「丸亀製麺」を世界展開。積極的な海外M&Aで高成長。', sector: '小売業' },
  'トリドール': { ticker: '3397', officialName: 'トリドールホールディングス', brandName: '丸亀製麺 / コナズ珈琲', description: '讃岐うどん「丸亀製麺」を世界展開。積極的な海外M&Aで高成長。', sector: '小売業' },
  '吉野家': { ticker: '9861', officialName: '吉野家ホールディングス', brandName: '吉野家 / はなまるうどん', description: '牛丼の老舗パイオニア「吉野家」とうどんチェーン「はなまる」を展開。', sector: '小売業' },
  '松屋': { ticker: '9887', officialName: '松屋フーズホールディングス', brandName: '松屋 / 松のや (とんかつ)', description: '牛めし・定食「松屋」、とんかつ「松のや」を展開。', sector: '小売業' },
  '王将': { ticker: '9936', officialName: '王将フードサービス', brandName: '餃子の王将', description: '中華料理チェーン「餃子の王将」を展開。直営店の高い調理力で根強い人気。', sector: '小売業' },
  '餃子の王将': { ticker: '9936', officialName: '王将フードサービス', brandName: '餃子の王将', description: '中華料理チェーン「餃子の王将」を展開。', sector: '小売業' },
  'コメダ': { ticker: '3543', officialName: 'コメダホールディングス', brandName: '珈琲所コメダ珈琲店 / おかげ庵', description: 'フルサービス型喫茶店「コメダ珈琲店」を展開。FC比率が高く高収益。', sector: '小売業' },
  'コメダ珈琲': { ticker: '3543', officialName: 'コメダホールディングス', brandName: '珈琲所コメダ珈琲店', description: 'フルサービス型喫茶店「コメダ珈琲店」を展開。', sector: '小売業' },
  'ドトール': { ticker: '3087', officialName: 'ドトール・日レスホールディングス', brandName: 'ドトールコーヒー / 星乃珈琲店 / 洋麺屋五右衛門', description: 'コーヒーショップ「ドトール」や「星乃珈琲店」を展開。', sector: '小売業' },
  '星乃珈琲店': { ticker: '3087', officialName: 'ドトール・日レスホールディングス', brandName: '星乃珈琲店 (ドトール・日レスHD)', description: 'ハンドドリップ珈琲とスフレパンケーキの喫茶チェーン。', sector: '小売業' },
  'スターバックス': { ticker: '2587', officialName: 'サントリー食品 / 米国株SBUX', brandName: 'スターバックス（※日本法人は非上場・米SBUX子会社）', description: 'スターバックス日本法人は上場廃止し米SBUX完全子会社です。チルド飲料提携でサントリー食品(2587)が関連。', sector: '食料品' },

  // 家電・ホームセンター・ドラッグストア
  'ビックカメラ': { ticker: '3048', officialName: 'ビックカメラ', brandName: 'ビックカメラ / ソフマップ / コジマ', description: '都市型家電量販店大手。傘下にコジマ、ソフマップ。', sector: '小売業' },
  'コジマ': { ticker: '7513', officialName: 'コジマ', brandName: 'コジマ×ビックカメラ', description: '郊外型家電量販店。ビックカメラ傘下。', sector: '小売業' },
  'ヤマダ': { ticker: '9831', officialName: 'ヤマダホールディングス', brandName: 'ヤマダデンキ (Tecc LIFE SELECT)', description: '家電量販店首位。家具やリフォーム、住宅（ヒノキヤ）など多角化。', sector: '小売業' },
  'ヤマダ電機': { ticker: '9831', officialName: 'ヤマダホールディングス', brandName: 'ヤマダデンキ', description: '家電量販店首位。', sector: '小売業' },
  'エディオン': { ticker: '2730', officialName: 'エディオン', brandName: 'エディオン (EDION)', description: '中部・西日本地盤の家電量販店大手。ニトリと資本業務提携。', sector: '小売業' },
  'ケーズデンキ': { ticker: '8282', officialName: 'ケーズホールディングス', brandName: 'ケーズデンキ', description: '北関東地盤の家電量販店大手。完全現金値引き主義が特徴。', sector: '小売業' },
  'ヨドバシ': { ticker: '3048', officialName: 'ビックカメラ (上場競合)', brandName: 'ヨドバシカメラ（※非上場）', description: 'ヨドバシカメラは非上場企業です。上場している都市型家電量販店としてはビックカメラ(3048)があります。', sector: '小売業' },
  'マツキヨ': { ticker: '3088', officialName: 'マツキヨココカラ＆カンパニー', brandName: 'マツモトキヨシ / ココカラファイン', description: 'ドラッグストア国内大手。PB商品や都市型免税店に強み。', sector: '小売業' },
  'マツモトキヨシ': { ticker: '3088', officialName: 'マツキヨココカラ＆カンパニー', brandName: 'マツモトキヨシ', description: 'ドラッグストア国内大手。', sector: '小売業' },
  'ココカラファイン': { ticker: '3088', officialName: 'マツキヨココカラ＆カンパニー', brandName: 'ココカラファイン', description: 'マツモトキヨシと経営統合した大手ドラッグチェーン。', sector: '小売業' },
  'ウエルシア': { ticker: '3141', officialName: 'ウエルシアホールディングス', brandName: 'ウエルシア薬局 / ハックドラッグ', description: '調剤併設型ドラッグストア国内最大手。イオングループ中核。', sector: '小売業' },
  'ツルハ': { ticker: '3391', officialName: 'ツルハホールディングス', brandName: 'ツルハドラッグ / くすりの福太郎', description: '北海道・東北地盤のドラッグストア首位級。イオンとの経営統合を推進。', sector: '小売業' },
  'スギ薬局': { ticker: '7649', officialName: 'スギホールディングス', brandName: 'スギ薬局 / スギドラッグ', description: '中部地盤の調剤併設ドラッグストア大手。在宅医療に注力。', sector: '小売業' },
  'コーナン': { ticker: '7516', officialName: 'コーナン商事', brandName: 'ホームセンターコーナン / コーナンPRO', description: '近畿地盤のホームセンター大手。プロ向け店舗に強み。', sector: '小売業' },
  'コメリ': { ticker: '8218', officialName: 'コメリ', brandName: 'コメリパワー / コメリハード＆グリーン', description: '農業資材・園芸に強みを持つホームセンター首位級。地方小型店網。', sector: '小売業' },
  'カインズ': { ticker: '7516', officialName: 'コーナン商事 (上場競合)', brandName: 'カインズ（※ベイシアグループで非上場）', description: 'カインズは非上場です。上場ホームセンターとしてはコーナン商事(7516)、コメリ(8218)、DCM(3050)があります。', sector: '小売業' },

  // レジャー・エンタメ・ゲーム・ネットサービス
  'ディズニー': { ticker: '4661', officialName: 'オリエンタルランド', brandName: '東京ディズニーランド / 東京ディズニーシー', description: '東京ディズニーリゾートを運営。世界最高水準の集客力と入園客単価。', sector: 'サービス業' },
  'オリエンタルランド': { ticker: '4661', officialName: 'オリエンタルランド', brandName: '東京ディズニーリゾート', description: '東京ディズニーランド・シーを独占運営。', sector: 'サービス業' },
  'オリラン': { ticker: '4661', officialName: 'オリエンタルランド', brandName: '東京ディズニーリゾート', description: 'オリエンタルランドの略称。', sector: 'サービス業' },
  'メルカリ': { ticker: '4385', officialName: 'メルカリ', brandName: 'フリマアプリ メルカリ / メルペイ', description: '国内最大のフリマアプリ。米国事業や暗号資産取引サービスも展開。', sector: '情報・通信業' },
  'ヤフー': { ticker: '4689', officialName: 'LINEヤフー', brandName: 'Yahoo! JAPAN / LINE / PayPay', description: '国内最大のポータル「Yahoo! JAPAN」と通信アプリ「LINE」を統合。', sector: '情報・通信業' },
  'line': { ticker: '4689', officialName: 'LINEヤフー', brandName: 'LINE / Yahoo! JAPAN', description: '月間9,600万人超が利用するメッセージングインフラ。', sector: '情報・通信業' },
  'paypay': { ticker: '9434', officialName: 'ソフトバンク / LINEヤフー', brandName: 'PayPay (キャッシュレス決済)', description: '国内登録者6,000万人超のコード決済首位。ソフトバンク・LINEヤフー傘下。', sector: '情報・通信業' },
  '楽天': { ticker: '4755', officialName: '楽天グループ', brandName: '楽天市場 / 楽天カード / 楽天モバイル', description: '「楽天エコシステム」を展開。金融(カード・銀行・証券)が好収益源。', sector: 'サービス業' },
  'zozo': { ticker: '3092', officialName: 'ZOZO', brandName: 'ZOZOTOWN (ゾゾタウン)', description: 'ファッションECサイト「ZOZOTOWN」を運営。LINEヤフー傘下。', sector: '小売業' },
  'ゾゾ': { ticker: '3092', officialName: 'ZOZO', brandName: 'ZOZOTOWN', description: 'ファッション通販サイト首位。', sector: '小売業' },
  '出前館': { ticker: '2484', officialName: '出前館', brandName: '出前館', description: '国内最大級のフードデリバリーサービス。LINEヤフーグループ。', sector: 'サービス業' },
  'ゲオ': { ticker: '2681', officialName: 'ゲオホールディングス', brandName: 'GEO / セカンドストリート (2nd STREET)', description: 'リユースショップ「セカンドストリート」が成長牽引。メディアショップも運営。', sector: '小売業' },
  'セカスト': { ticker: '2681', officialName: 'ゲオホールディングス', brandName: 'セカンドストリート (2nd STREET)', description: 'ゲオ傘下のリユース衣料・雑貨専門店。', sector: '小売業' },
  'ブックオフ': { ticker: '9278', officialName: 'ブックオフグループホールディングス', brandName: 'BOOKOFF', description: '中古本・ソフト・トレカのリユースチェーン。', sector: '小売業' },
  'プレステ': { ticker: '6758', officialName: 'ソニーグループ', brandName: 'PlayStation (プレイステーション)', description: 'ソニーグループのゲーム＆ネットワークサービス部門（PS5）。', sector: '電気機器' },
  'switch': { ticker: '7974', officialName: '任天堂', brandName: 'Nintendo Switch / マリオ / ポケモン', description: '任天堂の家庭用・携帯一体型ゲーム機。', sector: 'その他製品' },
  'ガンダム': { ticker: '7832', officialName: 'バンダイナムコホールディングス', brandName: '機動戦士ガンダム / バンダイ / ナムコ', description: '玩具・ゲーム・アニメのエンタメ巨大企業。', sector: 'その他製品' },

  // 交通・旅行・航空
  'ana': { ticker: '9202', officialName: 'ANAホールディングス', brandName: '全日本空輸 (ANA)', description: '国内線・国際線旅客数国内首位の航空グループ。', sector: '空運業' },
  '全日空': { ticker: '9202', officialName: 'ANAホールディングス', brandName: '全日本空輸 (ANA)', description: '国内線・国際線旅客数国内首位の航空グループ。', sector: '空運業' },
  'jal': { ticker: '9201', officialName: '日本航空', brandName: 'JAL (日本航空)', description: '国内大手航空会社。高収益の国際線ビジネス客やマイル事業に強み。', sector: '空運業' },
  '東京メトロ': { ticker: '9023', officialName: '東京地下鉄', brandName: '東京メトロ', description: '首都圏の大動脈地下鉄9路線を運営する鉄道大手。', sector: '陸運業' },
  'jr東日本': { ticker: '9020', officialName: '東日本旅客鉄道', brandName: 'JR東日本 / Suica / エキナカ', description: '首都圏通勤路線と東北新幹線を擁する世界最大規模の鉄道企業。', sector: '陸運業' },
  'jr東海': { ticker: '9022', officialName: '東海旅客鉄道', brandName: 'JR東海 / 東海道新幹線 / リニア', description: '東海道新幹線を軸に圧倒的な高利益率を誇る鉄道会社。リニア建設中。', sector: '陸運業' },
  'jr西日本': { ticker: '9021', officialName: '西日本旅客鉄道', brandName: 'JR西日本 / 山陽新幹線 / ICOCA', description: '近畿圏アーバンネットワークと山陽新幹線を運営。', sector: '陸運業' },
  'his': { ticker: '9603', officialName: 'エイチ・アイ・エス', brandName: 'H.I.S. (格安海外旅行)', description: '格安航空券・海外パッケージツアーの旅行会社大手。ハウステンボス等も運営歴。', sector: 'サービス業' },

  // 半導体・ハイテク人気銘柄
  'ソシオネクスト': { ticker: '6526', officialName: 'ソシオネクスト', brandName: 'ソシオネクスト (Socionext)', description: '富士通とパナソニックのLSI統合企業。最先端SoCのファブレス開発大手。', sector: '電気機器' },
  'socionext': { ticker: '6526', officialName: 'ソシオネクスト', brandName: 'ソシオネクスト (Socionext)', description: '富士通とパナソニックのLSI統合企業。最先端SoCのファブレス開発大手。', sector: '電気機器' },
  '東京エレクトロン': { ticker: '8035', officialName: '東京エレクトロン', brandName: '東京エレクトロン (TEL)', description: '半導体製造装置世界3位。コータ・デベロッパ世界シェアトップ。', sector: '電気機器' },
  '東エレク': { ticker: '8035', officialName: '東京エレクトロン', brandName: '東京エレクトロン (TEL)', description: '半導体製造装置世界3位。コータ・デベロッパ世界シェアトップ。', sector: '電気機器' },
  'アドバンテスト': { ticker: '6857', officialName: 'アドバンテスト', brandName: 'アドバンテスト (ADVANTEST)', description: '半導体試験装置（テスタ）で世界シェア首位。生成AI向け需要急増。', sector: '電気機器' },
  'ルネサス': { ticker: '6723', officialName: 'ルネサスエレクトロニクス', brandName: 'ルネサス (車載マイコン世界首位)', description: '車載マイコン・アナログ半導体大手。自動運転やEV向けに強み。', sector: '電気機器' },
  'ディスコ': { ticker: '6146', officialName: 'ディスコ', brandName: 'DISCO (半導体切断・研削装置)', description: '半導体ダイシングソー（切断装置）で世界シェア8割の独占企業。', sector: '機械' },
  'スクリーン': { ticker: '7735', officialName: 'SCREENホールディングス', brandName: 'SCREEN (半導体洗浄装置)', description: '半導体ウエハ枚葉式洗浄装置で世界首位。', sector: '電気機器' },
  'towa': { ticker: '6315', officialName: 'TOWA', brandName: 'TOWA (半導体モールディング装置世界首位)', description: 'モールディング装置世界シェア約65%首位。HBM量産向けコンプレッション成形装置世界唯一。', sector: '機械' },
  'トーワ': { ticker: '6315', officialName: 'TOWA', brandName: 'TOWA (半導体モールディング装置世界首位)', description: 'モールディング装置世界シェア約65%首位。HBM量産向けコンプレッション成形装置世界唯一。', sector: '機械' },
  '6315': { ticker: '6315', officialName: 'TOWA', brandName: 'TOWA (半導体モールディング装置世界首位)', description: 'モールディング装置世界シェア約65%首位。HBM量産向けコンプレッション成形装置世界唯一。', sector: '機械' },
};


// 曖昧な名前や店舗名・略称から「この会社ですか？」提案候補を検索
export function findBrandSuggestions(rawQuery: string): BrandSuggestion[] {
  const q = normalizeStockInput(rawQuery);
  if (!q) return [];

  const matched: BrandSuggestion[] = [];
  const seenTickers = new Set<string>();

  // 1. 完全一致・前方一致・部分一致
  for (const [key, value] of Object.entries(BRAND_TO_STOCK_MAP)) {
    const normKey = normalizeStockInput(key);
    if (normKey === q || normKey.includes(q) || q.includes(normKey)) {
      if (!seenTickers.has(value.ticker)) {
        seenTickers.add(value.ticker);
        const masterPrice = STOCK_MASTER[value.ticker]?.price;
        matched.push({
          query: rawQuery,
          ticker: value.ticker,
          officialName: value.officialName,
          brandName: value.brandName,
          description: value.description,
          sector: value.sector,
          price: masterPrice
        });
      }
    }
  }

  // 2. STOCK_MASTERの社名・解説との部分一致
  for (const [code, stock] of Object.entries(STOCK_MASTER)) {
    if (seenTickers.has(code)) continue;
    const normName = normalizeStockInput(stock.name);
    const normDesc = normalizeStockInput(stock.description || '');
    if (normName.includes(q) || normDesc.includes(q) || q.includes(normName)) {
      seenTickers.add(code);
      matched.push({
        query: rawQuery,
        ticker: code,
        officialName: stock.name,
        brandName: stock.name,
        description: stock.description.slice(0, 70) + '...',
        sector: stock.sector,
        price: stock.price
      });
    }
  }

  return matched.slice(0, 5);
}

// 英数4文字コード（数字4桁 または 130A、186Aなどの新証券コード英字混在）を抽出して大文字に統一
export function extractTickerCode(input: string): string | null {
  if (!input) return null;
  const normalized = normalizeStockInput(input);
  // 130a, 186a, 7203, 130a.t 等にマッチ
  const match = normalized.match(/\b([0-9a-z]{4})(\.t)?\b/i) || normalized.match(/^([0-9a-z]{4})/i);
  if (match) {
    return match[1].toUpperCase();
  }
  return null;
}

// 証券コードから会社名・詳細を確実に特定する（ローカルマスター＋Yahooファイナンスオンラインフォールバック）
// 小文字（130a）でも大文字（130A）でも自動正規化
export async function lookupStockByTicker(tickerInput: string): Promise<{
  ticker: string;
  name: string;
  sector: string;
  price: number;
  changePercent?: number;
  pts?: PtsInfo;
  isRealLookup: boolean;
}> {
  const ticker = extractTickerCode(tickerInput) || tickerInput.trim().toUpperCase();

  // 1. 登録済みマスターにある場合
  if (STOCK_MASTER[ticker]) {
    const s = STOCK_MASTER[ticker];
    return {
      ticker: s.ticker,
      name: s.name,
      sector: s.sector,
      price: s.price,
      changePercent: s.changePercent,
      pts: s.pts,
      isRealLookup: true
    };
  }

  // 2. ブラウザ環境の場合: CORS制約を回避するため自前のNext.js APIルートを呼ぶ
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/stock-lookup?ticker=${encodeURIComponent(ticker)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.name && !data.name.includes('東証銘柄 (')) {
          return {
            ticker: data.ticker || ticker,
            name: data.name,
            sector: data.sector || '東証上場銘柄',
            price: Number(data.price) || 1000,
            changePercent: Number(data.changePercent) || 0,
            pts: data.pts,
            isRealLookup: Boolean(data.isRealLookup),
          };
        }
      }
    } catch (apiErr) {
      console.warn(`[lookupStockByTicker] Client API fetch failed for ${ticker}:`, apiErr);
    }
  }


  // 3. サーバー環境の場合: Yahoo!ファイナンスからリアルタイムに正式企業名と株価を取得
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://finance.yahoo.co.jp/quote/${ticker}.T`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      let extractedName = '';
      if (titleMatch && titleMatch[1]) {
        const fullTitle = titleMatch[1];
        const cleanName = fullTitle
          .replace(/【[0-9A-Za-z]+】.*$/, '')
          .replace(/^[0-9A-Za-z]{4}\s*/, '')
          .replace(/：.*$/, '')
          .replace(/- Yahoo!ファイナンス.*$/, '')
          .trim();
        if (cleanName && !cleanName.includes('エラー') && !cleanName.includes('見つかりません')) {
          extractedName = cleanName;
        }
      }

      if (!extractedName) {
        const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
        if (h1Match && h1Match[1]) {
          extractedName = h1Match[1].replace(/の株価.*$/, '').trim();
        }
      }

      const priceMatch = html.match(/_CommonPriceBoard[\s\S]*?_StyledNumber__value[^\"]*">([0-9,.]+)/) ||
                         html.match(/<span class="[^"]*price[^"]*">([0-9,.]+)<\/span>/i);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

      const changeMatch = html.match(/_PriceChangeLabel__primary[\s\S]*?_StyledNumber__value[^\"]*">([+\-0-9,.]+)/);
      const change = changeMatch ? parseFloat(changeMatch[1].replace(/,/g, '')) : 0;

      // 🌙 夜間PTS取引情報
      let pts: PtsInfo | undefined = undefined;
      const ptsBlockMatch = html.match(/ptsPriceRow[\s\S]*?(?=<\/div><\/div>|<time|$)/);
      if (ptsBlockMatch) {
        const ptsHtml = ptsBlockMatch[0];
        const ptsPriceMatch = ptsHtml.match(/ptsPrice[^\"]*\">[\s\S]*?_StyledNumber__value[^\"]*\">([0-9,.]+)/);
        if (ptsPriceMatch && ptsPriceMatch[1]) {
          const ptsPrice = parseFloat(ptsPriceMatch[1].replace(/,/g, ''));
          let ptsChange = 0;
          let ptsChangePercent = 0;

          const ptsChangeMatch = ptsHtml.match(/_PriceChangeLabel__primary[^\"]*\">[\s\S]*?_StyledNumber__value[^\"]*\">([+\-0-9,.]+)/);
          if (ptsChangeMatch && ptsChangeMatch[1]) {
            ptsChange = parseFloat(ptsChangeMatch[1].replace(/,/g, ''));
          }

          const ptsPercentMatch = ptsHtml.match(/_PriceChangeLabel__secondary[^\"]*\">[\s\S]*?_StyledNumber__value[^\"]*\">([+\-0-9,.]+)/);
          if (ptsPercentMatch && ptsPercentMatch[1]) {
            ptsChangePercent = parseFloat(ptsPercentMatch[1].replace(/,/g, ''));
          } else if (price > 0 && ptsPrice > 0) {
            ptsChangePercent = parseFloat((((ptsPrice - price) / price) * 100).toFixed(2));
          }

          const timeMatch = html.match(/ptsTime[^\"]*\">([^<]+)<\/time>/);
          const ptsTime = timeMatch ? timeMatch[1].trim() : undefined;

          if (ptsPrice > 0) {
            pts = {
              price: ptsPrice,
              change: ptsChange,
              changePercent: ptsChangePercent,
              time: ptsTime,
            };
          }
        }
      }

      if (extractedName) {
        return {
          ticker,
          name: extractedName,
          sector: '東証上場銘柄',
          price: price > 0 ? price : 1000,
          changePercent: price > 0 && change !== 0 ? parseFloat(((change / (price - change)) * 100).toFixed(2)) : 0,
          pts,
          isRealLookup: true
        };
      }

    }
  } catch (err) {
    console.warn(`Yahoo finance lookup failed for ${ticker}:`, err);
  }

  // 4. 一般フォールバック
  return {
    ticker,
    name: `東証銘柄 (${ticker})`,
    sector: '東証上場銘柄',
    price: 1850,
    changePercent: 0,
    isRealLookup: false
  };
}

