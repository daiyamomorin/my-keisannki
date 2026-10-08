// 原産国ごとの米国関税の区分（2026-07-24のSection 301・強制労働関税。出典: eBay Japan「米国向け関税のお知らせ」、
// USTRの国別区分を解説した記事）。数字は2026年10月時点の目安で、変わったらこのファイルだけ直す。
//   floor_12_5: 日本・韓国・スイス … MFN税率と合算して12.5%になるようSection 301が調整（MFNが12.5%以上なら上乗せなし）
//   cap_10    : EU・台湾          … 同様に合計10%に調整
//   add_10    : 強制労働の輸入禁止を導入済み／米国と合意した国 … MFN税率 + 10%
//   add_12_5  : それ以外のほとんどの国（ベトナム・タイ・フィリピン・トルコ等、原産国不明の安全側もここ）… MFN税率 + 12.5%
//   china     : 中国 … 旧Section 301などが重なるため、品目別の合計実効税率（別入力）を使う
//   general_only: 米国原産（再輸入）… MFN税率のみ
export type OriginTier = 'floor_12_5' | 'cap_10' | 'add_10' | 'add_12_5' | 'china' | 'general_only';

export interface OriginCountryDefinition {
  value: string;
  label: string;
  tier: OriginTier;
}

// 日本・中国・米国は既存の3択ボタンで選ぶ。ここは「その他の国」のプルダウン用。
export const extraOriginCountries = [
  { value: 'south_korea', label: '韓国', tier: 'floor_12_5' },
  { value: 'switzerland', label: 'スイス', tier: 'floor_12_5' },
  { value: 'italy', label: 'イタリア', tier: 'cap_10' },
  { value: 'france', label: 'フランス', tier: 'cap_10' },
  { value: 'spain', label: 'スペイン', tier: 'cap_10' },
  { value: 'germany', label: 'ドイツ', tier: 'cap_10' },
  { value: 'portugal', label: 'ポルトガル', tier: 'cap_10' },
  { value: 'romania', label: 'ルーマニア', tier: 'cap_10' },
  { value: 'taiwan', label: '台湾', tier: 'cap_10' },
  { value: 'india', label: 'インド', tier: 'add_10' },
  { value: 'indonesia', label: 'インドネシア', tier: 'add_10' },
  { value: 'cambodia', label: 'カンボジア', tier: 'add_10' },
  { value: 'malaysia', label: 'マレーシア', tier: 'add_10' },
  { value: 'mexico', label: 'メキシコ', tier: 'add_10' },
  { value: 'united_kingdom', label: 'イギリス', tier: 'add_10' },
  { value: 'bangladesh', label: 'バングラデシュ', tier: 'add_10' },
  { value: 'vietnam', label: 'ベトナム', tier: 'add_12_5' },
  { value: 'thailand', label: 'タイ', tier: 'add_12_5' },
  { value: 'philippines', label: 'フィリピン', tier: 'add_12_5' },
  { value: 'turkey', label: 'トルコ', tier: 'add_12_5' },
  { value: 'costa_rica', label: 'コスタリカ', tier: 'add_12_5' },
  { value: 'unknown', label: '不明（安全側：MFN+12.5%）', tier: 'add_12_5' }
] as const satisfies readonly OriginCountryDefinition[];

export type ExtraOriginCountry = (typeof extraOriginCountries)[number]['value'];

// 既存の3区分（'us_or_other_exempt' は米国原産など再輸入扱い）と、その他の国のid。
export type OriginCountry = 'japan' | 'china' | 'us_or_other_exempt' | ExtraOriginCountry;

export const getOriginTier = (origin: OriginCountry): OriginTier => {
  if (origin === 'japan') return 'floor_12_5';
  if (origin === 'china') return 'china';
  if (origin === 'us_or_other_exempt') return 'general_only';
  return extraOriginCountries.find((country) => country.value === origin)?.tier ?? 'add_12_5';
};

export const originTierHints: Record<OriginTier, string> = {
  floor_12_5:
    'MFN税率とSection 301の合計が12.5%に揃う（MFNが12.5%以上ならそのまま）。General Rateの入力は不要。',
  cap_10:
    'MFN税率とSection 301の合計が10%に揃う（MFNが10%以上ならそのまま）。General Rate（MFN税率）を入れると、10%と比べて高い方が採用される。',
  add_10:
    'MFN税率に10%が上乗せされる（Section 301・強制労働関税）。General Rate（MFN税率）を入れる。',
  add_12_5:
    'MFN税率に12.5%が上乗せされる（Section 301・強制労働関税）。原産国が不明のときもこの区分で、安全側に高めに見積もる。General Rate（MFN税率）を入れる。',
  china: '中国は品目別の合計実効税率（MFN＋Section 301など）を使う。',
  general_only: 'Section 301の対象外。General Rate（MFN税率）だけが課税される。'
};

// 区分ごとの米国向け関税率（%）。generalRate は品目のGeneral Rate（MFN）、chinaRate は中国の合計実効税率。
export const calculateUsDutyRatePercent = (
  tier: OriginTier,
  generalRatePercent: number,
  chinaRatePercent: number
): number => {
  switch (tier) {
    case 'floor_12_5':
      return Math.max(generalRatePercent, 12.5);
    case 'cap_10':
      return Math.max(generalRatePercent, 10);
    case 'add_10':
      return generalRatePercent + 10;
    case 'add_12_5':
      return generalRatePercent + 12.5;
    case 'china':
      return chinaRatePercent;
    default:
      return generalRatePercent;
  }
};
