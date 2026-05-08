import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from '../../components/dashboard/BottomNav';

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
