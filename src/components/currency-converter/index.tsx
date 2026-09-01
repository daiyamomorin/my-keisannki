import { useEffect, useState } from 'react';
import { jpyToUsd, usdToJpy } from '../../core/currency-converter';
import '../procurement-calculator/styles.css';

const rateQuickOptions = [150, 155, 160] as const;

const parseAmount = (value: string): number => {
  if (value.trim() === '') {
    return 0;
  }

  const parsed = Number(value.replace(/,/g, ''));
  return Number.isNaN(parsed) ? 0 : parsed;
};

type ActiveField = 'jpy' | 'usd';

const CurrencyConverter = () => {
  const [rateInput, setRateInput] = useState('155');
  const [jpyInput, setJpyInput] = useState('');
  const [usdInput, setUsdInput] = useState('');
  const [activeField, setActiveField] = useState<ActiveField>('jpy');

  const rate = parseAmount(rateInput);

  useEffect(() => {
    if (activeField === 'jpy') {
      const jpy = parseAmount(jpyInput);
      setUsdInput(jpyInput.trim() === '' ? '' : String(jpyToUsd(jpy, rate)));
    } else {
      const usd = parseAmount(usdInput);
      setJpyInput(usdInput.trim() === '' ? '' : String(usdToJpy(usd, rate)));
    }
    // レート変更時のみ再計算する（jpyInput/usdInput/activeFieldの変更ではトリガーしない）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate]);

  const handleJpyChange = (value: string) => {
    setActiveField('jpy');
    setJpyInput(value);
    const jpy = parseAmount(value);
    setUsdInput(value.trim() === '' ? '' : String(jpyToUsd(jpy, rate)));
  };

  const handleUsdChange = (value: string) => {
    setActiveField('usd');
    setUsdInput(value);
    const usd = parseAmount(value);
    setJpyInput(value.trim() === '' ? '' : String(usdToJpy(usd, rate)));
  };

  return (
    <section className="calculator">
      <div className="calculator__result">
        <h2>為替計算機</h2>
        <p className="calculator__result-value">1ドル = {rate || 0}円</p>
      </div>

      <div className="calculator__grid">
        <div className="calculator__field">
          <div className="calculator__field-header">
            <label htmlFor="rateInput" className="calculator__label">
              為替レート（円/ドル）
            </label>
          </div>
          <div className="calculator__input-wrapper">
            <span className="calculator__prefix">¥</span>
            <input
              id="rateInput"
              name="rateInput"
              type="text"
              className="calculator__input"
              inputMode="decimal"
              value={rateInput}
              onChange={(event) => setRateInput(event.target.value)}
              placeholder="例: 155"
            />
          </div>
          <div className="calculator__button-group" role="group" aria-label="レートのクイック選択">
            {rateQuickOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`calculator__chip${rate === option ? ' calculator__chip--active' : ''}`}
                onClick={() => setRateInput(String(option))}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="calculator__field">
          <div className="calculator__field-header">
            <label htmlFor="jpyInput" className="calculator__label">
              円
            </label>
          </div>
          <div className="calculator__input-wrapper">
            <span className="calculator__prefix">¥</span>
            <input
              id="jpyInput"
              name="jpyInput"
              type="text"
              className="calculator__input"
              inputMode="decimal"
              value={jpyInput}
              onChange={(event) => handleJpyChange(event.target.value)}
              placeholder="例: 15500"
            />
          </div>
        </div>

        <div className="calculator__field">
          <div className="calculator__field-header">
            <label htmlFor="usdInput" className="calculator__label">
              ドル
            </label>
          </div>
          <div className="calculator__input-wrapper">
            <span className="calculator__prefix">$</span>
            <input
              id="usdInput"
              name="usdInput"
              type="text"
              className="calculator__input"
              inputMode="decimal"
              value={usdInput}
              onChange={(event) => handleUsdChange(event.target.value)}
              placeholder="例: 100"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CurrencyConverter;
