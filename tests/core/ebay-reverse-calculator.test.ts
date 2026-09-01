import { describe, expect, it } from 'vitest';
import { calculateEbayProfit, type EbayCalculatorInput } from '../../src/core/ebay-calculator';
import { calculateRequiredSalePriceUsd } from '../../src/core/ebay-reverse-calculator';

const baseInput: Omit<EbayCalculatorInput, 'salePriceUsd'> = {
  purchasePriceJpy: 10000,
  domesticShippingJpy: 0,
  shippingChargedUsd: 0,
  intlShippingJpy: 3900,
  fvfRatePercent: 13.6,
  internationalFeePercent: 1.65,
  fxFeePercent: 2.0,
  usdJpyRate: 155,
  promotedPercent: 0,
  dutyPaidBySeller: false,
  originCountry: 'japan',
  generalDutyRatePercent: 15,
  customsHandlingMode: 'auto',
  customsHandlingJpy: 0
};

describe('calculateRequiredSalePriceUsd', () => {
  it('希望利益額モード：仕入れ値10000円・希望利益5000円で目標利益を達成する出品価格を返す', () => {
    const result = calculateRequiredSalePriceUsd(baseInput, { mode: 'amount', profitJpy: 5000 });

    expect(result.salePriceUsd).toBeGreaterThan(0);
    expect(result.profitJpy).toBeGreaterThanOrEqual(5000);

    // 求めた価格で実際に calculateEbayProfit を回して一致することを確認
    const evaluated = calculateEbayProfit({ ...baseInput, salePriceUsd: result.salePriceUsd });
    expect(evaluated.profitJpy).toBe(result.profitJpy);
    expect(evaluated.profitMarginPercent).toBe(result.profitMarginPercent);
    expect(result.salePriceJpy).toBe(Math.round(result.salePriceUsd * baseInput.usdJpyRate));

    // 1セント下げると目標を下回ることを確認（最小値であることの検証）
    const oneCentLower = Math.round((result.salePriceUsd - 0.01) * 100) / 100;
    const lowerEvaluated = calculateEbayProfit({ ...baseInput, salePriceUsd: oneCentLower });
    expect(lowerEvaluated.profitJpy).toBeLessThan(5000);
  });

  it('希望利益率モード：目標利益率以上を達成する出品価格を返す', () => {
    const result = calculateRequiredSalePriceUsd(baseInput, { mode: 'rate', marginPercent: 25 });

    expect(result.profitMarginPercent).toBeGreaterThanOrEqual(25);

    const evaluated = calculateEbayProfit({ ...baseInput, salePriceUsd: result.salePriceUsd });
    expect(evaluated.profitMarginPercent).toBe(result.profitMarginPercent);
  });

  it('仕入れ値0円でも計算できる', () => {
    const zeroPurchaseInput = { ...baseInput, purchasePriceJpy: 0 };
    const result = calculateRequiredSalePriceUsd(zeroPurchaseInput, { mode: 'amount', profitJpy: 5000 });

    expect(result.salePriceUsd).toBeGreaterThan(0);
    expect(result.profitJpy).toBeGreaterThanOrEqual(5000);
  });

  it('DDP（関税を自分で負担）をONにすると同じ目標利益でも出品価格が上がる', () => {
    const withoutDuty = calculateRequiredSalePriceUsd(baseInput, { mode: 'amount', profitJpy: 5000 });
    const withDuty = calculateRequiredSalePriceUsd(
      { ...baseInput, dutyPaidBySeller: true },
      { mode: 'amount', profitJpy: 5000 }
    );

    expect(withDuty.salePriceUsd).toBeGreaterThan(withoutDuty.salePriceUsd);
  });

  it('仕入れ値10,000円・希望利益5,000円・標準カテゴリ13.6%・国内送料0・EMS〜500g(3,900円)・レート155の具体例', () => {
    const result = calculateRequiredSalePriceUsd(baseInput, { mode: 'amount', profitJpy: 5000 });

    expect(result.profitJpy).toBeGreaterThanOrEqual(5000);
    expect(result.profitMarginPercent).toBeGreaterThan(0);
  });
});
