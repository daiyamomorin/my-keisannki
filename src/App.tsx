import { useState } from 'react';
import ProcurementCalculator from './components/procurement-calculator';
import EcoAuctionCalculator from './components/eco-auction-calculator';
import OaknetCalculator from './components/oaknet-calculator';
import EbayCalculator from './components/ebay-calculator';
import EbayReverseCalculator from './components/ebay-reverse-calculator';
import CurrencyConverter from './components/currency-converter';

type CalculatorView = 'procurement' | 'eco' | 'oaknet' | 'ebay' | 'ebayReverse' | 'fx';

const App = () => {
  const [activeView, setActiveView] = useState<CalculatorView>('procurement');

  return (
    <main className="app">
      <h1>せどり計算機</h1>

      <div className="view-toggle" role="tablist" aria-label="計算機の切り替え">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'procurement'}
          className={`view-toggle__button${
            activeView === 'procurement' ? ' view-toggle__button--active' : ''
          }`}
          onClick={() => setActiveView('procurement')}
        >
          通常仕入れ計算機
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'eco'}
          className={`view-toggle__button${activeView === 'eco' ? ' view-toggle__button--active' : ''}`}
          onClick={() => setActiveView('eco')}
        >
          エコオク計算機
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'oaknet'}
          className={`view-toggle__button${
            activeView === 'oaknet' ? ' view-toggle__button--active' : ''
          }`}
          onClick={() => setActiveView('oaknet')}
        >
          オークネット計算機
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'ebay'}
          className={`view-toggle__button${activeView === 'ebay' ? ' view-toggle__button--active' : ''}`}
          onClick={() => setActiveView('ebay')}
        >
          eBay無在庫計算機
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'ebayReverse'}
          className={`view-toggle__button${
            activeView === 'ebayReverse' ? ' view-toggle__button--active' : ''
          }`}
          onClick={() => setActiveView('ebayReverse')}
        >
          eBay逆算計算機
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'fx'}
          className={`view-toggle__button${activeView === 'fx' ? ' view-toggle__button--active' : ''}`}
          onClick={() => setActiveView('fx')}
        >
          為替計算機
        </button>
      </div>

      {activeView === 'procurement' && <ProcurementCalculator />}
      {activeView === 'eco' && <EcoAuctionCalculator />}
      {activeView === 'oaknet' && <OaknetCalculator />}
      {activeView === 'ebay' && <EbayCalculator />}
      {activeView === 'ebayReverse' && <EbayReverseCalculator />}
      {activeView === 'fx' && <CurrencyConverter />}
    </main>
  );
};

export default App;
