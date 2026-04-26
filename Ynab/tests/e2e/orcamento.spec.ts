import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';

test.describe('Orçamento', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await page.click('a[href="/budget"]');
    await page.waitForURL(/.*budget/, { timeout: 10000 });
    await page.locator('text=Pronto para Alocar').waitFor({ state: 'visible', timeout: 10000 });
  });

  test('deve carregar a página de Orçamento corretamente', async ({ page }) => {
    await expect(page.locator('text=Pronto para Alocar')).toBeVisible();
    await expect(page.locator('button:has-text("Automático")')).toBeVisible();
    await expect(page.locator('button:has-text("Novo Grupo")')).toBeVisible();
  });

  test('deve criar um novo grupo de orçamento', async ({ page }) => {
    await page.click('button:has-text("Novo Grupo")');
    await expect(page.locator('text=Criar Novo Grupo de Orçamento')).toBeVisible();
    
    await page.fill('input#groupName', 'Lazer');
    await page.click('button:has-text("Criar Grupo")');

    await expect(page.locator('h2', { hasText: 'Lazer' })).toBeVisible({ timeout: 5000 });
  });

  test('deve criar uma categoria dentro de um grupo', async ({ page }) => {
    // Primeiro cria o grupo
    await page.click('button:has-text("Novo Grupo")');
    await page.fill('input#groupName', 'Moradia');
    await page.click('button:has-text("Criar Grupo")');
    await expect(page.locator('h2', { hasText: 'Moradia' })).toBeVisible({ timeout: 5000 });

    // Adiciona categoria ao grupo
    // O botão + está ao lado do nome do grupo
    await page.locator('h2', { hasText: 'Moradia' }).locator('..').locator('..').getByTestId('add-category-button').click();
    await expect(page.locator('text=Nova Categoria em')).toBeVisible();
    
    await page.fill('input#catName', 'Aluguel');
    await page.click('button:has-text("Adicionar Categoria")');

    await expect(page.locator('span.font-semibold', { hasText: 'Aluguel' })).toBeVisible({ timeout: 5000 });
  });

  test('deve navegar entre meses usando os botões de seta', async ({ page }) => {
    const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
      'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const now = new Date();
    const currentMonthName = monthNames[now.getMonth()];
    const prevMonthName = monthNames[now.getMonth() === 0 ? 11 : now.getMonth() - 1];

    await expect(page.locator('span.font-bold', { hasText: currentMonthName })).toBeVisible();

    // Clica na seta esquerda (mês anterior)
    await page.getByTestId('prev-month').click();
    await expect(page.locator('span.font-bold', { hasText: prevMonthName })).toBeVisible();

    // Volta ao mês atual
    await page.getByTestId('next-month').click();
    await expect(page.locator('span.font-bold', { hasText: currentMonthName })).toBeVisible();
  });

  test('deve abrir o dropdown de Auto-Assign', async ({ page }) => {
    await page.click('button:has-text("Automático")');
    await expect(page.locator('text=Regras de Orçamento')).toBeVisible();
    await expect(page.locator('text=Usar gastos do mês passado')).toBeVisible();
    await expect(page.locator('text=Repetir orçamento passado')).toBeVisible();
    await expect(page.locator('text=Limpar todo o orçamento')).toBeVisible();
    // Fecha o dropdown
    await page.keyboard.press('Escape');
  });
});
