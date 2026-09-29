import { RumorItem } from '@/types/rumor';

export const INITIAL_RUMORS: RumorItem[] = [
  {
    id: 'rumor-1',
    ticker: '6758',
    stockName: 'ソニーグループ',
    market: 'プライム',
    sector: '電気機器',
    price: 13850,
    change: 320,
    changePercent: 2.36,
    title: '次世代XRヘッドセット・空間コンピューティング専用新チップを秋に電撃発表の噂',
    category: 'new_product',
    buzzLevel: '🔥 過熱・大バズ',
    sourceMedia: '海外テックリーカー ＆ X（旧Twitter）VR開発者界隈',
    detectedDate: '2026/09/27',
    rumorSummary: '大手米テック企業との共同開発による超軽量XRデバイス向け独自シリコンを開発完了しており、今秋のプレスカンファレンスでティザー公開されるというサプライチェーンからのリーク情報が拡散。',
    whyBuzzing: {
      origin: '台湾サプライチェーンの部品発注コードと、欧州特許庁に提出された「超低遅延オプティカル伝送センサー」の意匠出願がXで発掘された。',
      spreadPath: 'フォロワー15万人の海外テック系リーカーが言及後、日本のガジェット系投資インフルエンサーが一斉にポストし「PSVR3か新型独立型デバイスか」と議論が過熱。',
      marketReaction: '海外市場のADRが先行上昇し、東京市場でも後場にかけてハイテク買いが波及した。'
    },
    aiVerdict: {
      verdict: 'highly_credible',
      credibilityScore: 78,
      fakeRiskScore: 22,
      headline: '【信憑性高】特許出願と台湾受託生産元の部材手配実績が合致。製品発表の確度は極めて高い水準。',
      factCheckPoints: {
        officialStatus: '現時点で公式アナウンスなしだが、過去3年の同社新カテゴリー発表時期（9〜10月）とスケジュールが一致。',
        sourceReliability: '発信元のリーカーは過去のPlayStation関連周辺機器の的中率85%超。単なる煽りアカウントではない。',
        technicalFeasibility: '自社開発の積層型CMOSセンサー技術の延長線上にあり、技術的ハードルは既にクリアされている段階と推定。'
      },
      aiWarning: '発表直後は「材料出尽くし」の短期利確売りに押される傾向があるため、ティザー前の思惑段階での高値掴みには注意。',
      recommendedAction: 'catalyst_watch'
    }
  },
  {
    id: 'rumor-2',
    ticker: '4563',
    stockName: 'アンジェス',
    market: 'グロース',
    sector: '医薬品',
    price: 58,
    change: 14,
    changePercent: 31.82,
    title: '「海外大手製薬と希少疾患治療薬のメガディール合意間近」とするSNS買い煽りポストが拡散',
    category: 'sns_hype',
    buzzLevel: '🔥 過熱・大バズ',
    sourceMedia: 'X（旧Twitter）仕手系投資アカウント群 ＆ 掲示板',
    detectedDate: '2026/09/27',
    rumorSummary: 'X上で匿名アカウントが「某欧州メガファーマが巨額の前払一時金でライセンス契約を結ぶ。週明けに特大IRが出る」とスクリーンショット風の画像を添付して拡散。ストップ高気配に。',
    whyBuzzing: {
      origin: '金曜夜、鍵アカウントから流出したとされる「未公開IRドラフト文書」のトリミング画像が突如Xで拡散。',
      spreadPath: '複数の急騰煽りアカウントが「月曜寄らずのS高確定」「今買わないと一生買えない」と煽り立て、夜間PTSで一時制限値幅上限まで買われた。',
      marketReaction: 'PTS出来高が急増し、ネット証券の急上昇銘柄ランキング1位にランクイン。'
    },
    aiVerdict: {
      verdict: 'fake_warning',
      credibilityScore: 12,
      fakeRiskScore: 88,
      headline: '【🚨 ガセ・仕手煽り警報】典型的な「画像偽造＋提携デマ」。過去のバイオ株仕手化パターンと完全一致。',
      factCheckPoints: {
        officialStatus: '会社側は適時開示を出しておらず、添付文書のフォント・文書管理番号フォーマットが公式適時開示規定と明らかに不一致。',
        sourceReliability: '発信元のアカウントは過去にも低位バイオ株の偽情報を流して急騰初動で売り抜けている悪質業者の疑い。',
        technicalFeasibility: '治験フェーズの進捗度合い（現在第I相完了時点）から見て、欧州メガファーマが数百億円規模の一時金を支払う臨床的エビデンスは現時点で未確立。'
      },
      aiWarning: '典型的な「嵌め込み（パンプ＆ダンプ）」の危険性が極めて高いです。絶対に成行買いで飛び乗らないでください。週明け寄り天からの暴落リスク大。',
      recommendedAction: 'avoid_fomo'
    }
  },
  {
    id: 'rumor-3',
    ticker: '7203',
    stockName: 'トヨタ自動車',
    market: 'プライム',
    sector: '輸送用機器',
    price: 2780,
    change: 45,
    changePercent: 1.65,
    title: '全固体電池EVを2027年量産計画から前倒し、実用試作車を冬のモビリティショーで公開？',
    category: 'new_product',
    buzzLevel: '⚡ 急上昇',
    sourceMedia: '日経ビジネス電子版観測記事 ＆ 自動車アナリスト解説',
    detectedDate: '2026/09/26',
    rumorSummary: '出光興産との固体電解質量産パイロットプラントの稼働が想定以上に順調で、当初予定していた2027〜2028年の市販車投入スケジュールが前倒しされ、年内に走る実証車がお披露目されるとの観測。',
    whyBuzzing: {
      origin: '経済紙の自動車担当記者のコラム記事にて、サプライヤー幹部の「電解質パイロットラインの歩留まりが計画値を大幅に上回った」という証言が掲載。',
      spreadPath: 'EV・電池関連の投資家界隈で「出光興産（5019）」「三井金属（5706）」とセットで関連銘柄として一気に言及数が増加。',
      marketReaction: '株価は堅調に推移し、全固体電池関連セクター全体に資金が循環物色された。'
    },
    aiVerdict: {
      verdict: 'caution_speculative',
      credibilityScore: 65,
      fakeRiskScore: 35,
      headline: '【要検証・思惑先行】パイロットプラントの進捗は事実だが、市販化前倒しはまだ公式確約されていない。',
      factCheckPoints: {
        officialStatus: '公式IR説明会では「2027〜2028年の市場投入に向けて順調に進捗」との公式見解を維持。前倒し表明はまだない。',
        sourceReliability: '経済紙の記名記事であり情報の裏取りレベルは中〜高。ただし「前倒し」の表現は記者の観測推測を含む。',
        technicalFeasibility: 'パイロットプラントの稼働自体は適時開示済み。耐久性試験のクリア状況が量産判断の最大の分岐点。'
      },
      aiWarning: 'デマではないものの、過剰な前倒し期待で買われると、公式発表が「予定通り2027年目標」だった場合に失望売りが出るリスクに留意。',
      recommendedAction: 'wait_official'
    }
  },
  {
    id: 'rumor-4',
    ticker: '6857',
    stockName: 'アドバンテスト',
    market: 'プライム',
    sector: '電気機器',
    price: 6420,
    change: -110,
    changePercent: -1.68,
    title: '米NVIDIAの次世代AI半導体「次期アーキテクチャ」でテスター独占受注から外れるとの海外観測',
    category: 'earnings_leak',
    buzzLevel: '⚡ 急上昇',
    sourceMedia: '米テック系投資ブログ ＆ 台湾SemiAnalysis類似レポート',
    detectedDate: '2026/09/25',
    rumorSummary: '次世代GPUテストにおいて、米テラダイン（Teradyne）がシェアを一部奪還し、アドバンテストの独占的シェアが80%から55%前後に低下するとのアナリストメモが出回り株価が軟調に。',
    whyBuzzing: {
      origin: '海外の半導体専門独立系リサーチが顧客向け限定レポートで「テストソケットの供給先分散」に言及。',
      spreadPath: 'レポートの一部サマリーがRedditおよびXの半導体投資グループに英訳・転載され、日米の機関投資家の間で確認作業が走った。',
      marketReaction: '一時3%超の急落を見せるも、国内大手証券の反論リポートが出て下げ渋る展開。'
    },
    aiVerdict: {
      verdict: 'caution_speculative',
      credibilityScore: 48,
      fakeRiskScore: 52,
      headline: '【要検証・ノイズ判定】毎世代恒例の「サプライヤー分散観測」。完全なガセではないが過度の悲観は売られすぎの好機も。',
      factCheckPoints: {
        officialStatus: '顧客（NVIDIA）との守秘義務のため両社とも公式コメントは控える方針。会社側は全体需要の強さを強調。',
        sourceReliability: 'リサーチ会社の観測自体は筋が通っているが、過去のBlackwell世代でも同様のシェア低下噂が流れ、結果的にアドバンテストがほぼ独占を維持した経緯あり。',
        technicalFeasibility: '超高発熱テストに対応できるテスターの歩留まり・実績面で、他社が短期間で大規模リプレイスするのは現実的に困難。'
      },
      aiWarning: '過去のサイクルでも同様の噂で急落した局面が押し目買いのチャンスとなった事例が多い。四半期決算の受注残高推移で真偽を見極めるのが定石。',
      recommendedAction: 'virtual_try'
    }
  },
  {
    id: 'rumor-5',
    ticker: '2432',
    stockName: 'ディー・エヌ・エー',
    market: 'プライム',
    sector: 'サービス業',
    price: 1820,
    change: 95,
    changePercent: 5.51,
    title: 'ポケモン関連の未発表大型新作スマホアプリの共同開発がリーク？任天堂株主総会発言と符合',
    category: 'new_product',
    buzzLevel: '🔥 過熱・大バズ',
    sourceMedia: 'ゲーム系リークフォーラム ＆ X（旧Twitter）',
    detectedDate: '2026/09/27',
    rumorSummary: 'DeNAが「世界的大手IPホルダーとの大型未発表タイトル開発」として複数の求人（Unreal Engine 5経験者募集）を出しており、任天堂のIP共同展開プロジェクト第3弾ではないかとの思惑が急拡大。',
    whyBuzzing: {
      origin: '求人サイトに掲載された開発プロジェクト概要のコードネームと開発規模が、過去の『ポケマス』『ポケポケ』開発初期と酷似していることをゲーマー投資家が特定。',
      spreadPath: 'Xで比較画像が1.2万リポストされ、ゲーム株専門の個人投資家が買い参戦。出来高が急拡大。',
      marketReaction: '前日比+5%を超える大陽線を形成。'
    },
    aiVerdict: {
      verdict: 'highly_credible',
      credibilityScore: 72,
      fakeRiskScore: 28,
      headline: '【信憑性高】求人票の記載内容と協業会社との資本関係から、大型IPタイトル開発中であることはほぼ確実。',
      factCheckPoints: {
        officialStatus: '求人票の存在自体は事実。ただし「ポケモンのどのタイトルか」についての公式発表は当然ながら伏せられている。',
        sourceReliability: '求人票という公式一次情報からの推論であり、根拠のないデマとは一線を画す。',
        technicalFeasibility: '両社は合弁会社「ニンテンドーシステムズ」を共同運営しており、共同開発の素地は完全に整っている。'
      },
      aiWarning: 'リリース時期は1〜2年先になる可能性が高く、短期的な思惑相場の後は開発進捗が途絶えて株価が調整する「ゲーム株特有の谷」に注意。',
      recommendedAction: 'catalyst_watch'
    }
  },
  {
    id: 'rumor-6',
    ticker: '9984',
    stockName: 'ソフトバンクグループ',
    market: 'プライム',
    sector: '情報・通信業',
    price: 8850,
    change: 210,
    changePercent: 2.43,
    title: '「OpenAIの次期大型資金調達ラウンドに数兆円規模で単独主導参画」との米ブルームバーグ観測報道',
    category: 'ma_takeover',
    buzzLevel: '🔥 過熱・大バズ',
    sourceMedia: '米Bloombergスクープ ＆ ロイター電',
    detectedDate: '2026/09/26',
    rumorSummary: '孫正義会長率いるソフトバンクGが、AI半導体・インフラ構築構想「イザナギ」の一環として、OpenAIに対して数十億ドル規模の追加出資を協議中であると米大手通信社が関係者の話として報道。',
    whyBuzzing: {
      origin: '米国東部時間の早朝、Bloombergが「事情に詳しい複数の関係者」をソースに速報記事を配信。',
      spreadPath: 'ウォール街のヘッジファンド、日経テレコン、Xのテック投資クラスタが一斉に引用し、Arm株・SBG株が急上昇。',
      marketReaction: '英Arm株がプレマーケットで急伸、SBGも翌朝の東京市場で買い気配スタート。'
    },
    aiVerdict: {
      verdict: 'highly_credible',
      credibilityScore: 82,
      fakeRiskScore: 18,
      headline: '【信憑性極めて高】米一流金融メディアの独自取材。孫会長の過去の公言（ASI実現への全投資）とも完全に整合。',
      factCheckPoints: {
        officialStatus: 'SBG広報は「市場の噂や憶測にはコメントしない」と回答。否定はしていない。',
        sourceReliability: 'BloombergのM&A・資金調達スクープ班による署名記事で、信頼度は業界最高峰。',
        technicalFeasibility: 'SBGはT-Mobile株の担保化やアーム株含み益で巨額の手元流動性を確保しており、資金調達余力は十分。'
      },
      aiWarning: '出資比率やバリュエーション（企業価値評価）が高すぎるとの批判で、一時的に出資側（SBG）の株価が下押しされるパターンもあるため注意。',
      recommendedAction: 'catalyst_watch'
    }
  },
  {
    id: 'rumor-7',
    ticker: '3350',
    stockName: 'メタプラネット',
    market: 'スタンダード',
    sector: '卸売業',
    price: 1120,
    change: -180,
    changePercent: -13.85,
    title: '「ビットコイン購入を停止し、暗号資産事業から撤退」とする偽の適時開示スクショがネット拡散',
    category: 'sns_hype',
    buzzLevel: '🔥 過熱・大バズ',
    sourceMedia: '5ちゃんねる市況1板 ＆ X（旧Twitter）',
    detectedDate: '2026/09/25',
    rumorSummary: '東証適時開示閲覧サービス（TDnet）の画面を偽装した「暗号資産事業の基本方針見直しに関するお知らせ」と題された画像が掲示板に投稿され、一時投げ売りが発生。',
    whyBuzzing: {
      origin: 'ネット掲示板にTDnetのヘッダーを巧妙に合成した偽リリース画像がアップロード。',
      spreadPath: '「メタプラネット逝ったああ」「ビットコイン手放すらしい」とXのインフルエンサーが真偽未確認のままポストしパニック売りが発生。',
      marketReaction: '15分間で株価が10%超急落しサーキットブレーカー発動寸前に。'
    },
    aiVerdict: {
      verdict: 'officially_denied',
      credibilityScore: 0,
      fakeRiskScore: 100,
      headline: '【📢 会社側が完全否定済】悪質な偽造リリース。会社側が「事実無根の偽造」として警察へ被害届を提出。',
      factCheckPoints: {
        officialStatus: '急落の直後、会社側が「一部SNSで流布されている偽の適時開示情報について」と題する緊急リリースを発行し完全否定。',
        sourceReliability: '完全な偽造文書（フェイク画像）。開示元の公式サーバーには該当文書が存在しない。',
        technicalFeasibility: '会社側はビットコイン保有を中核戦略として継続中であり、直近でも追加購入を発表していた。'
      },
      aiWarning: '悪質な偽情報による急落は、公式否定リリースが出た後に急反発する典型例。SNSのスクショ画像だけで狼狽売りしないよう、必ず公式TDnetで原本確認を！',
      recommendedAction: 'virtual_try'
    }
  }
];

export function getRumorVerdictBadge(verdict: RumorItem['aiVerdict']['verdict']) {
  switch (verdict) {
    case 'fake_warning':
      return {
        label: '🚨 ガセ・煽り警戒',
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        badgeColor: 'text-rose-400'
      };
    case 'caution_speculative':
      return {
        label: '🔍 要検証・思惑先行',
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        badgeColor: 'text-amber-400'
      };
    case 'highly_credible':
      return {
        label: '✅ 信憑性高・確証あり',
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        badgeColor: 'text-emerald-400'
      };
    case 'officially_denied':
      return {
        label: '📢 会社側が公式否定済',
        bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        badgeColor: 'text-purple-400'
      };
  }
}

export function getCategoryLabel(category: RumorItem['category']) {
  switch (category) {
    case 'new_product':
      return { label: '📱 新製品・新技術', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' };
    case 'partnership':
      return { label: '🤝 提携・サプライチェーン', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' };
    case 'ma_takeover':
      return { label: '🏢 M&A・巨額出資・買収', color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' };
    case 'earnings_leak':
      return { label: '📊 業績観測・シェア変動', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
    case 'patent_pharma':
      return { label: '💊 特許公報・新薬承認', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
    case 'sns_hype':
      return { label: '📢 SNS急騰煽り・仕手化', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' };
  }
}

// 🔍 スキャン時に動的発掘・ローテーションされるリアルな市場思惑噂プール
export const EXTRA_RUMOR_POOL: Omit<RumorItem, 'id' | 'detectedDate'>[] = [
  {
    ticker: '6920',
    stockName: 'レーザーテック',
    market: 'プライム',
    sector: '電気機器',
    price: 24350,
    change: 850,
    changePercent: 3.62,
    title: '米大手半導体ファウンドリより「次世代高NA EUV検査装置」の大型追加受注が内定との海外観測',
    category: 'new_product',
    buzzLevel: '🔥 過熱・大バズ',
    sourceMedia: '台湾セミコンダクター専門紙 ＆ 海外アナリスト速報',
    rumorSummary: '次世代2nmおよび1.4nm微細化プロセス向けに、レーザーテックのACTISシリーズ次世代機の独占採用がサプライチェーン関係者の証言として報道。市場で買い戻しが急加速。',
    whyBuzzing: {
      origin: '台湾テック系メディアの業界コラムにて、大手ファウンドリの設備投資計画における検査装置サプライヤー選定状況がリーク。',
      spreadPath: '海外ヘッジファンド筋から東京市場の半導体担当アナリストへ共有され、後場寄り付き直後に大口買いが流入。',
      marketReaction: '一時4%超の急反発となり、空売り筋の踏み上げを誘発。'
    },
    aiVerdict: {
      verdict: 'highly_credible',
      credibilityScore: 78,
      fakeRiskScore: 22,
      headline: '【信憑性高】微細化技術での独占シェアは盤石。次世代機リプレイス需要の時期としても整合的。',
      factCheckPoints: {
        officialStatus: '会社側からの正式開示は現時点でなし（通常は四半期決算の受注残高で反映）。',
        sourceReliability: '報じたメディアはTSMCサプライチェーンの取材力に定評があり、過去の的中率は高水準。',
        technicalFeasibility: '競合KLAが追いつくにはなお数年の技術ギャップがあり、独占受注継続の確度は高い。'
      },
      aiWarning: '高バリュエーション銘柄のため、海外金利動向や地政学リスクによる乱高下には常に警戒が必要。',
      recommendedAction: 'catalyst_watch'
    }
  },
  {
    ticker: '3778',
    stockName: 'さくらインターネット',
    market: 'プライム',
    sector: '情報・通信業',
    price: 4320,
    change: 285,
    changePercent: 7.06,
    title: '経産省「AIクラウド補助金」の第3期追加公募で数千億円規模の採択確定かとするSNS観測',
    category: 'partnership',
    buzzLevel: '🔥 過熱・大バズ',
    sourceMedia: 'X（旧Twitter）政策ウォッチャー ＆ 官報分析アカウント',
    rumorSummary: '政府のAI開発基盤強化に伴う追加支援予算において、さくらインターネットの石狩データセンター拡張計画が最有力候補として内定したとの噂が拡散。',
    whyBuzzing: {
      origin: '省庁の概算要求資料およびAI戦略会議の議事録要旨を分析したアカウントが「さくらに巨額追加補助の公算大」とポスト。',
      spreadPath: '投資系インフルエンサーが「GPUサーバー調達枠の拡大必至」と拡散し、個人投資家の資金が集中。',
      marketReaction: '出来高急増とともにストップ高気配に接近。'
    },
    aiVerdict: {
      verdict: 'caution_speculative',
      credibilityScore: 62,
      fakeRiskScore: 38,
      headline: '【要検証・思惑先行】政府の国産AI支援方針は事実だが、具体額や単独採択の確証は未発表。',
      factCheckPoints: {
        officialStatus: '経産省および会社側からの正式な採択発表はまだ出ていない。',
        sourceReliability: '官公庁公開資料の解釈に基づいた分析であり根拠はあるが、市場の期待先行の側面が強い。',
        technicalFeasibility: '既にNVIDIA最新GPU（H100/B200）の調達実績があり、受け入れ能力自体は証明済み。'
      },
      aiWarning: '正式発表時に「織り込み済み」で事実売りが出る典型パターンのため、高値飛びつき買いには注意。',
      recommendedAction: 'wait_official'
    }
  },
  {
    ticker: '9468',
    stockName: 'KADOKAWA',
    market: 'プライム',
    sector: '情報・通信業',
    price: 3650,
    change: 190,
    changePercent: 5.49,
    title: 'ソニーグループによる友好的TOB（完全子会社化）の最終契約が週明けにも合意との観測',
    category: 'ma_takeover',
    buzzLevel: '🔥 過熱・大バズ',
    sourceMedia: '外資系金融メディア ＆ 国内M&Aアドバイザー筋',
    rumorSummary: 'アニメ・ゲームIPの世界的展開を狙うソニーグループが、フロム・ソフトウェアの親会社であるKADOKAWAに対してプレミアム付きTOBを実施する方向で大詰めを迎えているとの観測報道。',
    whyBuzzing: {
      origin: '海外ニュースサイトが「ソニーとKADOKAWAの買収交渉が進展」と報道。',
      spreadPath: '国内メディアが後追いで関係者の話として伝え、アニメ・コンテンツ投資クラスタで大熱狂。',
      marketReaction: '買い気配を切り上げ、前日比+5%超の上昇。'
    },
    aiVerdict: {
      verdict: 'highly_credible',
      credibilityScore: 84,
      fakeRiskScore: 16,
      headline: '【信憑性極めて高】両社とも「協議の事実は認める」スタンス。資本提携から買収への進展は論理的。',
      factCheckPoints: {
        officialStatus: '両社は過去「買収の検討を行っていることは事実だが決定したものはない」と公式コメントを発表済み。',
        sourceReliability: '主要金融紙複数社が追認取材を行っており、情報の確度は極めて高い水準。',
        technicalFeasibility: '独占禁止法上の審査ハードルも比較的低く、実現可能性は高い。'
      },
      aiWarning: 'TOB価格のプレミアム水準（現在の市場価格との乖離）次第ではボラティリティが激しくなる点に留意。',
      recommendedAction: 'catalyst_watch'
    }
  },
  {
    ticker: '5595',
    stockName: 'QPS研究所',
    market: 'グロース',
    sector: '精密機器',
    price: 1780,
    change: 145,
    changePercent: 8.87,
    title: '防衛省SAR衛星コンステレーション計画で「数十機規模の単独一括受注」との思惑が拡散',
    category: 'partnership',
    buzzLevel: '🔥 過熱・大バズ',
    sourceMedia: 'X（旧Twitter）宇宙・防衛銘柄クラスタ ＆ 専門誌',
    rumorSummary: '防衛省が宇宙領域の監視・早期警戒体制強化のために配備を進める小型SAR衛星網について、QPS研究所が量産体制確立を評価され主契約社に内定したとの憶測が急浮上。',
    whyBuzzing: {
      origin: '防衛省の調達予定リストに「即応型小型衛星網の整備」が巨額計上されたことが判明。',
      spreadPath: '宇宙ビジネス専門家がYouTubeやXで「国内で唯一量産可能なのはQPS」と解説し話題に。',
      marketReaction: '急騰銘柄ランキング上位に急浮上し、グロース市場の資金を牽引。'
    },
    aiVerdict: {
      verdict: 'caution_speculative',
      credibilityScore: 68,
      fakeRiskScore: 32,
      headline: '【要検証・有力候補】技術力と実績は国内随一だが、競合他社との共同受注の可能性も残る。',
      factCheckPoints: {
        officialStatus: '過去の防衛省向け試作実証機の受注実績はあるが、本量産機の一括受注開示は未発表。',
        sourceReliability: '国策予算資料に基づく根拠のある推測だが、配分比率の詳細は未知数。',
        technicalFeasibility: '自社工場での月産体制整備が進んでおり、生産キャパシティ上の実現可能性は十分。'
      },
      aiWarning: '宇宙株はロケット打ち上げスケジュール遅延等の不確実性も伴うため、資金管理を厳格に。',
      recommendedAction: 'virtual_try'
    }
  },
  {
    ticker: '6146',
    stockName: 'ディスコ',
    market: 'プライム',
    sector: '機械',
    price: 41200,
    change: 1350,
    changePercent: 3.39,
    title: '「次世代HBM4用超薄型グラインダ・ダイサの供給シェア100%確定」とのサプライチェーン報告',
    category: 'new_product',
    buzzLevel: '⚡ 急上昇',
    sourceMedia: '韓国半導体サプライチェーンレポート ＆ 日系証券リサーチ',
    rumorSummary: '韓国SKハイニックスおよびサムスン電子が開発中の第6世代広帯域メモリ「HBM4」において、積層ダイの超薄型化を可能にするディスコの特許研削技術が独占採用されたとの観測。',
    whyBuzzing: {
      origin: '韓国の半導体学会でのサプライヤー展示発表において、同社ブースでの超薄型ウェーハ展示が海外機関投資家の注目を集めた。',
      spreadPath: '半導体専門証券アナリストが「ディスコの圧倒的参入障壁」と投資判断を引き上げ。',
      marketReaction: '半導体製造装置セクターが連れ高となり、日経平均を押し上げ。'
    },
    aiVerdict: {
      verdict: 'highly_credible',
      credibilityScore: 88,
      fakeRiskScore: 12,
      headline: '【信憑性極めて高】HBMの薄型積層化においてディスコの技術優位は世界的にも圧倒的。',
      factCheckPoints: {
        officialStatus: '顧客との守秘義務上、個別のHBM世代ごとの公式発表はされないのが通常。',
        sourceReliability: 'メモリメーカーの部材発注計画と一致しており、業界関係者の裏付けは堅固。',
        technicalFeasibility: '既存のHBM3Eでもシェアほぼ独占しており、次世代での継続は極めて自然。'
      },
      aiWarning: 'すでに市場評価が高く株価も値がさ株のため、相場全体の調整局面では値幅を伴う下落に注意。',
      recommendedAction: 'catalyst_watch'
    }
  },
  {
    ticker: '5803',
    stockName: 'フジクラ',
    market: 'プライム',
    sector: '非鉄金属',
    price: 5200,
    change: 240,
    changePercent: 4.84,
    title: '北米ハイパースケーラー各社が「超多心SWR光ケーブル」を2027年まで全量予約との噂',
    category: 'earnings_leak',
    buzzLevel: '🔥 過熱・大バズ',
    sourceMedia: '米通信インフラ専門メディア ＆ X（旧Twitter）電線株クラスタ',
    rumorSummary: '生成AIデータセンター間の超大容量通信需要が爆発しており、配線スペースを劇的に削減できるフジクラの独自光ケーブルが、米巨大クラウド大手3社から長期一括購入の打診を受け予約満杯状態との噂。',
    whyBuzzing: {
      origin: '米国通信見本市（OFC）での同社ブースに米テック大手幹部が連日殺到したとのレポート。',
      spreadPath: 'インフラ投資家界隈で「電線株はAIバブルの隠れた本命」と話題化し、モメンタム買いが殺到。',
      marketReaction: '年初来高値を更新し、連日出来高ランキング上位をキープ。'
    },
    aiVerdict: {
      verdict: 'highly_credible',
      credibilityScore: 82,
      fakeRiskScore: 18,
      headline: '【信憑性高】四半期決算ごとの上方修正ラッシュが裏付ける通り、データセンター需要は本物。',
      factCheckPoints: {
        officialStatus: '会社側は受注残高の好調と工場増工を既に決算短信等で公表済み。',
        sourceReliability: '北米データセンター建設ラッシュの実需データと完全に合致。',
        technicalFeasibility: 'SWR（Spider Web Ribbon）特許技術により他社が同等密度を量産するのは困難。'
      },
      aiWarning: '株価が短期間で数倍に急騰しているため、業績上方修正の数字が少しでも市場予想を下回った際の一時的急落リスクには警戒。',
      recommendedAction: 'catalyst_watch'
    }
  }
];

