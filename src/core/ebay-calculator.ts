export type CustomsHandlingMode = 'auto' | 'manual';

// 原産国区分。'japan' はSection 301（12.5%フロア）の対象、
// 'us_or_other_exempt' は米国原産など再輸入扱いでSection 301の12.5%フロアが適用されない区分。
export type OriginCountry = 'japan' | 'us_or_other_exempt';

import { CUSTOMS_HANDLING_BASE_JPY, CUSTOMS_HANDLING_DUTY_RATE } from './ebay-presets';

const SECTION_301_FLOOR_RATE = 0.125;

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
  originCountry: OriginCountry;
  // 原産国のGeneral Rate（基礎関税率）。原産国が japan の場合はSection 301の12.5%フロアと
  // 比較して高い方が採用される（通常は12.5%が採用される）。us_or_other_exempt の場合はこの値がそのまま採用される。
  generalDutyRatePercent: number;
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
    originCountry,
    generalDutyRatePercent,
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

  // 関税（dutyJpy）：原産国がjapan（Section 301対象）の場合はGeneral Rateと12.5%フロアの
  // 高い方を採用。us_or_other_exempt（Section 301対象外）の場合はGeneral Rateのみ採用する。
  const generalDutyJpy = salePriceUsd * usdJpyRate * (generalDutyRatePercent / 100);
  const section301FloorJpy = salePriceUsd * usdJpyRate * SECTION_301_FLOOR_RATE;
  const dutyJpy = !dutyPaidBySeller
    ? 0
    : originCountry === 'japan'
      ? roundJpy(Math.max(generalDutyJpy, section301FloorJpy))
      : roundJpy(generalDutyJpy);

  // 通関と処理手数料：実データ6件から回帰した「573 + 関税額×10.05%」（関税額ベース）。
  const customsHandlingFeeJpy = !dutyPaidBySeller
    ? 0
    : customsHandlingMode === 'manual'
      ? customsHandlingJpy
      : Math.round(CUSTOMS_HANDLING_BASE_JPY + dutyJpy * CUSTOMS_HANDLING_DUTY_RATE);
  const costJpy =
    purchasePriceJpy + domesticShippingJpy + intlShippingJpy + dutyJpy + customsHandlingFeeJpy;
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
