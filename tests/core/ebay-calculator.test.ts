import { describe, expect, it } from 'vitest';
import {
  calculateBreakEvenSalePriceUsd,
  calculateEbayProfit,
  type EbayCalculatorInput
} from '../../src/core/ebay-calculator';

const baseInput: EbayCalculatorInput = {
  purchasePriceJpy: 10000,
  domesticShippingJpy: 0,
  salePriceUsd: 100,
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

describe('calculateEbayProfit', () => {
  it('仕入れ値10000円・販売予想100ドル・標準カテゴリ13.6%・EMS3900円・レート155で赤字を算出する', () => {
    const result = calculateEbayProfit(baseInput);

    expect(result.totalSaleUsd).toBe(100);
    expect(result.fvfUsd).toBe(14);
    expect(result.perOrderFeeUsd).toBe(0.4);
    expect(result.intlFeeUsd).toBe(1.65);
    expect(result.netUsd).toBe(84.35);
    expect(result.netJpy).toBe(12813);
    expect(result.costJpy).toBe(13900);
    expect(result.profitJpy).toBe(-1087);
    expect(result.profitMarginPercent).toBeCloseTo(-7.014419354838713, 9);
    expect(result.roiPercent).toBeCloseTo(-7.821834532374104, 9);
  });

  it('totalSaleUsdが0のときper-order feeは0になる', () => {
    const result = calculateEbayProfit({ ...baseInput, salePriceUsd: 0 });

    expect(result.totalSaleUsd).toBe(0);
    expect(result.perOrderFeeUsd).toBe(0);
    expect(result.fvfUsd).toBe(0);
    expect(result.netJpy).toBe(0);
    expect(result.profitMarginPercent).toBe(0);
    expect(result.roiPercent).toBe(-100);
  });

  it('totalSaleUsdが$10ちょうどの場合はper-order feeが0.30になる', () => {
    const result = calculateEbayProfit({ ...baseInput, salePriceUsd: 10 });

    expect(result.totalSaleUsd).toBe(10);
    expect(result.perOrderFeeUsd).toBe(0.3);
    expect(result.fvfUsd).toBe(1.66);
    expect(result.profitJpy).toBe(-12658);
  });

  it('totalSaleUsdが$10.01の場合はper-order feeが0.40になる', () => {
    const result = calculateEbayProfit({ ...baseInput, salePriceUsd: 10.01 });

    expect(result.totalSaleUsd).toBe(10.01);
    expect(result.perOrderFeeUsd).toBe(0.4);
    expect(result.fvfUsd).toBe(1.76);
    expect(result.profitJpy).toBe(-12672);
  });

  it('赤字ケースでは利益がマイナスになる', () => {
    const result = calculateEbayProfit(baseInput);

    expect(result.profitJpy).toBeLessThan(0);
    expect(result.profitMarginPercent).toBeLessThan(0);
  });

  it('DDP（関税を自分で負担）をONにすると関税分と通関と処理手数料がコストに加算される', () => {
    const result = calculateEbayProfit({ ...baseInput, dutyPaidBySeller: true });

    // 15% > 12.5%フロアなのでGeneral Rate（15%）がそのまま採用される
    expect(result.dutyJpy).toBe(2325);
    // 新式: 573 + dutyJpy(2325) × 10.05% = 806.7825 → 807
    expect(result.customsHandlingFeeJpy).toBe(807);
    expect(result.costJpy).toBe(17032);
    expect(result.profitJpy).toBe(-4219);
    expect(result.profitMarginPercent).toBeCloseTo(-27.220870967741938, 9);
  });

  it('黒字ケースでは利益率とROIが正になる', () => {
    const result = calculateEbayProfit({
      ...baseInput,
      purchasePriceJpy: 3000,
      salePriceUsd: 150
    });

    expect(result.profitJpy).toBeGreaterThan(0);
    expect(result.profitMarginPercent).toBeGreaterThan(0);
    expect(result.roiPercent).toBeGreaterThan(0);
  });
});

describe('原産国とSection 301の12.5%フロア', () => {
  it('原産国が日本でGeneral Rate入力が0のとき、12.5%フロアがそのまま採用される', () => {
    const result = calculateEbayProfit({
      ...baseInput,
      salePriceUsd: 200,
      shippingChargedUsd: 0,
      dutyPaidBySeller: true,
      originCountry: 'japan',
      generalDutyRatePercent: 0
    });

    expect(result.dutyJpy).toBe(Math.round(200 * 0.125 * baseInput.usdJpyRate));
  });

  it('関税額は送料（shippingChargedUsd）を含まない', () => {
    const withoutShippingCharge = calculateEbayProfit({
      ...baseInput,
      salePriceUsd: 200,
      shippingChargedUsd: 0,
      dutyPaidBySeller: true,
      originCountry: 'japan',
      generalDutyRatePercent: 12.5
    });
    const withShippingCharge = calculateEbayProfit({
      ...baseInput,
      salePriceUsd: 200,
      shippingChargedUsd: 30,
      dutyPaidBySeller: true,
      originCountry: 'japan',
      generalDutyRatePercent: 12.5
    });

    expect(withoutShippingCharge.dutyJpy).toBe(Math.round(200 * 0.125 * baseInput.usdJpyRate));
    expect(withShippingCharge.dutyJpy).toBe(withoutShippingCharge.dutyJpy);
  });

  it('原産国が日本でGeneral Rateが12.5%を超える場合は、その値が優先される（フロアより高いので）', () => {
    const result = calculateEbayProfit({
      ...baseInput,
      salePriceUsd: 200,
      dutyPaidBySeller: true,
      originCountry: 'japan',
      generalDutyRatePercent: 20
    });

    expect(result.dutyJpy).toBe(Math.round(200 * 0.2 * baseInput.usdJpyRate));
  });

  it('原産国が米国等（Section 301対象外）のときは12.5%フロアが適用されず、General Rateがそのまま採用される', () => {
    const result = calculateEbayProfit({
      ...baseInput,
      salePriceUsd: 100,
      usdJpyRate: 155,
      dutyPaidBySeller: true,
      originCountry: 'us_or_other_exempt',
      generalDutyRatePercent: 2
    });

    // 12.5%フロア（1937.5円相当）で頭打ちにならず、2%分だけが課税される
    expect(result.dutyJpy).toBe(Math.round(100 * 155 * 0.02));
    expect(result.dutyJpy).toBeLessThan(Math.round(100 * 155 * 0.125));
  });
});

describe('通関と処理手数料（関税額ベースの新式）', () => {
  it('DDPがOFFのとき通関と処理手数料は0になる', () => {
    const result = calculateEbayProfit({
      ...baseInput,
      salePriceUsd: 200,
      dutyPaidBySeller: false
    });

    expect(result.customsHandlingFeeJpy).toBe(0);
  });

  it('手動入力モードでは指定した金額がそのまま通関と処理手数料になる', () => {
    const result = calculateEbayProfit({
      ...baseInput,
      salePriceUsd: 200,
      dutyPaidBySeller: true,
      customsHandlingMode: 'manual',
      customsHandlingJpy: 1234
    });

    expect(result.customsHandlingFeeJpy).toBe(1234);
  });

  // Zonosの実請求6件（今までの4件＋原産国米国のヴィンテージサングラス2件目の新規データ含む）を
  // 「関税額(dutyJpy)」で回帰し直した「¥573 + 関税額×10.05%」で自動計算した通関と処理手数料が、
  // 実測値の±10円以内に収まることを検証する。generalDutyRatePercentは実測の関税額から逆算した
  // 実効税率（原産国japanの行は12.5%フロアとの比較込みで検証）。
  it.each([
    {
      label: 'デニム',
      originCountry: 'japan' as const,
      salePriceJpy: 10365,
      measuredDutyJpy: 1296,
      measuredFeeJpy: 703
    },
    {
      label: 'バッグ',
      originCountry: 'japan' as const,
      salePriceJpy: 24700,
      measuredDutyJpy: 3087,
      measuredFeeJpy: 882
    },
    {
      label: '腕時計#1',
      originCountry: 'japan' as const,
      salePriceJpy: 25488,
      measuredDutyJpy: 3282,
      measuredFeeJpy: 900
    },
    {
      label: '腕時計#2',
      originCountry: 'japan' as const,
      salePriceJpy: 35316,
      measuredDutyJpy: 4415,
      measuredFeeJpy: 1019
    },
    {
      label: 'ポケモンカード',
      originCountry: 'japan' as const,
      salePriceJpy: 11046,
      measuredDutyJpy: 1381,
      measuredFeeJpy: 712
    },
    {
      label: 'ヴィンテージサングラス（原産国US）',
      originCountry: 'us_or_other_exempt' as const,
      salePriceJpy: 15977,
      measuredDutyJpy: 320,
      measuredFeeJpy: 606
    }
  ])(
    '実データ検証（$label）: 原産国=$originCountry, 販売価格$salePriceJpy円のとき通関と処理手数料の自動計算値が実測$measuredFeeJpy円の±10円以内',
    ({ originCountry, salePriceJpy, measuredDutyJpy, measuredFeeJpy }) => {
      const usdJpyRate = 155;
      // 実測の関税額から逆算した実効税率をGeneral Rateとして入力する
      // （japan原産の行は内部で12.5%フロアと比較され、高い方が採用される）
      const generalDutyRatePercent = (measuredDutyJpy / salePriceJpy) * 100;

      const result = calculateEbayProfit({
        ...baseInput,
        usdJpyRate,
        salePriceUsd: salePriceJpy / usdJpyRate,
        dutyPaidBySeller: true,
        originCountry,
        generalDutyRatePercent,
        customsHandlingMode: 'auto'
      });

      // 逆算した実効税率から求めたdutyJpyは、実測の関税額とほぼ一致する（丸め誤差1〜2円以内）
      expect(Math.abs(result.dutyJpy - measuredDutyJpy)).toBeLessThanOrEqual(2);
      // 新式（¥573 + 関税額×10.05%）で計算した通関と処理手数料は実測の±10円以内
      expect(Math.abs(result.customsHandlingFeeJpy - measuredFeeJpy)).toBeLessThanOrEqual(10);
    }
  );
});

describe('calculateBreakEvenSalePriceUsd', () => {
  it('目標利益率20%を満たす販売価格を二分探索で求める', () => {
    const { salePriceUsd: _omit, ...withoutSalePrice } = baseInput;
    const breakEvenUsd = calculateBreakEvenSalePriceUsd(withoutSalePrice, 20);

    const result = calculateEbayProfit({ ...baseInput, salePriceUsd: breakEvenUsd });

    expect(result.profitMarginPercent).toBeGreaterThanOrEqual(20);
    expect(result.profitMarginPercent).toBeLessThan(20.5);
  });

  it('目標利益率を上げるほど必要な販売価格も上がる', () => {
    const { salePriceUsd: _omit, ...withoutSalePrice } = baseInput;
    const low = calculateBreakEvenSalePriceUsd(withoutSalePrice, 10);
    const high = calculateBreakEvenSalePriceUsd(withoutSalePrice, 30);

    expect(high).toBeGreaterThan(low);
  });
});
