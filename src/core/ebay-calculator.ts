export type CustomsHandlingMode = 'auto' | 'manual';

// 原産国区分。'japan' はSection 301（12.5%フロア）の対象、'china' はSection 301の追加関税が
// 別枠で乗る区分（品目次第で水準が大きく変わる）、'us_or_other_exempt' は米国原産など再輸入扱いで
// Section 301の12.5%フロアが適用されない区分。
export type OriginCountry = 'japan' | 'china' | 'us_or_other_exempt';

// 配送先国。'us' 以外は実請求データがなく一般的な関税率・消費税制度からの概算。
export type DestinationCountry = 'us' | 'ca' | 'uk' | 'au';

import { CUSTOMS_HANDLING_BASE_JPY, CUSTOMS_HANDLING_DUTY_RATE } from './ebay-presets';

const SECTION_301_FLOOR_RATE = 0.125;

// イギリス：135ポンド未満は購入者側でVATが処理され出品者コストは発生しない想定（概算のUSD換算）。
const UK_DUTY_VAT_THRESHOLD_USD = 180;
// オーストラリア：1000豪ドル未満は購入者側でGSTが処理され出品者コストは発生しない想定（概算のUSD換算）。
const AU_GST_THRESHOLD_USD = 650;
const CA_GST_RATE = 0.05;
const UK_VAT_RATE = 0.2;
const AU_GST_RATE = 0.1;

export interface EbayCalculatorInput {
  purchasePriceJpy: number;
  domesticShippingJpy: number;
  salePriceUsd: number;
  shippingChargedUsd: number;
  intlShippingJpy: number;
  fvfRatePercent: number;
  internationalFeePercent: number;
  fxFeePercent: number;
  usdJpyRate: number;
  promotedPercent: number;
  dutyPaidBySeller: boolean;
  destinationCountry: DestinationCountry;
  originCountry: OriginCountry;
  // 原産国のGeneral Rate（基礎関税率）。原産国が japan の場合はSection 301の12.5%フロアと
  // 比較して高い方が採用される（通常は12.5%が採用される）。us_or_other_exempt の場合はこの値がそのまま採用される。
  generalDutyRatePercent: number;
  // 原産国が china の場合に採用する、MFN+Section301を合算した実効関税率（destinationCountryが us のときのみ使用）。
  chinaCombinedDutyRatePercent: number;
  // 配送先が ca/uk/au の場合に使う一般的な関税率（カテゴリごとの概算）。
  intlDutyRatePercent: number;
  customsHandlingMode: CustomsHandlingMode;
  customsHandlingJpy: number;
}

export interface EbayCalculatorResult {
  totalSaleUsd: number;
  fvfUsd: number;
  perOrderFeeUsd: number;
  intlFeeUsd: number;
  promotedUsd: number;
  netUsd: number;
  netJpy: number;
  dutyJpy: number;
  customsHandlingFeeJpy: number;
  // カナダ/イギリス/オーストラリア向けのGST/VAT（出品者負担分。閾値未満や配送先が米国の場合は0）。
  intlTaxJpy: number;
  costJpy: number;
  profitJpy: number;
  profitMarginPercent: number;
  roiPercent: number;
}

const roundJpy = (value: number): number => Math.round(value);
const roundUsd = (value: number): number => Math.round(value * 100) / 100;

const calculatePerOrderFeeUsd = (totalSaleUsd: number): number => {
  if (totalSaleUsd === 0) {
    return 0;
  }

  return totalSaleUsd <= 10 ? 0.3 : 0.4;
};

export const calculateEbayProfit = (input: EbayCalculatorInput): EbayCalculatorResult => {
  const {
    purchasePriceJpy,
    domesticShippingJpy,
    salePriceUsd,
    shippingChargedUsd,
    intlShippingJpy,
    fvfRatePercent,
    internationalFeePercent,
    fxFeePercent,
    usdJpyRate,
    promotedPercent,
    dutyPaidBySeller,
    destinationCountry,
    originCountry,
    generalDutyRatePercent,
    chinaCombinedDutyRatePercent,
    intlDutyRatePercent,
    customsHandlingMode,
    customsHandlingJpy
  } = input;

  const totalSaleUsd = salePriceUsd + shippingChargedUsd;
  const perOrderFeeUsd = calculatePerOrderFeeUsd(totalSaleUsd);
  const fvfUsd = totalSaleUsd * (fvfRatePercent / 100) + perOrderFeeUsd;
  const intlFeeUsd = totalSaleUsd * (internationalFeePercent / 100);
  const promotedUsd = salePriceUsd * (promotedPercent / 100);
  const netUsd = totalSaleUsd - fvfUsd - intlFeeUsd - promotedUsd;
  const netJpy = netUsd * usdJpyRate * (1 - fxFeePercent / 100);

  const saleJpy = salePriceUsd * usdJpyRate;

  let dutyJpy = 0;
  let customsHandlingFeeJpy = 0;
  let intlTaxJpy = 0;

  if (destinationCountry === 'us') {
    // 関税（dutyJpy）：原産国がjapan（Section 301対象）の場合はGeneral Rateと12.5%フロアの
    // 高い方を採用。china の場合はMFN+Section301の合算実効税率をそのまま採用。
    // us_or_other_exempt（Section 301対象外）の場合はGeneral Rateのみ採用する。
    const generalDutyJpy = saleJpy * (generalDutyRatePercent / 100);
    const section301FloorJpy = saleJpy * SECTION_301_FLOOR_RATE;
    const chinaDutyJpy = saleJpy * (chinaCombinedDutyRatePercent / 100);
    dutyJpy = !dutyPaidBySeller
      ? 0
      : originCountry === 'japan'
        ? roundJpy(Math.max(generalDutyJpy, section301FloorJpy))
        : originCountry === 'china'
          ? roundJpy(chinaDutyJpy)
          : roundJpy(generalDutyJpy);

    // 通関と処理手数料：実データ6件から回帰した「573 + 関税額×10.05%」（関税額ベース）。
    customsHandlingFeeJpy = !dutyPaidBySeller
      ? 0
      : customsHandlingMode === 'manual'
        ? customsHandlingJpy
        : Math.round(CUSTOMS_HANDLING_BASE_JPY + dutyJpy * CUSTOMS_HANDLING_DUTY_RATE);
  } else if (dutyPaidBySeller) {
    // 米国以外（カナダ・イギリス・オーストラリア）：実請求データがない一般的な概算。
    // カナダは少額免税枠が非常に低いため常時、イギリス/オーストラリアは閾値以上のときのみ計算する。
    if (destinationCountry === 'ca') {
      dutyJpy = roundJpy(saleJpy * (intlDutyRatePercent / 100));
      intlTaxJpy = roundJpy((saleJpy + dutyJpy) * CA_GST_RATE);
    } else if (destinationCountry === 'uk' && salePriceUsd >= UK_DUTY_VAT_THRESHOLD_USD) {
      dutyJpy = roundJpy(saleJpy * (intlDutyRatePercent / 100));
      intlTaxJpy = roundJpy((saleJpy + dutyJpy) * UK_VAT_RATE);
    } else if (destinationCountry === 'au' && salePriceUsd >= AU_GST_THRESHOLD_USD) {
      dutyJpy = roundJpy(saleJpy * (intlDutyRatePercent / 100));
      intlTaxJpy = roundJpy(saleJpy * AU_GST_RATE);
    }
  }

  const costJpy =
    purchasePriceJpy +
    domesticShippingJpy +
    intlShippingJpy +
    dutyJpy +
    customsHandlingFeeJpy +
    intlTaxJpy;
  const profitJpy = netJpy - costJpy;
  const profitMarginPercent = totalSaleUsd > 0 ? (profitJpy / (totalSaleUsd * usdJpyRate)) * 100 : 0;
  const roiPercent = costJpy > 0 ? (profitJpy / costJpy) * 100 : 0;

  return {
    totalSaleUsd: roundUsd(totalSaleUsd),
    fvfUsd: roundUsd(fvfUsd),
    perOrderFeeUsd: roundUsd(perOrderFeeUsd),
    intlFeeUsd: roundUsd(intlFeeUsd),
    promotedUsd: roundUsd(promotedUsd),
    netUsd: roundUsd(netUsd),
    netJpy: roundJpy(netJpy),
    dutyJpy: roundJpy(dutyJpy),
    customsHandlingFeeJpy: roundJpy(customsHandlingFeeJpy),
    intlTaxJpy: roundJpy(intlTaxJpy),
    costJpy: roundJpy(costJpy),
    profitJpy: roundJpy(profitJpy),
    profitMarginPercent,
    roiPercent
  };
};

const MAX_SEARCH_USD = 100000;
const PRECISION_USD = 0.01;
const MAX_ITERATIONS = 100;

export const calculateBreakEvenSalePriceUsd = (
  input: Omit<EbayCalculatorInput, 'salePriceUsd'>,
  targetProfitMarginPercent = 20
): number => {
  const marginAt = (salePriceUsd: number): number =>
    calculateEbayProfit({ ...input, salePriceUsd }).profitMarginPercent;

  let low = 0;
  let high = MAX_SEARCH_USD;

  // ターゲットに到達不可能な場合は上限を返す
  if (marginAt(high) < targetProfitMarginPercent) {
    return roundUsd(high);
  }

  for (let i = 0; i < MAX_ITERATIONS && high - low > PRECISION_USD; i += 1) {
    const mid = (low + high) / 2;
    if (marginAt(mid) < targetProfitMarginPercent) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return roundUsd(high);
};
