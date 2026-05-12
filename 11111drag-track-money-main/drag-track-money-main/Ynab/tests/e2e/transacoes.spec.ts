import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';

test.describe('Transações', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);

    // Setup: cria uma conta para poder criar transações
    await page.click('button:has-text("Nova Conta")');
    await page.fill('input#name', 'Conta Teste');
    await page.fill('input#balance', '2000');
    await page.click('button:has-text("Criar Conta")');
    await expect(page.locator('span.truncate:has-text("Conta Teste")')).toBeVisible();
  });

  test('deve criar uma transação de despesa', async ({ page }) => {
    const btn = page.locator('header button:has-text("Nova transação"), banner button:has-text("Nova transação")').first();
    await btn.click();

    await page.fill('input#description', 'Supermercado');
    await page.fill('input#amount', '150.50');
    await page.selectOption('select#type', 'expense');
    await page.selectOption('select#account', { label: 'Conta Teste' });
    await page.click('button:has-text("Salvar Transação")');

    // Navega para transações e verifica
    await page.click('a[href="/transactions"]');
    await expect(page.locator('text=Supermercado')).toBeVisible();
  });

  test('deve criar uma transação de receita', async ({ page }) => {
    const btn = page.locator('header button:has-text("Nova transação"), banner button:has-text("Nova transação")').first();
    await btn.click();

    await page.fill('input#description', 'Salário');
    await page.fill('input#amount', '3000');
    await page.selectOption('select#type', 'income');
    await page.selectOption('select#account', { label: 'Conta Teste' });
    await page.click('button:has-text("Salvar Transação")');

    await page.click('a[href="/transactions"]');
    await expect(page.locator('text=Salário')).toBeVisible();
  });

  test('deve filtrar transações pela busca', async ({ page }) => {
    // Cria duas transações
    const btn = page.locator('header button:has-text("Nova transação"), banner button:has-text("Nova transação")').first();
    
    await btn.click();
    await page.fill('input#description', 'Academia');
    await page.fill('input#amount', '80');
    await page.selectOption('select#account', { label: 'Conta Teste' });
    await page.click('button:has-text("Salvar Transação")');

    await btn.click();
    await page.fill('input#description', 'Netflix');
    await page.fill('input#amount', '15');
    await page.selectOption('select#account', { label: 'Conta Teste' });
    await page.click('button:has-text("Salvar Transação")');

    await page.click('a[href="/transactions"]');
    await expect(page.locator('text=Academia')).toBeVisible();
    await expect(page.locator('text=Netflix')).toBeVisible();

    // Filtra
    await page.fill('input[placeholder="Buscar por descrição..."]', 'Acad');
    await expect(page.locator('text=Academia')).toBeVisible();
    await expect(page.locator('text=Netflix')).not.toBeVisible();
  });

  test('deve excluir uma transação', async ({ page }) => {
    const btn = page.locator('header button:has-text("Nova transação"), banner button:has-text("Nova transação")').first();
    await btn.click();
    await page.fill('input#description', 'Para Deletar');
    await page.fill('input#amount', '10');
    await page.selectOption('select#account', { label: 'Conta Teste' });
    await page.click('button:has-text("Salvar Transação")');

    await page.click('a[href="/transactions"]');
    await expect(page.locator('text=Para Deletar')).toBeVisible();

    // Abre dropdown de ações
    await page.locator('tr:has-text("Para Deletar")').hover();
    await page.locator('tr:has-text("Para Deletar") button[aria-haspopup="menu"]').click();
    
    // Confirma diálogo
    page.on('dialog', d => d.accept());
    await page.click('text=Excluir');

    await expect(page.locator('text=Para Deletar')).not.toBeVisible({ timeout: 5000 });
  });

  test('deve mostrar a página de Transações com a tabela vazia inicialmente', async ({ page }) => {
    await page.click('a[href="/transactions"]');
    await expect(page.getByRole('heading', { name: 'Transações', level: 1 })).toBeVisible();
    await expect(page.locator('text=Nenhuma transação')).toBeVisible();
  });
});
