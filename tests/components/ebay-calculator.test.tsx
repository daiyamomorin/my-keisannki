import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EbayCalculator from '../../src/components/ebay-calculator';

const jpyFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY'
});

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

describe('eBay無在庫 利益計算機', () => {
  it('仕入れ値・販売予想額・国際送料プリセットから、DDPデフォルトON（関税12.5%＋通関と処理手数料自動計算）で利益と利益率を計算する', async () => {
    render(<EbayCalculator />);

    const purchasePriceInput = screen.getByLabelText('仕入れ値（円）') as HTMLInputElement;
    fireEvent.change(purchasePriceInput, { target: { value: '10000' } });

    const salePriceInput = screen.getByLabelText('販売予想額（ドル）') as HTMLInputElement;
    fireEvent.change(salePriceInput, { target: { value: '100' } });

    const intlShippingPresetSelect = screen.getByLabelText('実際の国際送料（円）') as HTMLSelectElement;
    fireEvent.change(intlShippingPresetSelect, { target: { value: 'EMS 〜500g' } });

    await waitFor(() => {
      expect(screen.getAllByText(jpyFormatter.format(-3793)).length).toBeGreaterThan(0);
      expect(screen.getByText('利益率 -24.47%')).toBeInTheDocument();
    });
  });

  it('DDPはデフォルトでONになっており、原産国は日本、General Rate入力欄は非表示（12.5%フロアが自動適用）、通関と処理手数料は自動計算がデフォルト', () => {
    render(<EbayCalculator />);

    const dutyToggle = screen.getByLabelText('関税を自分で負担する（DDP）') as HTMLInputElement;
    expect(dutyToggle.checked).toBe(true);

    const japanChip = screen.getByRole('button', { name: '日本（Section 301対象）' });
    expect(japanChip.className).toContain('calculator__chip--active');

    expect(document.getElementById('dutyRatePercent')).toBeNull();

    const autoChip = screen.getByRole('button', { name: '自動計算' });
    expect(autoChip.className).toContain('calculator__chip--active');
  });

  it('原産国を米国等に切り替えるとGeneral Rateの入力欄が表示され、デフォルトは0%', () => {
    render(<EbayCalculator />);

    const usChip = screen.getByRole('button', { name: '米国等（Section 301対象外）' });
    fireEvent.click(usChip);

    const dutyRateInput = document.getElementById('dutyRatePercent') as HTMLInputElement;
    expect(dutyRateInput).not.toBeNull();
    expect(dutyRateInput.value).toBe('0');
  });

  it('DDPをOFFにすると関税分・通関と処理手数料がなくなり利益が増える', async () => {
    render(<EbayCalculator />);

    const purchasePriceInput = screen.getByLabelText('仕入れ値（円）') as HTMLInputElement;
    fireEvent.change(purchasePriceInput, { target: { value: '10000' } });

    const salePriceInput = screen.getByLabelText('販売予想額（ドル）') as HTMLInputElement;
    fireEvent.change(salePriceInput, { target: { value: '100' } });

    const intlShippingPresetSelect = screen.getByLabelText('実際の国際送料（円）') as HTMLSelectElement;
    fireEvent.change(intlShippingPresetSelect, { target: { value: 'EMS 〜500g' } });

    const dutyToggle = screen.getByLabelText('関税を自分で負担する（DDP）') as HTMLInputElement;
    expect(dutyToggle.checked).toBe(true);
    fireEvent.click(dutyToggle);

    await waitFor(() => {
      expect(screen.getAllByText(jpyFormatter.format(-1087)).length).toBeGreaterThan(0);
    });
  });

  it('手動入力に切り替えると通関と処理手数料の入力欄が表示される', () => {
    render(<EbayCalculator />);

    const manualChip = screen.getByRole('button', { name: '手動入力' });
    fireEvent.click(manualChip);

    const customsInput = document.getElementById('customsHandlingJpy') as HTMLInputElement;
    expect(customsInput).not.toBeNull();
  });

  it('FVF行はper-order feeを含まない料率分のみを表示し、per-order feeは別行で表示する', async () => {
    render(<EbayCalculator />);

    const purchasePriceInput = screen.getByLabelText('仕入れ値（円）') as HTMLInputElement;
    fireEvent.change(purchasePriceInput, { target: { value: '10000' } });

    const salePriceInput = screen.getByLabelText('販売予想額（ドル）') as HTMLInputElement;
    fireEvent.change(salePriceInput, { target: { value: '100' } });

    const intlShippingPresetSelect = screen.getByLabelText('実際の国際送料（円）') as HTMLSelectElement;
    fireEvent.change(intlShippingPresetSelect, { target: { value: 'EMS 〜500g' } });

    await waitFor(() => {
      expect(screen.getByText(`-${usdFormatter.format(13.6)}`)).toBeInTheDocument();
      expect(screen.getByText(`-${usdFormatter.format(0.4)}`)).toBeInTheDocument();
    });
  });
});
