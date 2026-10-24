import { calculateEbayProfit, type EbayCalculatorInput } from '../../src/core/ebay-calculator';

// 2026-10 実注文: コーチのスエードバッグ（原産国中国）。販売$474.30、仕入れ19,500円、国内送料4,180円。
// 実請求: Zonos 関税34,185円（46.5%）+ 手数料3,983円、eBay手数料$93.11（税込$515.21にかかる）。
const base: EbayCalculatorInput = {
  purchasePriceJpy: 19500,
  domesticShippingJpy: 4180,
  salePriceUsd: 474.3,
  shippingChargedUsd: 0,
  intlShippingJpy: 0,
  fvfRatePercent: 15,
  internationalFeePercent: 1.65,
  fxFeePercent: 2,
  usdJpyRate: 155,
  promotedPercent: 0,
  dutyPaidBySeller: true,
  destinationCountry: 'us',
  originCountry: 'china',
  generalDutyRatePercent: 8,
  chinaCombinedDutyRatePercent: 46.5,
  intlDutyRatePercent: 8,
  customsHandlingMode: 'auto',
  customsHandlingJpy: 0
};

describe('実注文との突き合わせ（コーチ・中国原産バッグ）', () => {
  it('中国46.5%なら関税・通関手数料がZonosの実請求とほぼ一致する', () => {
    const result = calculateEbayProfit(base);
    expect(Math.abs(result.dutyJpy - 34185)).toBeLessThanOrEqual(5);
    expect(Math.abs(result.customsHandlingFeeJpy - 3983)).toBeLessThanOrEqual(40);
  });

  it('Sales taxを手数料ベースに含めると、eBay手数料が実請求に近づく', () => {
    const withoutTax = calculateEbayProfit(base);
    const withTax = calculateEbayProfit({ ...base, buyerSalesTaxPercent: 8.6 });
    expect(withTax.fvfUsd + withTax.intlFeeUsd).toBeGreaterThan(withoutTax.fvfUsd + withoutTax.intlFeeUsd);
    // 税込みベースでFVF15%+0.40+国際1.65% ≒ $86.2（実請求$93.11。残りは広告費などの別料金）
    expect(withTax.fvfUsd + withTax.intlFeeUsd).toBeCloseTo(86.2, 0);
  });
});
