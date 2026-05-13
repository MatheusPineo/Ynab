import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CreditCards } from '@/modules/finance/pages/CreditCards';

vi.mock('@/modules/finance/store/useAccountStore', () => ({
  useAccountStore: () => ({
    fetchAccounts: vi.fn(),
    fetchCategoryGroups: vi.fn(),
    categoryGroups: [],
    getCategoryName: vi.fn((id: string) => "Categoria Mock")
  })
}));

vi.mock('@/shared/lib/api', () => ({
  authenticatedFetch: vi.fn(async () => {
    return {
      ok: true,
      json: async () => []
    };
  })
}));

describe('CreditCards Page', () => {
  it('should render empty state when no cards are available', async () => {
    render(
      <MemoryRouter>
        <CreditCards />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nenhum Cartão Cadastrado')).toBeInTheDocument();
      expect(screen.getByText('Cadastrar Meu Primeiro Cartão')).toBeInTheDocument();
    });
  });

  it('should allow opening new card modal from empty state', async () => {
    render(
      <MemoryRouter>
        <CreditCards />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Cadastrar Meu Primeiro Cartão')).toBeInTheDocument();
    });

    const newCardBtn = screen.getByText('Cadastrar Meu Primeiro Cartão');
    fireEvent.click(newCardBtn);

    await waitFor(() => {
      expect(screen.getByText('Novo Cartão')).toBeInTheDocument();
      expect(screen.getByText('Nome do Cartão')).toBeInTheDocument();
    });
  });

  it('should show error when trying to create transaction without selected card', async () => {
    render(
      <MemoryRouter>
        <CreditCards />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Lançar Compra')).toBeInTheDocument();
    });

    const newTxBtn = screen.getByText('Lançar Compra');
    fireEvent.click(newTxBtn);

    // O toast de erro é disparado no onClick, logo o modal não deve abrir
    expect(screen.queryByText('Nova Compra')).not.toBeInTheDocument();
  });
});
