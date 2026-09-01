import { useMemo, useState } from 'react';
import {
  calculateBreakEvenSalePriceUsd,
  calculateEbayProfit,
  type CustomsHandlingMode,
  type EbayCalculatorInput,
  type OriginCountry
} from '../../core/ebay-calculator';
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
import './styles.css';

const jpyFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY'
});

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

const percentFormatter = (value: number, digits = 2) => `${value.toFixed(digits)}%`;

const parseAmount = (value: string): number => {
  if (value.trim() === '') {
    return 0;
  }

  const parsed = Number(value.replace(/,/g, ''));
  return Number.isNaN(parsed) ? 0 : parsed;
};

const EbayCalculator = () => {
  const [purchasePriceInput, setPurchasePriceInput] = useState('');
  const [domesticShippingInput, setDomesticShippingInput] = useState('');
  const [salePriceInput, setSalePriceInput] = useState('');
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
  const [targetProfitMarginPercent, setTargetProfitMarginPercent] = useState(20);

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

  const input: EbayCalculatorInput = useMemo(
    () => ({
      purchasePriceJpy: parseAmount(purchasePriceInput),
      domesticShippingJpy: parseAmount(domesticShippingInput),
      salePriceUsd: parseAmount(salePriceInput),
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
      purchasePriceInput,
      domesticShippingInput,
      salePriceInput,
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

  const result = useMemo(() => calculateEbayProfit(input), [input]);

  const breakEvenSalePriceUsd = useMemo(() => {
    const { salePriceUsd: _omit, ...rest } = input;
    return calculateBreakEvenSalePriceUsd(rest, targetProfitMarginPercent);
  }, [input, targetProfitMarginPercent]);

  const feeRatioPercent =
    result.totalSaleUsd > 0
      ? ((result.fvfUsd + result.intlFeeUsd + result.promotedUsd) / result.totalSaleUsd) * 100
      : 0;

  const isProfit = result.profitJpy >= 0;

  return (
    <section className="calculator ebay-calc">
      <div className="calculator__result">
        <h2>eBay無在庫 利益計算機</h2>
        <p
          className={`calculator__result-value ebay-calc__profit${
            isProfit ? ' ebay-calc__profit--positive' : ' ebay-calc__profit--negative'
          }`}
        >
          {jpyFormatter.format(result.profitJpy)}
        </p>
        <p
          className={`ebay-calc__margin${
            isProfit ? ' ebay-calc__profit--positive' : ' ebay-calc__profit--negative'
          }`}
        >
          利益率 {percentFormatter(result.profitMarginPercent)}
        </p>
      </div>

      <div className="calculator__grid">
        <div className="calculator__field">
          <div className="calculator__field-header">
            <label htmlFor="purchasePriceJpy" className="calculator__label">
              仕入れ値（円）
            </label>
            <span className="calculator__value">{jpyFormatter.format(input.purchasePriceJpy)}</span>
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
            <label htmlFor="salePriceUsd" className="calculator__label">
              販売予想額（ドル）
            </label>
            <span className="calculator__value">{usdFormatter.format(input.salePriceUsd)}</span>
          </div>
          <div className="calculator__input-wrapper">
            <span className="calculator__prefix">$</span>
            <input
              id="salePriceUsd"
              name="salePriceUsd"
              type="text"
              className="calculator__input"
              inputMode="decimal"
              value={salePriceInput}
              onChange={(event) => setSalePriceInput(event.target.value)}
              placeholder="例: 100"
            />
          </div>
        </div>

        <div className="calculator__field">
          <div className="calculator__field-header">
            <label htmlFor="fvfPreset" className="calculator__label">
              カテゴリ（FVF率）
            </label>
            <span className="calculator__value">{input.fvfRatePercent}%</span>
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
              {jpyFormatter.format(input.domesticShippingJpy)}
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
                {usdFormatter.format(input.shippingChargedUsd)}
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
              <span className="calculator__value">{jpyFormatter.format(input.intlShippingJpy)}</span>
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
                    {jpyFormatter.format(result.customsHandlingFeeJpy)}
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
                    {jpyFormatter.format(result.customsHandlingFeeJpy)}
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
          <dl className="ebay-calc__breakdown-list">
            <div className="ebay-calc__breakdown-row">
              <dt>売上合計</dt>
              <dd>{usdFormatter.format(result.totalSaleUsd)}</dd>
            </div>
            <div className="ebay-calc__breakdown-row">
              <dt>落札手数料（FVF {input.fvfRatePercent}%）</dt>
              <dd>-{usdFormatter.format(result.fvfUsd - result.perOrderFeeUsd)}</dd>
            </div>
            <div className="ebay-calc__breakdown-row">
              <dt>per-order fee</dt>
              <dd>-{usdFormatter.format(result.perOrderFeeUsd)}</dd>
            </div>
            <div className="ebay-calc__breakdown-row">
              <dt>国際手数料</dt>
              <dd>-{usdFormatter.format(result.intlFeeUsd)}</dd>
            </div>
            <div className="ebay-calc__breakdown-row">
              <dt>広告費（Promoted Listings）</dt>
              <dd>-{usdFormatter.format(result.promotedUsd)}</dd>
            </div>
            <div className="ebay-calc__breakdown-row ebay-calc__breakdown-row--subtotal">
              <dt>→ 入金額</dt>
              <dd>{usdFormatter.format(result.netUsd)}</dd>
            </div>
            <div className="ebay-calc__breakdown-row ebay-calc__breakdown-row--subtotal">
              <dt>→ 円換算入金額（為替手数料差引後）</dt>
              <dd>{jpyFormatter.format(result.netJpy)}</dd>
            </div>
            <div className="ebay-calc__breakdown-row">
              <dt>仕入れ値</dt>
              <dd>{jpyFormatter.format(input.purchasePriceJpy)}</dd>
            </div>
            <div className="ebay-calc__breakdown-row">
              <dt>国内送料</dt>
              <dd>{jpyFormatter.format(input.domesticShippingJpy)}</dd>
            </div>
            <div className="ebay-calc__breakdown-row">
              <dt>国際送料</dt>
              <dd>{jpyFormatter.format(input.intlShippingJpy)}</dd>
            </div>
            <div className="ebay-calc__breakdown-row">
              <dt>関税</dt>
              <dd>{jpyFormatter.format(result.dutyJpy)}</dd>
            </div>
            <div className="ebay-calc__breakdown-row">
              <dt>通関と処理</dt>
              <dd>{jpyFormatter.format(result.customsHandlingFeeJpy)}</dd>
            </div>
            <div className="ebay-calc__breakdown-row ebay-calc__breakdown-row--subtotal">
              <dt>合計コスト</dt>
              <dd>{jpyFormatter.format(result.costJpy)}</dd>
            </div>
            <div className="ebay-calc__breakdown-row ebay-calc__breakdown-row--total">
              <dt>利益</dt>
              <dd>{jpyFormatter.format(result.profitJpy)}</dd>
            </div>
            <div className="ebay-calc__breakdown-row ebay-calc__breakdown-row--total">
              <dt>利益率</dt>
              <dd>{percentFormatter(result.profitMarginPercent)}</dd>
            </div>
            <div className="ebay-calc__breakdown-row">
              <dt>ROI（仕入コスト対比）</dt>
              <dd>{percentFormatter(result.roiPercent)}</dd>
            </div>
            <div className="ebay-calc__breakdown-row">
              <dt>手数料合計率（売上比）</dt>
              <dd>{percentFormatter(feeRatioPercent)}</dd>
            </div>
          </dl>
        </div>
      </details>

      <div className="ebay-calc__breakeven">
        <div className="calculator__field">
          <div className="calculator__field-header">
            <label htmlFor="targetMargin" className="calculator__label">
              目標利益率（%）
            </label>
            <span className="calculator__value">{targetProfitMarginPercent}%</span>
          </div>
          <div className="calculator__input-wrapper">
            <input
              id="targetMargin"
              name="targetMargin"
              type="number"
              className="calculator__input"
              step={1}
              inputMode="numeric"
              value={targetProfitMarginPercent}
              onChange={(event) => setTargetProfitMarginPercent(Number(event.target.value))}
            />
            <span className="calculator__prefix">%</span>
          </div>
          <p className="calculator__hint">
            目標利益率 {targetProfitMarginPercent}% にするための販売価格：
            <strong>{usdFormatter.format(breakEvenSalePriceUsd)}</strong>
          </p>
        </div>
      </div>
    </section>
  );
};

export default EbayCalculator;
