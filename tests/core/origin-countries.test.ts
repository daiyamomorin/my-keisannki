import { describe, expect, it } from 'vitest';
import { calculateEbayProfit, type EbayCalculatorInput } from '../../src/core/ebay-calculator';
import { brandOriginPresets } from '../../src/core/brand-origins';
import {
  calculateUsDutyRatePercent,
  extraOriginCountries,
  getOriginTier
} from '../../src/core/origin-countries';

const baseInput: EbayCalculatorInput = {
  purchasePriceJpy: 10000,
  domesticShippingJpy: 0,
  salePriceUsd: 100,
  shippingChargedUsd: 0,
  intlShippingJpy: 3900,
  fvfRatePercent: 15,
  internationalFeePercent: 1.65,
  fxFeePercent: 2.0,
  usdJpyRate: 155,
  promotedPercent: 0,
  dutyPaidBySeller: true,
  destinationCountry: 'us',
  originCountry: 'japan',
  generalDutyRatePercent: 8,
  chinaCombinedDutyRatePercent: 35,
  intlDutyRatePercent: 0,
  customsHandlingMode: 'auto',
  customsHandlingJpy: 0
};

describe('原産国の関税区分', () => {
  it('日本・韓国・スイスは合計12.5%に調整される（MFN8%なら12.5%、MFN15%ならそのまま15%）', () => {
    expect(calculateUsDutyRatePercent(getOriginTier('japan'), 8, 35)).toBe(12.5);
    expect(calculateUsDutyRatePercent(getOriginTier('south_korea'), 8, 35)).toBe(12.5);
    expect(calculateUsDutyRatePercent(getOriginTier('switzerland'), 15, 35)).toBe(15);
  });

  it('EU・台湾は合計10%に調整される', () => {
    expect(calculateUsDutyRatePercent(getOriginTier('italy'), 8, 35)).toBe(10);
    expect(calculateUsDutyRatePercent(getOriginTier('taiwan'), 12, 35)).toBe(12);
  });

  it('インド・インドネシア等はMFN+10%、ベトナム・タイ・フィリピン・トルコ・不明はMFN+12.5%', () => {
    expect(calculateUsDutyRatePercent(getOriginTier('indonesia'), 8, 35)).toBe(18);
    expect(calculateUsDutyRatePercent(getOriginTier('india'), 10, 35)).toBe(20);
    expect(calculateUsDutyRatePercent(getOriginTier('vietnam'), 8, 35)).toBe(20.5);
    expect(calculateUsDutyRatePercent(getOriginTier('thailand'), 8, 35)).toBe(20.5);
    expect(calculateUsDutyRatePercent(getOriginTier('unknown'), 8, 35)).toBe(20.5);
  });

  it('中国は合計実効税率、米国原産はMFNのみ', () => {
    expect(calculateUsDutyRatePercent(getOriginTier('china'), 8, 35)).toBe(35);
    expect(calculateUsDutyRatePercent(getOriginTier('us_or_other_exempt'), 8, 35)).toBe(8);
  });

  it('計算機: 同じバッグでも原産国で関税額が変わる（イタリア10% < インドネシア18% < ベトナム20.5% < 中国35%）', () => {
    const duty = (originCountry: EbayCalculatorInput['originCountry']) =>
      calculateEbayProfit({ ...baseInput, originCountry }).dutyJpy;
    const italy = duty('italy');
    const indonesia = duty('indonesia');
    const vietnam = duty('vietnam');
    const china = duty('china');

    expect(italy).toBe(Math.round(100 * 155 * 0.1));
    expect(indonesia).toBe(Math.round(100 * 155 * 0.18));
    expect(vietnam).toBe(Math.round(100 * 155 * 0.205));
    expect(china).toBe(Math.round(100 * 155 * 0.35));
    expect(italy).toBeLessThan(indonesia);
    expect(indonesia).toBeLessThan(vietnam);
    expect(vietnam).toBeLessThan(china);
  });

  it('原産国の選択肢に重複がなく、ブランドプリセットの原産国はすべて有効な国', () => {
    const values = extraOriginCountries.map((country) => country.value);
    expect(new Set(values).size).toBe(values.length);

    const valid = new Set<string>(['japan', 'china', 'us_or_other_exempt', ...values]);
    brandOriginPresets.forEach((preset) => {
      preset.patterns.forEach((pattern) => {
        expect(valid.has(pattern.origin)).toBe(true);
      });
    });
  });
});
