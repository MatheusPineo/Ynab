import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCurrencyStore } from '../store/useCurrencyStore';

describe('useCurrencyStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useCurrencyStore.setState({
      rates: { EUR: 1, BRL: 6.0, USD: 1.08 },
      lastUpdated: null,
      baseCurrency: 'EUR',
      isLoading: false,
    });
    localStorage.clear();
  });

  it('should have correct initial state', () => {
    const state = useCurrencyStore.getState();
    expect(state.baseCurrency).toBe('EUR');
    expect(state.rates).toEqual({ EUR: 1, BRL: 6.0, USD: 1.08 });
    expect(state.isLoading).toBe(false);
  });

  it('should set base currency and persist to localStorage', () => {
    const { setBaseCurrency } = useCurrencyStore.getState();
    
    setBaseCurrency('USD');
    
    expect(useCurrencyStore.getState().baseCurrency).toBe('USD');
    expect(localStorage.getItem('baseCurrency')).toBe('USD');
  });

  it('should convert correctly from EUR to BRL', () => {
    const { convert } = useCurrencyStore.getState();
    const result = convert(100, 'EUR', 'BRL');
    // 100 / 1 * 6.0 = 600
    expect(result).toBe(600);
  });

  it('should convert correctly from BRL to USD', () => {
    const { convert } = useCurrencyStore.getState();
    const result = convert(600, 'BRL', 'USD');
    // 600 / 6.0 * 1.08 = 108
    expect(result).toBeCloseTo(108);
  });

  it('should convert correctly with same currency', () => {
    const { convert } = useCurrencyStore.getState();
    const result = convert(100, 'BRL', 'BRL');
    expect(result).toBe(100);
  });

  it('should handle missing rates gracefully', () => {
    useCurrencyStore.setState({
      rates: { EUR: 1, BRL: 0, USD: 0 } as any // Intentionally broken rates
    });
    const { convert } = useCurrencyStore.getState();
    
    // If rate is 0 or missing, it falls back to 1
    const result = convert(100, 'BRL', 'EUR');
    // 100 / (0 || 1) * 1 = 100
    expect(result).toBe(100);
  });
});
