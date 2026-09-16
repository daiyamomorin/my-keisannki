export const MANUAL_OPTION = '手動入力';

export const intlShippingPresets = [
  { label: 'eパケット 〜500g', value: 1800 },
  { label: 'eパケット 〜1kg', value: 2900 },
  { label: 'EMS 〜500g', value: 3900 },
  { label: 'EMS 〜1kg', value: 5400 },
  { label: 'EMS 〜2kg', value: 7600 },
  { label: 'FedEx 〜2kg', value: 9500 }
] as const;

export const fvfPresets = [
  { label: '標準カテゴリ（大半）', value: 13.6 },
  { label: '衣類・シューズ・アクセサリー', value: 15.0 },
  { label: 'スニーカー（$150超）', value: 8.0 },
  { label: '腕時計・時計', value: 15.0 },
  { label: 'ジュエリー', value: 15.0 },
  { label: 'カメラ・写真用品', value: 13.6 },
  { label: 'トレーディングカード', value: 13.25 },
  { label: '楽器（ギター/ベース）', value: 6.7 },
  { label: '本・映画・音楽', value: 15.3 },
  { label: '自動車・バイクパーツ', value: 13.6 }
] as const;

// 原産国のトグル選択肢。'japan' はSection 301（12.5%フロア、実請求から回帰した確定値）の対象、
// 'china' は中国原産でSection 301の追加関税が別枠で乗る区分（カテゴリごとに水準が大きく変わる）、
// 'us_or_other_exempt' は米国原産など再輸入扱いで12.5%フロアが適用されない区分。
export const originCountryOptions = [
  { value: 'japan', label: '日本（Section 301対象・12.5%固定）' },
  { value: 'china', label: '中国（Section 301追加あり）' },
  { value: 'us_or_other_exempt', label: '米国等（Section 301対象外）' }
] as const;

// 配送先国。米国以外は実請求データがなく一般的な関税率・消費税制度からの概算。
export const destinationCountryOptions = [
  { value: 'us', label: '🇺🇸 アメリカ' },
  { value: 'ca', label: '🇨🇦 カナダ' },
  { value: 'uk', label: '🇬🇧 イギリス' },
  { value: 'au', label: '🇦🇺 オーストラリア' }
] as const;

// カテゴリ選択で「FVF率」「原産国別の関税率」をまとめて自動セットするためのプリセット。
// General Rate（品目のHTSコードで決まる基礎関税率）／中国原産の合計実効税率（MFN+Section301）／
// 海外配送先（カナダ・イギリス・オーストラリア）向けの一般関税率は、いずれも2026年9月時点の目安。
// 高額品・重要な出品前には必ず実際の税率を確認すること。
export interface ItemCategoryPreset {
  label: string;
  fvfRatePercent: number;
  usGeneralDutyRatePercent: number;
  chinaCombinedDutyRatePercent: number;
  intlDutyRatePercent: number;
}

export const itemCategoryPresets: ItemCategoryPreset[] = [
  {
    label: 'バッグ・革小物',
    fvfRatePercent: 15.0,
    usGeneralDutyRatePercent: 8,
    chinaCombinedDutyRatePercent: 35,
    intlDutyRatePercent: 8
  },
  {
    label: '衣類',
    fvfRatePercent: 15.0,
    usGeneralDutyRatePercent: 12,
    chinaCombinedDutyRatePercent: 37,
    intlDutyRatePercent: 10
  },
  {
    label: 'シューズ',
    fvfRatePercent: 15.0,
    usGeneralDutyRatePercent: 10,
    chinaCombinedDutyRatePercent: 35,
    intlDutyRatePercent: 12
  },
  {
    label: 'サングラス',
    fvfRatePercent: 15.0,
    usGeneralDutyRatePercent: 2,
    chinaCombinedDutyRatePercent: 30,
    intlDutyRatePercent: 2
  },
  {
    label: '腕時計',
    fvfRatePercent: 15.0,
    usGeneralDutyRatePercent: 4,
    chinaCombinedDutyRatePercent: 30,
    intlDutyRatePercent: 4
  },
  {
    label: 'ジュエリー',
    fvfRatePercent: 15.0,
    usGeneralDutyRatePercent: 5.5,
    chinaCombinedDutyRatePercent: 30,
    intlDutyRatePercent: 5
  },
  {
    label: 'トレーディングカード',
    fvfRatePercent: 13.25,
    usGeneralDutyRatePercent: 0,
    chinaCombinedDutyRatePercent: 25,
    intlDutyRatePercent: 0
  },
  {
    label: 'その他',
    fvfRatePercent: 13.6,
    usGeneralDutyRatePercent: 5,
    chinaCombinedDutyRatePercent: 30,
    intlDutyRatePercent: 5
  }
];

export const chinaDutyRateHint =
  '中国原産（Made in China）はSection 301の追加関税が別枠で乗るため、日本原産の12.5%固定とは水準が全く違う（品目によって実効30〜37%程度、品目次第でさらに高くなることもある）。数字は2026年9月時点の目安で毎月のように変動するため、高額品は出品前に最新レートを確認し、必要なら手動で上書きすること。';

export const intlDestinationHint =
  'アメリカ以外は実請求データがなく一般的な関税率・消費税制度からの概算。カナダは少額免税枠が非常に低いため基本的に関税＋GST(5%)が発生する前提。イギリスは135ポンド、オーストラリアは1000豪ドルの閾値未満なら通常は購入者側でVAT/GSTが処理され出品者コストは発生しない想定（閾値以上のみ関税＋税を計算に含める）。';

// General Rate（原産国の基礎関税率）のデフォルト値。原産国が日本のときは
// Section 301の12.5%フロアが自動で効くのでユーザーが気にする必要が薄いため0にする。
// 米国等を選んだときはユーザーが実際のGeneral Rateを手入力する運用にする。
export const DEFAULT_GENERAL_DUTY_RATE_PERCENT = 0;

export const generalDutyRateHintJapan =
  '原産国が日本など（Section 301対象）の場合、General RateとSection 301の合計は必ず12.5%に揃う（Section 301が差分を埋める構造）ため、通常は入力不要で自動的に12.5%として計算される。品目のGeneral Rateが12.5%を超えると分かっている場合は、「米国等」に切り替えてGeneral Rateを直接入力すると、その値がそのまま採用される。';

export const generalDutyRateHintUs =
  '米国原産・米国製ヴィンテージ品などはSection 301の12.5%フロアが適用されない。実際のGeneral Rate（品目のHTSコードごとの税率）を確認して入力すること。分からなければ0のままでも計算は動くが過小評価になる可能性がある。';

// 「通関と処理」手数料の自動計算式の係数。Zonosの実請求6件（¥703 / ¥882 / ¥900 / ¥1,019 / ¥712 / ¥606）を
// 「販売価格」ではなく「関税額（dutyJpy）」で回帰し直した値（¥573 + 関税額×10.05%、誤差5円以内）。
// 旧式（¥570 + 販売価格×1.27%）は米国原産の実データ#6で167円もズレたため廃止。
export const CUSTOMS_HANDLING_BASE_JPY = 573;
export const CUSTOMS_HANDLING_DUTY_RATE = 0.1005;

export const customsHandlingHint =
  'Zonosの実請求6件から回帰した「¥573 + 関税額×10.05%」（関税額ベース）で自動計算している。実際の請求額が違う場合は手動入力に切り替える。';

export const dutyNote = `米国の$800免税（de minimis）は2025/8/29に撤廃済み。さらに2025/10/17から米国宛て$2,500以下はDDP（関税セラー負担）が必須なので、基本はONのまま使う。
Zonosの実請求を分析すると、General Rate と Section 301 の合計は品目を問わず12.5%に揃う。Section 301 が General Rate との差分を埋める構造になっているため、中古衣類（General Rate 0%）でもバッグ（4.5%）でも腕時計（6%）でも合計は12.5%。関税は商品価格のみにかかり、送料には かからない。
これに加えて「通関と処理」手数料が別途かかる（¥573 + 関税額×10.05% 程度）。関税と手数料を合わせると販売価格の15〜19%になり、安い商品ほど固定費が効いて重くなる。
原産国が日本など（Section 301対象）の場合、General RateとSection 301の合計は必ず12.5%（12.5%未満のGeneral Rateの品目はSection 301が差額を埋める）。ただし原産国が米国など再輸入扱いになる商品は、Section 301の12.5%フロアが適用されず、General Rateのみが課税される（実データ：原産国米国のヴィンテージサングラスは合計2.0%のみ）。ヴィンテージのアメリカ製品（Made in USA表記の古着・雑貨など）を扱う場合は「米国等」を選ぶとよい。`;
