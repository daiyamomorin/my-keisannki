import { useMemo, useState } from 'react';
import {
  calculateEbayProfit,
  type CustomsHandlingMode,
  type EbayCalculatorInput,
  type OriginCountry
} from '../../core/ebay-calculator';
import { calculateRequiredSalePriceUsd } from '../../core/ebay-reverse-calculator';
import {
  DEFAULT_GENERAL_DUTY_RATE_PERCENT,
  MANUAL_OPTION,
  customsHandlingHint,
  dutyNote,
  generalDutyRateHintJapan,
  generalDutyRateHintUs,
  originCountryOptions,
  fvfPresets,
  intlShippingPresets
} from '../../core/ebay-presets';
import '../procurement-calculator/styles.css';
import '../ebay-calculator/styles.css';

const jpyFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY'
});

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

const percentFormatter = (value: number, digits = 2) => `${value.toFixed(digits)}%`;

const desiredProfitBounds = {
  min: 3000,
  max: 50000,
  step: 1000
} as const;

const profitRateOptions = [0.15, 0.2, 0.25, 0.3] as const;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const parseAmount = (value: string): number => {
  if (value.trim() === '') {
    return 0;
  }

  const parsed = Number(value.replace(/,/g, ''));
  return Number.isNaN(parsed) ? 0 : parsed;
};

const EbayReverseCalculator = () => {
  const [purchasePriceInput, setPurchasePriceInput] = useState('');
  const [domesticShippingInput, setDomesticShippingInput] = useState('');

  const [profitMode, setProfitMode] = useState<'amount' | 'rate'>('amount');
  const [desiredProfitAmount, setDesiredProfitAmount] = useState<number>(desiredProfitBounds.min + 2000);
  const [desiredProfitRate, setDesiredProfitRate] = useState<number>(0.25);

  const [shippingChargedInput, setShippingChargedInput] = useState('');
  const [intlShippingPreset, setIntlShippingPreset] = useState<string>(MANUAL_OPTION);
  const [intlShippingInput, setIntlShippingInput] = useState('0');

  const [fvfPreset, setFvfPreset] = useState<string>(fvfPresets[0].label);
  const [fvfRateInput, setFvfRateInput] = useState(String(fvfPresets[0].value));

  const [internationalFeePercent, setInternationalFeePercent] = useState(1.65);
  const [fxFeePercent, setFxFeePercent] = useState(2.0);
  const [usdJpyRate, setUsdJpyRate] = useState(155);
  const [promotedPercent, setPromotedPercent] = useState(0);
  const [dutyPaidBySeller, setDutyPaidBySeller] = useState(true);
  const [originCountry, setOriginCountry] = useState<OriginCountry>('japan');
  const [dutyRateInput, setDutyRateInput] = useState(String(DEFAULT_GENERAL_DUTY_RATE_PERCENT));
  const [customsHandlingMode, setCustomsHandlingMode] = useState<CustomsHandlingMode>('auto');
  const [customsHandlingInput, setCustomsHandlingInput] = useState('0');

  const handleIntlShippingPresetChange = (label: string) => {
    setIntlShippingPreset(label);
    const preset = intlShippingPresets.find((item) => item.label === label);
    if (preset) {
      setIntlShippingInput(String(preset.value));
    }
  };

  const handleFvfPresetChange = (label: string) => {
    setFvfPreset(label);
    const preset = fvfPresets.find((item) => item.label === label);
    if (preset) {
      setFvfRateInput(String(preset.value));
    }
  };

  const purchasePriceJpy = parseAmount(purchasePriceInput);
  const isPurchasePriceValid = purchasePriceInput.trim() !== '';

  const baseInput: Omit<EbayCalculatorInput, 'salePriceUsd'> = useMemo(
    () => ({
      purchasePriceJpy,
      domesticShippingJpy: parseAmount(domesticShippingInput),
      shippingChargedUsd: parseAmount(shippingChargedInput),
      intlShippingJpy: parseAmount(intlShippingInput),
      fvfRatePercent: parseAmount(fvfRateInput),
      internationalFeePercent,
      fxFeePercent,
      usdJpyRate,
      promotedPercent,
      dutyPaidBySeller,
      originCountry,
      generalDutyRatePercent: parseAmount(dutyRateInput),
      customsHandlingMode,
      customsHandlingJpy: parseAmount(customsHandlingInput)
    }),
    [
      purchasePriceJpy,
      domesticShippingInput,
      shippingChargedInput,
      intlShippingInput,
      fvfRateInput,
      internationalFeePercent,
      fxFeePercent,
      usdJpyRate,
      promotedPercent,
      dutyPaidBySeller,
      originCountry,
      dutyRateInput,
      customsHandlingMode,
      customsHandlingInput
    ]
  );

  const reverseResult = useMemo(() => {
    if (!isPurchasePriceValid) {
      return null;
    }

    const target =
      profitMode === 'amount'
        ? ({ mode: 'amount', profitJpy: desiredProfitAmount } as const)
        : ({ mode: 'rate', marginPercent: desiredProfitRate * 100 } as const);

    return calculateRequiredSalePriceUsd(baseInput, target);
  }, [isPurchasePriceValid, baseInput, profitMode, desiredProfitAmount, desiredProfitRate]);

  const breakdown = useMemo(() => {
    if (!reverseResult) {
      return null;
    }

    return calculateEbayProfit({ ...baseInput, salePriceUsd: reverseResult.salePriceUsd });
  }, [baseInput, reverseResult]);

  const feeRatioPercent =
    breakdown && breakdown.totalSaleUsd > 0
      ? ((breakdown.fvfUsd + breakdown.intlFeeUsd + breakdown.promotedUsd) / breakdown.totalSaleUsd) * 100
      : 0;

  return (
    <section className="calculator ebay-calc">
      <div className="calculator__result">
        <h2>eBay逆算計算機</h2>
        <p className="calculator__result-value ebay-calc__profit ebay-calc__profit--positive">
          {reverseResult ? usdFormatter.format(reverseResult.salePriceUsd) : '---'}
        </p>
        {reverseResult ? (
          <>
            <p className="ebay-calc__margin">≒ {jpyFormatter.format(reverseResult.salePriceJpy)}</p>
            <p className="ebay-calc__margin">
              そのときの利益 {jpyFormatter.format(reverseResult.profitJpy)}（利益率{' '}
              {percentFormatter(reverseResult.profitMarginPercent)}）
            </p>
          </>
        ) : (
          <p className="ebay-calc__margin">仕入れ値を入力してください。</p>
        )}
      </div>

      <div className="calculator__grid">
        <div className="calculator__field">
          <div className="calculator__field-header">
            <label htmlFor="purchasePriceJpy" className="calculator__label">
              仕入れ値（円）
            </label>
            <span className="calculator__value">{jpyFormatter.format(purchasePriceJpy)}</span>
          </div>
          <div className="calculator__input-wrapper">
            <span className="calculator__prefix">¥</span>
            <input
              id="purchasePriceJpy"
              name="purchasePriceJpy"
              type="text"
              className="calculator__input"
              inputMode="numeric"
              value={purchasePriceInput}
              onChange={(event) => setPurchasePriceInput(event.target.value)}
              placeholder="例: 10000"
            />
          </div>
        </div>

        <div className="calculator__field">
          <div className="calculator__field-header">
            <span className="calculator__label">
              {profitMode === 'amount' ? '希望利益額' : '希望利益率'}
            </span>
            <span className="calculator__value">
              {profitMode === 'amount'
                ? jpyFormatter.format(desiredProfitAmount)
                : `${(desiredProfitRate * 100).toFixed(0)}%`}
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
                id="desiredProfitAmount"
                name="desiredProfitAmount"
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
                <span>{jpyFormatter.format(desiredProfitBounds.min)}</span>
                <span>{jpyFormatter.format(desiredProfitBounds.max)}</span>
              </div>
              <p className="calculator__hint">スライダーで希望利益額を 1,000 円単位で調整できます。</p>
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
            <label htmlFor="fvfPreset" className="calculator__label">
              カテゴリ（FVF率）
            </label>
            <span className="calculator__value">{parseAmount(fvfRateInput)}%</span>
          </div>
          <select
            id="fvfPreset"
            name="fvfPreset"
            className="ebay-calc__select"
            value={fvfPreset}
            onChange={(event) => handleFvfPresetChange(event.target.value)}
          >
            {fvfPresets.map((preset) => (
              <option key={preset.label} value={preset.label}>
                {preset.label}（{preset.value}%）
              </option>
            ))}
            <option value={MANUAL_OPTION}>{MANUAL_OPTION}</option>
          </select>
          <div className="calculator__input-wrapper">
            <input
              id="fvfRatePercent"
              name="fvfRatePercent"
              type="text"
              className="calculator__input"
              inputMode="decimal"
              value={fvfRateInput}
              onChange={(event) => {
                setFvfPreset(MANUAL_OPTION);
                setFvfRateInput(event.target.value);
              }}
            />
            <span className="calculator__prefix">%</span>
          </div>
          <p className="calculator__hint">
            per-order fee は別途 $0.30（取引合計$10以下）/ $0.40（$10超）が加算されます。
          </p>
        </div>

        <div className="calculator__field">
          <div className="calculator__field-header">
            <label htmlFor="domesticShippingJpy" className="calculator__label">
              国内送料（円）
            </label>
            <span className="calculator__value">
              {jpyFormatter.format(parseAmount(domesticShippingInput))}
            </span>
          </div>
          <div className="calculator__input-wrapper">
            <span className="calculator__prefix">¥</span>
            <input
              id="domesticShippingJpy"
              name="domesticShippingJpy"
              type="text"
              className="calculator__input"
              inputMode="numeric"
              value={domesticShippingInput}
              onChange={(event) => setDomesticShippingInput(event.target.value)}
              placeholder="例: 0"
            />
          </div>
        </div>
      </div>

      <details className="ebay-calc__details">
        <summary>詳細設定（送料・手数料・レート）</summary>
        <div className="calculator__grid ebay-calc__details-grid">
          <div className="calculator__field">
            <div className="calculator__field-header">
              <label htmlFor="shippingChargedUsd" className="calculator__label">
                買い手に請求する送料（ドル）
              </label>
              <span className="calculator__value">
                {usdFormatter.format(parseAmount(shippingChargedInput))}
              </span>
            </div>
            <div className="calculator__input-wrapper">
              <span className="calculator__prefix">$</span>
              <input
                id="shippingChargedUsd"
                name="shippingChargedUsd"
                type="text"
                className="calculator__input"
                inputMode="decimal"
                value={shippingChargedInput}
                onChange={(event) => setShippingChargedInput(event.target.value)}
                placeholder="送料込み出品なら0"
              />
            </div>
          </div>

          <div className="calculator__field">
            <div className="calculator__field-header">
              <label htmlFor="intlShippingPreset" className="calculator__label">
                実際の国際送料（円）
              </label>
              <span className="calculator__value">
                {jpyFormatter.format(parseAmount(intlShippingInput))}
              </span>
            </div>
            <select
              id="intlShippingPreset"
              name="intlShippingPreset"
              className="ebay-calc__select"
              value={intlShippingPreset}
              onChange={(event) => handleIntlShippingPresetChange(event.target.value)}
            >
              {intlShippingPresets.map((preset) => (
                <option key={preset.label} value={preset.label}>
                  {preset.label}（{jpyFormatter.format(preset.value)}）
                </option>
              ))}
              <option value={MANUAL_OPTION}>{MANUAL_OPTION}</option>
            </select>
            <div className="calculator__input-wrapper">
              <span className="calculator__prefix">¥</span>
              <input
                id="intlShippingJpy"
                name="intlShippingJpy"
                type="text"
                className="calculator__input"
                inputMode="numeric"
                value={intlShippingInput}
                onChange={(event) => {
                  setIntlShippingPreset(MANUAL_OPTION);
                  setIntlShippingInput(event.target.value);
                }}
              />
            </div>
            <p className="calculator__hint">送料は概算値です。実際の配送業者の料金でご確認ください。</p>
          </div>

          <div className="calculator__field">
            <div className="calculator__field-header">
              <label htmlFor="internationalFeePercent" className="calculator__label">
                国際手数料（%）
              </label>
              <span className="calculator__value">{internationalFeePercent}%</span>
            </div>
            <div className="calculator__input-wrapper">
              <input
                id="internationalFeePercent"
                name="internationalFeePercent"
                type="number"
                className="calculator__input"
                step={0.01}
                inputMode="decimal"
                value={internationalFeePercent}
                onChange={(event) => setInternationalFeePercent(Number(event.target.value))}
              />
              <span className="calculator__prefix">%</span>
            </div>
          </div>

          <div className="calculator__field">
            <div className="calculator__field-header">
              <label htmlFor="fxFeePercent" className="calculator__label">
                為替手数料（%）
              </label>
              <span className="calculator__value">{fxFeePercent}%</span>
            </div>
            <div className="calculator__input-wrapper">
              <input
                id="fxFeePercent"
                name="fxFeePercent"
                type="number"
                className="calculator__input"
                step={0.01}
                inputMode="decimal"
                value={fxFeePercent}
                onChange={(event) => setFxFeePercent(Number(event.target.value))}
              />
              <span className="calculator__prefix">%</span>
            </div>
          </div>

          <div className="calculator__field">
            <div className="calculator__field-header">
              <label htmlFor="usdJpyRate" className="calculator__label">
                為替レート（円/ドル）
              </label>
              <span className="calculator__value">{usdJpyRate}</span>
            </div>
            <div className="calculator__input-wrapper">
              <span className="calculator__prefix">¥</span>
              <input
                id="usdJpyRate"
                name="usdJpyRate"
                type="number"
                className="calculator__input"
                step={0.01}
                inputMode="decimal"
                value={usdJpyRate}
                onChange={(event) => setUsdJpyRate(Number(event.target.value))}
              />
            </div>
          </div>

          <div className="calculator__field">
            <div className="calculator__field-header">
              <label htmlFor="promotedPercent" className="calculator__label">
                広告費 Promoted Listings（%）
              </label>
              <span className="calculator__value">{promotedPercent}%</span>
            </div>
            <div className="calculator__input-wrapper">
              <input
                id="promotedPercent"
                name="promotedPercent"
                type="number"
                className="calculator__input"
                step={0.1}
                inputMode="decimal"
                value={promotedPercent}
                onChange={(event) => setPromotedPercent(Number(event.target.value))}
              />
              <span className="calculator__prefix">%</span>
            </div>
          </div>

          <div className="calculator__field ebay-calc__duty-field">
            <div className="calculator__field-header">
              <label htmlFor="dutyPaidBySeller" className="calculator__label">
                関税を自分で負担する（DDP）
              </label>
              <label className="ebay-calc__toggle">
                <input
                  id="dutyPaidBySeller"
                  name="dutyPaidBySeller"
                  type="checkbox"
                  checked={dutyPaidBySeller}
                  onChange={(event) => setDutyPaidBySeller(event.target.checked)}
                />
                <span className="ebay-calc__toggle-track" aria-hidden="true" />
              </label>
            </div>
            {dutyPaidBySeller && (
              <div className="calculator__field">
                <div className="calculator__field-header">
                  <span className="calculator__label">原産国</span>
                </div>
                <div className="calculator__button-group" role="group" aria-label="原産国切替">
                  {originCountryOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`calculator__chip${
                        originCountry === option.value ? ' calculator__chip--active' : ''
                      }`}
                      onClick={() => setOriginCountry(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {dutyPaidBySeller && originCountry === 'us_or_other_exempt' && (
              <div className="calculator__field">
                <div className="calculator__field-header">
                  <label htmlFor="dutyRatePercent" className="calculator__label">
                    General Rate（%）
                  </label>
                  <span className="calculator__value">{parseAmount(dutyRateInput)}%</span>
                </div>
                <div className="calculator__input-wrapper">
                  <input
                    id="dutyRatePercent"
                    name="dutyRatePercent"
                    type="text"
                    className="calculator__input"
                    inputMode="decimal"
                    value={dutyRateInput}
                    onChange={(event) => setDutyRateInput(event.target.value)}
                  />
                  <span className="calculator__prefix">%</span>
                </div>
                <p className="calculator__hint">{generalDutyRateHintUs}</p>
              </div>
            )}
            {dutyPaidBySeller && originCountry === 'japan' && (
              <p className="calculator__hint">{generalDutyRateHintJapan}</p>
            )}
            {dutyPaidBySeller && (
              <div className="calculator__field">
                <div className="calculator__field-header">
                  <label className="calculator__label">通関と処理手数料（円）</label>
                  <span className="calculator__value">
                    {jpyFormatter.format(breakdown?.customsHandlingFeeJpy ?? 0)}
                  </span>
                </div>
                <div className="calculator__button-group" role="group" aria-label="通関と処理手数料モード切替">
                  <button
                    type="button"
                    className={`calculator__chip${
                      customsHandlingMode === 'auto' ? ' calculator__chip--active' : ''
                    }`}
                    onClick={() => setCustomsHandlingMode('auto')}
                  >
                    自動計算
                  </button>
                  <button
                    type="button"
                    className={`calculator__chip${
                      customsHandlingMode === 'manual' ? ' calculator__chip--active' : ''
                    }`}
                    onClick={() => setCustomsHandlingMode('manual')}
                  >
                    手動入力
                  </button>
                </div>
                {customsHandlingMode === 'manual' ? (
                  <div className="calculator__input-wrapper">
                    <span className="calculator__prefix">¥</span>
                    <input
                      id="customsHandlingJpy"
                      name="customsHandlingJpy"
                      type="text"
                      className="calculator__input"
                      inputMode="numeric"
                      value={customsHandlingInput}
                      onChange={(event) => setCustomsHandlingInput(event.target.value)}
                    />
                  </div>
                ) : (
                  <span className="calculator__value">
                    {jpyFormatter.format(breakdown?.customsHandlingFeeJpy ?? 0)}
                  </span>
                )}
                <p className="calculator__hint">{customsHandlingHint}</p>
              </div>
            )}
            <p className="calculator__hint ebay-calc__duty-note">
              {dutyNote.split('\n').map((line, index) => (
                <span key={line}>
                  {index > 0 && <br />}
                  {line}
                </span>
              ))}
            </p>
          </div>
        </div>
      </details>

      <details className="ebay-calc__details">
        <summary>内訳を見る</summary>
        <div className="ebay-calc__breakdown">
          {breakdown ? (
            <dl className="ebay-calc__breakdown-list">
              <div className="ebay-calc__breakdown-row">
                <dt>出品価格</dt>
                <dd>{usdFormatter.format(reverseResult?.salePriceUsd ?? 0)}</dd>
              </div>
              <div className="ebay-calc__breakdown-row">
                <dt>売上合計</dt>
                <dd>{usdFormatter.format(breakdown.totalSaleUsd)}</dd>
              </div>
              <div className="ebay-calc__breakdown-row">
                <dt>落札手数料（FVF {parseAmount(fvfRateInput)}%）</dt>
                <dd>-{usdFormatter.format(breakdown.fvfUsd - breakdown.perOrderFeeUsd)}</dd>
              </div>
              <div className="ebay-calc__breakdown-row">
                <dt>per-order fee</dt>
                <dd>-{usdFormatter.format(breakdown.perOrderFeeUsd)}</dd>
              </div>
              <div className="ebay-calc__breakdown-row">
                <dt>国際手数料</dt>
                <dd>-{usdFormatter.format(breakdown.intlFeeUsd)}</dd>
              </div>
              <div className="ebay-calc__breakdown-row">
                <dt>広告費（Promoted Listings）</dt>
                <dd>-{usdFormatter.format(breakdown.promotedUsd)}</dd>
              </div>
              <div className="ebay-calc__breakdown-row ebay-calc__breakdown-row--subtotal">
                <dt>→ 入金額</dt>
                <dd>{usdFormatter.format(breakdown.netUsd)}</dd>
              </div>
              <div className="ebay-calc__breakdown-row ebay-calc__breakdown-row--subtotal">
                <dt>→ 円換算入金額（為替手数料差引後）</dt>
                <dd>{jpyFormatter.format(breakdown.netJpy)}</dd>
              </div>
              <div className="ebay-calc__breakdown-row">
                <dt>仕入れ値</dt>
                <dd>{jpyFormatter.format(purchasePriceJpy)}</dd>
              </div>
              <div className="ebay-calc__breakdown-row">
                <dt>国内送料</dt>
                <dd>{jpyFormatter.format(parseAmount(domesticShippingInput))}</dd>
              </div>
              <div className="ebay-calc__breakdown-row">
                <dt>国際送料</dt>
                <dd>{jpyFormatter.format(parseAmount(intlShippingInput))}</dd>
              </div>
              <div className="ebay-calc__breakdown-row">
                <dt>関税</dt>
                <dd>{jpyFormatter.format(breakdown.dutyJpy)}</dd>
              </div>
              <div className="ebay-calc__breakdown-row">
                <dt>通関と処理</dt>
                <dd>{jpyFormatter.format(breakdown.customsHandlingFeeJpy)}</dd>
              </div>
              <div className="ebay-calc__breakdown-row ebay-calc__breakdown-row--subtotal">
                <dt>合計コスト</dt>
                <dd>{jpyFormatter.format(breakdown.costJpy)}</dd>
              </div>
              <div className="ebay-calc__breakdown-row ebay-calc__breakdown-row--total">
                <dt>利益</dt>
                <dd>{jpyFormatter.format(breakdown.profitJpy)}</dd>
              </div>
              <div className="ebay-calc__breakdown-row ebay-calc__breakdown-row--total">
                <dt>利益率</dt>
                <dd>{percentFormatter(breakdown.profitMarginPercent)}</dd>
              </div>
              <div className="ebay-calc__breakdown-row">
                <dt>手数料合計率（売上比）</dt>
                <dd>{percentFormatter(feeRatioPercent)}</dd>
              </div>
            </dl>
          ) : (
            <p className="calculator__hint">仕入れ値を入力すると内訳が表示されます。</p>
          )}
        </div>
      </details>
    </section>
  );
};

export default EbayReverseCalculator;
