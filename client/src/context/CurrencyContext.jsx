import { createContext, useContext, useState, useEffect } from 'react';

export const CurrencyContext = createContext({
  currency: 'USD',
  rate: 83.50, // Default fallback INR rate
  setCurrency: () => {},
  formatCurrency: (val) => val
});

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'USD');
  const rate = 83.95; // Hardcoded fixed rate to ensure 100% demo reliability without external API calls

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  // Helper to format values automatically based on selected currency
  const formatCurrency = (usdValue, showPerDay = false) => {
    if (usdValue === null || usdValue === undefined || isNaN(usdValue)) return 'N/A';
    
    let formatted = '';
    if (currency === 'INR') {
      const inrValue = usdValue * rate;
      // If it's a huge number (like savings in millions), format it in Crores/Lakhs for Indian context
      if (inrValue >= 10000000) {
        formatted = `₹${(inrValue / 10000000).toFixed(2)} Cr`;
      } else if (inrValue >= 100000) {
        formatted = `₹${(inrValue / 100000).toFixed(2)} L`;
      } else {
        formatted = `₹${Math.round(inrValue).toLocaleString('en-IN')}`;
      }
    } else {
      formatted = `$${Math.round(usdValue).toLocaleString('en-US')}`;
    }
    
    return showPerDay ? `${formatted}/day` : formatted;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rate, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
