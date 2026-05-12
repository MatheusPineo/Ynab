import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from '../../components/dashboard/BottomNav';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => {
      const keys: Record<string, string> = {
        'navigation.dashboard': 'Dashboard',
        'navigation.transactions': 'Transações',
        'navigation.accounts': 'Contas',
        'navigation.budget': 'Orçamento',
        'navigation.more': defaultValue || 'Mais'
      };
      return keys[key] || key;
    },
    i18n: {
      changeLanguage: vi.fn(),
      language: 'pt-BR'
    }
  }),
}));

// Mock matchMedia
window.matchMedia = window.matchMedia || function() {
    return {
        matches: false,
        addListener: function() {},
        removeListener: function() {}
    };
};

describe('BottomNav', () => {
  it('should render navigation items', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNav />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Transações')).toBeInTheDocument();
    expect(screen.getByText('Contas')).toBeInTheDocument();
    expect(screen.getByText('Orçamento')).toBeInTheDocument();
  });
});
