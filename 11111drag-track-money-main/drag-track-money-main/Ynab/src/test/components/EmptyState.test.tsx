import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { FolderOpen } from 'lucide-react';

describe('EmptyState', () => {
  it('should render title and description', () => {
    render(
      <EmptyState 
        icon={FolderOpen} 
        title="Nenhum dado" 
        description="Não há nada aqui para ver" 
      />
    );
    
    expect(screen.getByText('Nenhum dado')).toBeInTheDocument();
    expect(screen.getByText('Não há nada aqui para ver')).toBeInTheDocument();
  });

  it('should render action element if provided', () => {
    render(
      <EmptyState 
        icon={FolderOpen} 
        title="Vazio" 
        description="Tente adicionar algo" 
        actionLabel="Adicionar Novo"
        onAction={() => {}}
      />
    );
    
    expect(screen.getByText('Adicionar Novo')).toBeInTheDocument();
  });
});
