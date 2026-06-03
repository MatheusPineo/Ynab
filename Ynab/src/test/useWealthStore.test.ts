import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWealthStore } from '@/modules/finance/store/useWealthStore';
import { groupWealthHoldings, distributeProportionally } from '@/modules/finance/store/wealth-utils';

// Mock authenticatedFetch
vi.mock('@/shared/lib/api', () => ({
  authenticatedFetch: vi.fn(),
}));

import { authenticatedFetch } from '@/shared/lib/api';

describe('useWealthStore & wealth-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWealthStore.setState({
      assets: [],
      activities: [],
      summary: null,
      isLoading: false,
      error: null,
    });
  });

  describe('wealth-utils: groupWealthHoldings', () => {
    it('deve agrupar holdings por conta e por macro categoria corretamente', () => {
      const holdings = [
        {
          asset_id: 1,
          ticker: 'PETR4',
          name: 'Petrobras',
          currency: 'BRL',
          asset_type: 'STOCK' as const,
          quantity: 100,
          average_cost: 30,
          total_cost_basis: 3000,
          net_value: 3500,
          macro_category: 'Ações',
        },
        {
          asset_id: 2,
          ticker: 'VALE3',
          name: 'Vale',
          currency: 'BRL',
          asset_type: 'STOCK' as const,
          quantity: 50,
          average_cost: 60,
          total_cost_basis: 3000,
          net_value: 3200,
          macro_category: 'Ações',
        },
        {
          asset_id: 3,
          ticker: 'CDB_ITAÚ',
          name: 'CDB Itaú',
          currency: 'BRL',
          asset_type: 'FIXED_INCOME' as const,
          quantity: 1,
          average_cost: 5000,
          total_cost_basis: 5000,
          net_value: 5200,
          macro_category: 'Renda Fixa',
        }
      ];

      const activities = [
        {
          id: 101,
          asset: 1,
          account: 1,
          activity_type: 'BUY' as const,
          date: '2026-01-01',
          quantity: 100,
          unit_price: 30,
          fees: 0,
          notes: '',
        },
        {
          id: 102,
          asset: 2,
          account: 1,
          activity_type: 'BUY' as const,
          date: '2026-01-02',
          quantity: 50,
          unit_price: 60,
          fees: 0,
          notes: '',
        },
        {
          id: 103,
          asset: 3,
          account: 2,
          activity_type: 'BUY' as const,
          date: '2026-01-03',
          quantity: 1,
          unit_price: 5000,
          fees: 0,
          notes: '',
        }
      ];

      const accounts = [
        { id: 1, name: 'Corretora A' },
        { id: 2, name: 'Banco B' },
      ];

      const tree = groupWealthHoldings(holdings, activities, accounts);

      expect(tree).toHaveLength(2);
      
      const corretora = tree.find(n => n.account_id === 1);
      expect(corretora).toBeDefined();
      expect(corretora?.account_name).toBe('Corretora A');
      expect(corretora?.net_value).toBe(6700); // 3500 + 3200
      expect(corretora?.macroCategories).toHaveLength(1);
      expect(corretora?.macroCategories[0].name).toBe('Ações');
      expect(corretora?.macroCategories[0].net_value).toBe(6700);
      expect(corretora?.macroCategories[0].assets).toHaveLength(2);

      const banco = tree.find(n => n.account_id === 2);
      expect(banco).toBeDefined();
      expect(banco?.account_name).toBe('Banco B');
      expect(banco?.net_value).toBe(5200);
      expect(banco?.macroCategories[0].name).toBe('Renda Fixa');
    });
  });

  describe('wealth-utils: distributeProportionally', () => {
    it('deve distribuir proporcionalmente o novo saldo entre os ativos', () => {
      const assets = [
        {
          asset_id: 1,
          ticker: 'A',
          name: 'Asset A',
          currency: 'BRL',
          asset_type: 'STOCK' as const,
          quantity: 10,
          average_cost: 10,
          total_cost_basis: 100,
          net_value: 100, // 25% do total antigo de 400
        },
        {
          asset_id: 2,
          ticker: 'B',
          name: 'Asset B',
          currency: 'BRL',
          asset_type: 'STOCK' as const,
          quantity: 10,
          average_cost: 30,
          total_cost_basis: 300,
          net_value: 300, // 75% do total antigo de 400
        }
      ];

      const updates = distributeProportionally(assets, 800);
      expect(updates).toEqual([
        { asset_id: 1, new_balance: 200 },
        { asset_id: 2, new_balance: 600 },
      ]);
    });

    it('deve distribuir igualmente se o saldo anterior for zero', () => {
      const assets = [
        {
          asset_id: 1,
          ticker: 'A',
          name: 'Asset A',
          currency: 'BRL',
          asset_type: 'STOCK' as const,
          quantity: 10,
          average_cost: 0,
          total_cost_basis: 0,
          net_value: 0,
        },
        {
          asset_id: 2,
          ticker: 'B',
          name: 'Asset B',
          currency: 'BRL',
          asset_type: 'STOCK' as const,
          quantity: 10,
          average_cost: 0,
          total_cost_basis: 0,
          net_value: 0,
        }
      ];

      const updates = distributeProportionally(assets, 100);
      expect(updates).toEqual([
        { asset_id: 1, new_balance: 50 },
        { asset_id: 2, new_balance: 50 },
      ]);
    });

    it('deve aplicar o resto de arredondamento no maior ativo', () => {
      const assets = [
        {
          asset_id: 1,
          ticker: 'A',
          name: 'Asset A',
          currency: 'BRL',
          asset_type: 'STOCK' as const,
          quantity: 1,
          average_cost: 100,
          total_cost_basis: 100,
          net_value: 100, // Menor ativo
        },
        {
          asset_id: 2,
          ticker: 'B',
          name: 'Asset B',
          currency: 'BRL',
          asset_type: 'STOCK' as const,
          quantity: 1,
          average_cost: 200,
          total_cost_basis: 200,
          net_value: 200, // Maior ativo
        }
      ];

      // Se distribuirmos 100.01:
      // Asset A (1/3 de 100.01 = 33.3366... -> 33.34)
      // Asset B (2/3 de 100.01 = 66.6733... -> 66.67)
      // Soma = 100.01. Remainder = 0.
      
      // Vamos tentar um valor que crie resto: new_balance = 100.00
      // 100.00 * (1/3) = 33.33
      // 100.00 * (2/3) = 66.67
      // Soma = 100.00. Remainder = 0.
      
      // Vamos forçar um com 3 ativos com pesos iguais: total 300, new = 100
      // Ativo 1: 100, Ativo 2: 100, Ativo 3: 101. Total = 301. Novo = 100.00
      // Share 1 = 100/301 = 0.3322259 -> 33.22
      // Share 2 = 100/301 = 0.3322259 -> 33.22
      // Share 3 = 101/301 = 0.3355481 -> 33.55
      // Soma = 33.22 + 33.22 + 33.55 = 99.99
      // Diferença (Resto) = +0.01
      // Maior ativo antigo era o Ativo 3 (net_value 101).
      // Ativo 3 deve receber o resto: 33.55 + 0.01 = 33.56.
      const assetsForRounding = [
        {
          asset_id: 1,
          ticker: 'A',
          name: 'A',
          currency: 'BRL',
          asset_type: 'STOCK' as const,
          quantity: 1,
          average_cost: 100,
          total_cost_basis: 100,
          net_value: 100,
        },
        {
          asset_id: 2,
          ticker: 'B',
          name: 'B',
          currency: 'BRL',
          asset_type: 'STOCK' as const,
          quantity: 1,
          average_cost: 100,
          total_cost_basis: 100,
          net_value: 100,
        },
        {
          asset_id: 3,
          ticker: 'C',
          name: 'C',
          currency: 'BRL',
          asset_type: 'STOCK' as const,
          quantity: 1,
          average_cost: 101,
          total_cost_basis: 101,
          net_value: 101, // Maior ativo
        }
      ];

      const updates = distributeProportionally(assetsForRounding, 100.00);
      expect(updates.find(u => u.asset_id === 3)?.new_balance).toBe(33.56);
      const totalSum = updates.reduce((sum, u) => sum + u.new_balance, 0);
      expect(totalSum).toBe(100.00);
    });
  });

  describe('useWealthStore Actions', () => {
    it('deve chamar o endpoint de batch-update ao atualizar saldo de um ativo', async () => {
      vi.mocked(authenticatedFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as any);

      // Mock fetchSummary
      vi.mocked(authenticatedFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ holdings: [], total_net_worth: 0 }),
      } as any);

      await useWealthStore.getState().updateAssetBalance(1, 1500);

      expect(authenticatedFetch).toHaveBeenCalledWith('/wealth/batch-update/', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          updates: [{ asset_id: 1, new_balance: 1500 }]
        })
      }));
    });
  });
});
