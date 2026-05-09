import { describe, it, expect, beforeEach } from 'vitest';
import { useAccountStore } from '../store/useAccountStore';
import { AccountNode, CategoryNode, Transaction } from '../types';

describe('useAccountStore helpers', () => {
  const mockTree: AccountNode[] = [
    {
      id: '1',
      name: 'Bank A',
      balance: 1000,
      currency: 'EUR',
      account_type: 'checking',
      parent: null,
      children: [
        {
          id: '1-1',
          name: 'Savings A',
          balance: 500,
          currency: 'EUR',
          account_type: 'savings',
          parent: '1'
        }
      ]
    },
    {
      id: '2',
      name: 'Bank B',
      balance: 2000,
      currency: 'USD',
      account_type: 'checking',
      parent: null
    }
  ];

  const mockCategoryGroups: CategoryNode[] = [
    {
      id: 'c1',
      name: 'Housing',
      assigned_amount: 0,
      spent_amount: 0,
      parent: null,
      children: [
        {
          id: 'c1-1',
          name: 'Rent',
          assigned_amount: 1000,
          spent_amount: 1000,
          parent: 'c1'
        }
      ]
    }
  ];

  beforeEach(() => {
    useAccountStore.setState({
      tree: mockTree,
      categoryGroups: mockCategoryGroups,
      transactions: [],
      pendingIcons: {},
    });
  });

  it('getAccount should find top level and nested accounts', () => {
    const { getAccount } = useAccountStore.getState();
    expect(getAccount('1')?.name).toBe('Bank A');
    expect(getAccount('1-1')?.name).toBe('Savings A');
    expect(getAccount('999')).toBeUndefined();
  });

  it('getAccountName should return correct names', () => {
    const { getAccountName } = useAccountStore.getState();
    expect(getAccountName('2')).toBe('Bank B');
    expect(getAccountName('999')).toBe('Conta'); // Fallback
  });

  it('getCategoryName should return correct names', () => {
    const { getCategoryName } = useAccountStore.getState();
    expect(getCategoryName('c1')).toBe('Housing');
    expect(getCategoryName('c1-1')).toBe('Rent');
    expect(getCategoryName('999')).toBe('Categoria'); // Fallback
  });

  it('totalsByCurrency should sum balances correctly including children', () => {
    const { totalsByCurrency, tree } = useAccountStore.getState();
    const totals = totalsByCurrency(tree);
    
    // Bank A (1000) + Savings A (500) = 1500 EUR
    expect(totals.EUR).toBe(1500);
    // Bank B (2000) = 2000 USD
    expect(totals.USD).toBe(2000);
    expect(totals.BRL).toBe(0);
  });

  it('setPendingIcon should update pending icons record', () => {
    const { setPendingIcon } = useAccountStore.getState();
    const mockBlob = new Blob(['dummy'], { type: 'image/png' });
    
    setPendingIcon('1', mockBlob);
    expect(useAccountStore.getState().pendingIcons['1']).toBe(mockBlob);
    
    // Remove icon
    setPendingIcon('1', null);
    expect(useAccountStore.getState().pendingIcons['1']).toBeUndefined();
  });

  it('getHistory should calculate running balance correctly', () => {
    useAccountStore.setState({
      transactions: [
        { id: '1', amount: 1000, is_income: true, date: '2026-05-01' } as Transaction,
        { id: '2', amount: 200, is_income: false, date: '2026-05-02' } as Transaction,
        { id: '3', amount: 50, is_income: false, date: '2026-05-03' } as Transaction,
      ]
    });

    const { getHistory } = useAccountStore.getState();
    const history = getHistory();
    
    expect(history.length).toBe(3);
    expect(history[0]).toEqual({ date: '2026-05-01', balance: 1000 });
    expect(history[1]).toEqual({ date: '2026-05-02', balance: 800 });
    expect(history[2]).toEqual({ date: '2026-05-03', balance: 750 });
  });

  it('should support and keep ceiling properties in accounts', () => {
    const accountWithCeiling: AccountNode = {
      id: '9',
      name: 'Credit Card Limit',
      balance: -100,
      currency: 'BRL',
      ceiling: 5000,
    };
    useAccountStore.setState({
      tree: [...mockTree, accountWithCeiling]
    });

    const { getAccount } = useAccountStore.getState();
    const account = getAccount('9');
    expect(account).toBeDefined();
    expect(account?.ceiling).toBe(5000);
    expect(account?.balance).toBe(-100);
  });
});
