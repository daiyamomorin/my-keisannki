import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EbayReverseCalculator from '../../src/components/ebay-reverse-calculator';

describe('eBay逆算計算機', () => {
  it('仕入れ値未入力のときは結果が---になる', () => {
    render(<EbayReverseCalculator />);

    expect(screen.getByText('---')).toBeInTheDocument();
  });

  it('仕入れ値・国際送料プリセットを入力すると出品価格($)と利益が表示される', async () => {
    render(<EbayReverseCalculator />);

    const purchasePriceInput = screen.getByLabelText('仕入れ値（円）') as HTMLInputElement;
    fireEvent.change(purchasePriceInput, { target: { value: '10000' } });

    const detailsToggle = screen.getByText('詳細設定（送料・手数料・レート）');
    fireEvent.click(detailsToggle);

    const intlShippingPresetSelect = screen.getByLabelText('実際の国際送料（円）') as HTMLSelectElement;
    fireEvent.change(intlShippingPresetSelect, { target: { value: 'EMS 〜500g' } });

    await waitFor(() => {
      expect(screen.queryByText('---')).not.toBeInTheDocument();
      expect(screen.getByText(/そのときの利益/)).toBeInTheDocument();
    });
  });

  it('希望利益額のデフォルトは5,000円', () => {
    render(<EbayReverseCalculator />);

    const slider = screen.getByRole('slider') as HTMLInputElement;
    expect(slider.value).toBe('5000');
  });

  it('希望利益率チップに切り替えるとデフォルト25%が選択されている', () => {
    render(<EbayReverseCalculator />);

    const rateChip = screen.getByRole('button', { name: '利益率' });
    fireEvent.click(rateChip);

    const activeChip = screen.getByRole('button', { name: '25%' });
    expect(activeChip.className).toContain('calculator__chip--active');
  });

  it('DDPはデフォルトでONになっており、原産国は日本、General Rate入力欄は非表示（12.5%フロアが自動適用）、通関と処理手数料は自動計算がデフォルト', () => {
    render(<EbayReverseCalculator />);

    const detailsToggle = screen.getByText('詳細設定（送料・手数料・レート）');
    fireEvent.click(detailsToggle);

    const dutyToggle = screen.getByLabelText('関税を自分で負担する（DDP）') as HTMLInputElement;
    expect(dutyToggle.checked).toBe(true);

    const japanChip = screen.getByRole('button', { name: '日本（Section 301対象）' });
    expect(japanChip.className).toContain('calculator__chip--active');

    expect(document.getElementById('dutyRatePercent')).toBeNull();

    const autoChip = screen.getByRole('button', { name: '自動計算' });
    expect(autoChip.className).toContain('calculator__chip--active');
  });

  it('原産国を米国等に切り替えるとGeneral Rateの入力欄が表示され、デフォルトは0%', () => {
    render(<EbayReverseCalculator />);

    const detailsToggle = screen.getByText('詳細設定（送料・手数料・レート）');
    fireEvent.click(detailsToggle);

    const usChip = screen.getByRole('button', { name: '米国等（Section 301対象外）' });
    fireEvent.click(usChip);

    const dutyRateInput = document.getElementById('dutyRatePercent') as HTMLInputElement;
    expect(dutyRateInput).not.toBeNull();
    expect(dutyRateInput.value).toBe('0');
  });

  it('詳細設定と内訳を見るはデフォルトで閉じている', () => {
    render(<EbayReverseCalculator />);

    const detailsElements = document.querySelectorAll('details');
    expect(detailsElements.length).toBe(2);
    detailsElements.forEach((element) => {
      expect(element.hasAttribute('open')).toBe(false);
    });
  });
});
