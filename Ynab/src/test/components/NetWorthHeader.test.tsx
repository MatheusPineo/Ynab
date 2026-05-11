import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NetWorthHeader } from '@/modules/finance/components/NetWorthHeader';

// Mock the stores
vi.mock('@/modules/finance/store/useAccountStore', () => ({
  useAccountStore: () => ({
    tree: [],
    totalsByCurrency: () => ({ EUR: 1500.50, BRL: 0, USD: 0 })
  })
}));

vi.mock('@/modules/finance/store/useCurrencyStore', () => ({
  useCurrencyStore: () => ({
    baseCurrency: 'EUR',
    rates: { EUR: 1, BRL: 6.0, USD: 1.08 },
    setBaseCurrency: vi.fn(),
    convert: (amt: number) => amt
  })
}));

describe('NetWorthHeader', () => {
  it('should render total net worth', () => {
    render(<NetWorthHeader base="EUR" onBaseChange={() => {}} />);
    expect(screen.getByText('Patrimônio Total Líquido')).toBeInTheDocument();
    
    // Check if the formatted amount is present (spaces might differ depending on locale)
    const amountElements = screen.getAllByText(/1\.?500,50/);
    expect(amountElements.length).toBeGreaterThan(0);
  });
});
