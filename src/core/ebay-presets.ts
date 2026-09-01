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

// 原産国のトグル選択肢。'japan' はSection 301（12.5%フロア）の対象、
// 'us_or_other_exempt' は米国原産など再輸入扱いで12.5%フロアが適用されない区分。
export const originCountryOptions = [
  { value: 'japan', label: '日本（Section 301対象）' },
  { value: 'us_or_other_exempt', label: '米国等（Section 301対象外）' }
] as const;

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
