import { useMemo, useState } from 'react';
import { calculateProcurementPrice } from '../../core/procurement-calculator';
import './styles.css';

const desiredProfitBounds = {
  min: 3000,
  max: 20000,
  step: 1000
} as const;

const profitRateOptions = [0.15, 0.20, 0.25, 0.30] as const;

const saleShippingOptions = [0, 160, 210, 215, 450, 750, 850, 1050, 1200, 1400] as const;

const currencyFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY'
});

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const ProcurementCalculator = () => {
  const [salePriceInput, setSalePriceInput] = useState<string>('');
  const [profitMode, setProfitMode] = useState<'amount' | 'rate'>('amount');
  const [desiredProfitAmount, setDesiredProfitAmount] = useState<number>(desiredProfitBounds.min);
  const [desiredProfitRate, setDesiredProfitRate] = useState<number>(0.25);
  const [saleShippingIndex, setSaleShippingIndex] = useState<number>(0);
  const [purchaseShippingInput, setPurchaseShippingInput] = useState<string>('');

  const salePrice = useMemo(() => {
    if (salePriceInput.trim() === '') {
      return NaN;
    }

    const parsed = Number(salePriceInput.replace(/,/g, ''));
    return Number.isNaN(parsed) ? NaN : parsed;
  }, [salePriceInput]);

  const desiredProfit = useMemo(() => {
    if (profitMode === 'rate') {
      return Number.isFinite(salePrice) && salePrice > 0
        ? Math.round(salePrice * desiredProfitRate)
        : 0;
    }
    return desiredProfitAmount;
  }, [profitMode, salePrice, desiredProfitRate, desiredProfitAmount]);

  const saleShippingCost = saleShippingOptions[saleShippingIndex] ?? saleShippingOptions[0];
  const purchaseShippingCost = useMemo(() => {
    if (purchaseShippingInput.trim() === '') {
      return 0;
    }

    const parsed = Number(purchaseShippingInput.replace(/,/g, ''));
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [purchaseShippingInput]);

  const procurementPrice = useMemo(() => {
    if (!Number.isFinite(salePrice) || salePrice <= 0) {
      return null;
    }

    return calculateProcurementPrice({
      salePrice,
      desiredProfit,
      saleShippingCost,
      purchaseShippingCost
    });
  }, [salePrice, desiredProfit, saleShippingCost, purchaseShippingCost]);

  return (
    <section className="calculator">
      <div className="calculator__result">
        <h2>通常仕入れ計算機</h2>
        <p className="calculator__result-value">
          {procurementPrice === null ? '---' : currencyFormatter.format(procurementPrice)}
        </p>
        {procurementPrice !== null && procurementPrice < 0 && (
          <p className="calculator__result-warning">
            希望利益や経費の条件を見直さないと仕入れがマイナスになります。
          </p>
        )}
      </div>

      <div className="calculator__grid">
        <div className="calculator__field">
          <div className="calculator__field-header">
            <label htmlFor="salePrice" className="calculator__label">
              販売予想金額
            </label>
            <span className="calculator__value">
              {salePrice > 0 ? currencyFormatter.format(salePrice) : '---'}
            </span>
          </div>
          <div className="calculator__input-wrapper">
            <span className="calculator__prefix">¥</span>
            <input
              id="salePrice"
              name="salePrice"
              type="number"
              className="calculator__input"
              min={0}
              step={100}
              inputMode="numeric"
              value={salePriceInput}
              onChange={(event) => setSalePriceInput(event.target.value)}
              placeholder="例: 25000"
            />
          </div>
          <p className="calculator__hint">1台あたりの販売予想金額を入力してください。</p>
        </div>

        <div className="calculator__field">
          <div className="calculator__field-header">
            <span className="calculator__label">
              {profitMode === 'amount' ? '希望利益額' : '希望利益率'}
            </span>
            <span className="calculator__value">
              {profitMode === 'amount'
                ? currencyFormatter.format(desiredProfitAmount)
                : `${(desiredProfitRate * 100).toFixed(0)}%${Number.isFinite(salePrice) && salePrice > 0 ? `（${currencyFormatter.format(desiredProfit)}）` : ''}`}
            </span>
          </div>
          <div className="calculator__button-group" role="group" aria-label="利益モード切替">
            <button
              type="button"
              className={`calculator__chip${profitMode === 'amount' ? ' calculator__chip--active' : ''}`}
              onClick={() => setProfitMode('amount')}
            >
              利益額
            </button>
            <button
              type="button"
              className={`calculator__chip${profitMode === 'rate' ? ' calculator__chip--active' : ''}`}
              onClick={() => setProfitMode('rate')}
            >
              利益率
            </button>
          </div>
          {profitMode === 'amount' ? (
            <>
              <input
                id="desiredProfit"
                name="desiredProfit"
                type="range"
                className="calculator__slider"
                min={desiredProfitBounds.min}
                max={desiredProfitBounds.max}
                step={desiredProfitBounds.step}
                value={desiredProfitAmount}
                onChange={(event) =>
                  setDesiredProfitAmount(
                    clamp(Number(event.target.value), desiredProfitBounds.min, desiredProfitBounds.max)
                  )
                }
              />
              <div className="calculator__scale">
                <span>{currencyFormatter.format(desiredProfitBounds.min)}</span>
                <span>{currencyFormatter.format(desiredProfitBounds.max)}</span>
              </div>
              <p className="calculator__hint">スライダーで希望利益を 1,000 円単位で調整できます。</p>
            </>
          ) : (
            <>
              <div className="calculator__button-group" role="group" aria-label="希望利益率">
                {profitRateOptions.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    className={`calculator__chip${desiredProfitRate === rate ? ' calculator__chip--active' : ''}`}
                    onClick={() => setDesiredProfitRate(rate)}
                  >
                    {(rate * 100).toFixed(0)}%
                  </button>
                ))}
              </div>
              <p className="calculator__hint">ボタンで目標利益率を選択してください。</p>
            </>
          )}
        </div>

        <div className="calculator__field">
          <div className="calculator__field-header">
            <span className="calculator__label">販売送料</span>
            <span className="calculator__value">{currencyFormatter.format(saleShippingCost)}</span>
          </div>
          <div className="calculator__button-group" role="group" aria-label="販売送料">
            {saleShippingOptions.map((option, index) => (
              <button
                key={option}
                type="button"
                className={`calculator__chip${
                  saleShippingIndex === index ? ' calculator__chip--active' : ''
                }`}
                onClick={() => setSaleShippingIndex(index)}
              >
                {currencyFormatter.format(option)}
              </button>
            ))}
          </div>
          <p className="calculator__hint">ボタンを押して想定される販売送料を選択してください。</p>
        </div>

        <div className="calculator__field">
          <div className="calculator__field-header">
            <label htmlFor="purchaseShipping" className="calculator__label">
              仕入送料
            </label>
            <span className="calculator__value">{currencyFormatter.format(purchaseShippingCost)}</span>
          </div>
          <div className="calculator__input-wrapper">
            <span className="calculator__prefix">¥</span>
            <input
              id="purchaseShipping"
              name="purchaseShipping"
              type="number"
              className="calculator__input"
              min={0}
              step={10}
              inputMode="numeric"
              value={purchaseShippingInput}
              onChange={(event) => setPurchaseShippingInput(event.target.value)}
              placeholder="例: 750"
            />
          </div>
          <p className="calculator__hint">仕入れにかかる送料を任意の金額で入力してください。</p>
        </div>
      </div>
    </section>
  );
};

export default ProcurementCalculator;
