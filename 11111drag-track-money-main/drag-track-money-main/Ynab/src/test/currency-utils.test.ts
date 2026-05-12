import { describe, it, expect } from 'vitest';
import { formatMoney } from '../lib/currency-utils';

describe('currency-utils', () => {
  it('should format EUR correctly', () => {
    // Note: Intl.NumberFormat might use different non-breaking spaces, so we use normalize or regex
    const formatted = formatMoney(1234.56, 'EUR');
    expect(formatted.replace(/\s/g, ' ')).toMatch(/1.*234,56/);
    expect(formatted).toContain('€');
  });

  it('should format BRL correctly', () => {
    const formatted = formatMoney(1234.56, 'BRL');
    expect(formatted.replace(/\s/g, ' ')).toContain('1.234,56');
    expect(formatted).toContain('R$');
  });

  it('should format USD correctly', () => {
    const formatted = formatMoney(1234.56, 'USD');
    expect(formatted.replace(/\s/g, ' ')).toContain('1,234.56');
    expect(formatted).toContain('$');
  });

  it('should handle zero correctly', () => {
    const formatted = formatMoney(0, 'EUR');
    expect(formatted).toContain('0,00');
  });

  it('should handle negative values correctly', () => {
    const formatted = formatMoney(-500.50, 'BRL');
    // Em alguns ambientes node, o sinal negativo fica antes do R$, ex: -R$ 500,50
    expect(formatted.replace(/\s/g, ' ')).toMatch(/-.*500,50/);
  });

  it('should handle string inputs correctly', () => {
    const formatted = formatMoney("1234.56", 'USD');
    expect(formatted.replace(/\s/g, ' ')).toContain('1,234.56');
  });

  it('should fallback to 0 if NaN or undefined is passed', () => {
    // @ts-ignore for testing invalid input
    const formatted = formatMoney(undefined, 'BRL');
    expect(formatted).toContain('0,00');
    
    // @ts-ignore
    const formattedNaN = formatMoney(NaN, 'BRL');
    expect(formattedNaN).toContain('0,00');
  });
});
