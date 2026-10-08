import { useState } from 'react';
import { brandOriginPresets, confidenceLabels } from '../../core/brand-origins';
import {
  extraOriginCountries,
  getOriginTier,
  originTierHints,
  type OriginCountry
} from '../../core/origin-countries';

interface OriginSelectorProps {
  originCountry: OriginCountry;
  onOriginChange: (origin: OriginCountry) => void;
  idPrefix: string;
}

const EXTRA_VALUES: string[] = extraOriginCountries.map((country) => country.value);

// 日本・中国・米国のボタンの下に出す「ブランドから原産国を決める」と「その他の国を選ぶ」。
// ブランドを選ぶと、そのブランドの主要な原産国（ヴィンテージ・現行などのパターン別）が自動でセットされる。
export function OriginSelector({ originCountry, onOriginChange, idPrefix }: OriginSelectorProps) {
  const [brandId, setBrandId] = useState('');
  const [patternIndex, setPatternIndex] = useState(0);

  const brand = brandOriginPresets.find((preset) => preset.id === brandId);
  const pattern = brand?.patterns[patternIndex];

  const handleBrandChange = (id: string) => {
    setBrandId(id);
    setPatternIndex(0);
    const next = brandOriginPresets.find((preset) => preset.id === id);
    if (next) {
      onOriginChange(next.patterns[0].origin);
    }
  };

  const handlePatternChange = (index: number) => {
    setPatternIndex(index);
    if (brand) {
      onOriginChange(brand.patterns[index].origin);
    }
  };

  return (
    <>
      <div className="calculator__field">
        <div className="calculator__field-header">
          <label htmlFor={`${idPrefix}-brand`} className="calculator__label">
            ブランドから原産国を決める
          </label>
        </div>
        <select
          id={`${idPrefix}-brand`}
          name={`${idPrefix}-brand`}
          className="ebay-calc__select"
          value={brandId}
          onChange={(event) => handleBrandChange(event.target.value)}
        >
          <option value="">ブランドを選ばない（手動で選ぶ）</option>
          {brandOriginPresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
        {brand && brand.patterns.length > 1 && (
          <select
            id={`${idPrefix}-brand-pattern`}
            name={`${idPrefix}-brand-pattern`}
            aria-label="商品の種類・年代"
            className="ebay-calc__select"
            value={patternIndex}
            onChange={(event) => handlePatternChange(Number(event.target.value))}
          >
            {brand.patterns.map((item, index) => (
              <option key={item.label} value={index}>
                {item.label}
              </option>
            ))}
          </select>
        )}
        {pattern && (
          <p className="calculator__hint">
            {confidenceLabels[pattern.confidence]}。{pattern.basis}
            。タグに「Made in ○○」の記載があれば、そちらが優先。
          </p>
        )}
      </div>
      <div className="calculator__field">
        <div className="calculator__field-header">
          <label htmlFor={`${idPrefix}-other-country`} className="calculator__label">
            その他の国から選ぶ
          </label>
        </div>
        <select
          id={`${idPrefix}-other-country`}
          name={`${idPrefix}-other-country`}
          className="ebay-calc__select"
          value={EXTRA_VALUES.includes(originCountry) ? originCountry : ''}
          onChange={(event) => {
            if (event.target.value) {
              onOriginChange(event.target.value as OriginCountry);
            }
          }}
        >
          <option value="">日本・中国・米国は上のボタンで選ぶ</option>
          {extraOriginCountries.map((country) => (
            <option key={country.value} value={country.value}>
              {country.label}
            </option>
          ))}
        </select>
        <p className="calculator__hint">{originTierHints[getOriginTier(originCountry)]}</p>
      </div>
    </>
  );
}
