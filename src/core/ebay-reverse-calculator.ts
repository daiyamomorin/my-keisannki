import { calculateEbayProfit, type EbayCalculatorInput } from './ebay-calculator';

export type EbayReverseTarget =
  | { mode: 'amount'; profitJpy: number }
  | { mode: 'rate'; marginPercent: number };

export interface EbayReverseCalculatorResult {
  salePriceUsd: number;
  salePriceJpy: number;
  profitJpy: number;
  profitMarginPercent: number;
}

const MAX_SEARCH_USD = 100000;
const PRECISION_USD = 0.01;
const MAX_ITERATIONS = 100;

const roundUsd = (value: number): number => Math.round(value * 100) / 100;
const roundJpy = (value: number): number => Math.round(value);
// 目標を必ず満たすよう切り上げる（切り捨てだとセント単位の丸めで目標未達になりうるため）
const ceilUsd = (value: number): number => Math.ceil(value * 100) / 100;

export const calculateRequiredSalePriceUsd = (
  input: Omit<EbayCalculatorInput, 'salePriceUsd'>,
  target: EbayReverseTarget
): EbayReverseCalculatorResult => {
  const meetsTarget = (salePriceUsd: number): boolean => {
    const result = calculateEbayProfit({ ...input, salePriceUsd });
    return target.mode === 'amount'
      ? result.profitJpy >= target.profitJpy
      : result.profitMarginPercent >= target.marginPercent;
  };

  let low = 0;
  let high = MAX_SEARCH_USD;

  if (!meetsTarget(high)) {
    // 目標に到達不可能な場合は探索上限を返す
    low = high;
  } else {
    for (let i = 0; i < MAX_ITERATIONS && high - low > PRECISION_USD; i += 1) {
      const mid = (low + high) / 2;
      if (meetsTarget(mid)) {
        high = mid;
      } else {
        low = mid;
      }
    }
  }

  // high は必ず目標を満たす境界値（1セント精度）。まずセント単位で切り捨てた値を試し、
  // それでも目標を満たすならそれを採用（＝目標を満たす最小のセント単位価格）、
  // 満たさなければ切り上げる。
  const flooredCandidate = Math.floor(high * 100) / 100;
  let salePriceUsd = meetsTarget(flooredCandidate) ? flooredCandidate : ceilUsd(high);
  let evaluated = calculateEbayProfit({ ...input, salePriceUsd });

  // 念のため：それでも目標未達なら1セントずつ足す（丸め誤差の安全網）
  while (
    salePriceUsd < MAX_SEARCH_USD &&
    !(target.mode === 'amount'
      ? evaluated.profitJpy >= target.profitJpy
      : evaluated.profitMarginPercent >= target.marginPercent)
  ) {
    salePriceUsd = roundUsd(salePriceUsd + PRECISION_USD);
    evaluated = calculateEbayProfit({ ...input, salePriceUsd });
  }

  const salePriceJpy = roundJpy(salePriceUsd * input.usdJpyRate);

  return {
    salePriceUsd,
    salePriceJpy,
    profitJpy: evaluated.profitJpy,
    profitMarginPercent: evaluated.profitMarginPercent
  };
};
