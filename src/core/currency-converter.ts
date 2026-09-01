export const jpyToUsd = (jpy: number, rate: number): number => {
  if (rate <= 0) {
    return 0;
  }

  return Math.round((jpy / rate) * 100) / 100;
};

export const usdToJpy = (usd: number, rate: number): number => {
  return Math.round(usd * rate);
};
