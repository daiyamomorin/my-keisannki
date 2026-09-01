import { describe, expect, it } from 'vitest';
import { jpyToUsd, usdToJpy } from '../../src/core/currency-converter';

describe('jpyToUsd', () => {
  it('円をドルに換算し小数2桁に丸める', () => {
    expect(jpyToUsd(15500, 155)).toBe(100);
    expect(jpyToUsd(10000, 155)).toBe(64.52);
  });

  it('レートが0以下の場合は0を返す', () => {
    expect(jpyToUsd(1000, 0)).toBe(0);
    expect(jpyToUsd(1000, -10)).toBe(0);
  });
});

describe('usdToJpy', () => {
  it('ドルを円に換算し整数に丸める', () => {
    expect(usdToJpy(100, 155)).toBe(15500);
    expect(usdToJpy(64.52, 155)).toBe(10001);
  });

  it('0ドルは0円になる', () => {
    expect(usdToJpy(0, 155)).toBe(0);
  });
});
