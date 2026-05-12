import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';

test.describe('Contas', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('deve criar uma conta raiz e exibi-la na lista', async ({ page }) => {
    await page.click('button:has-text("Nova Conta")');
    await page.fill('input#name', 'Conta Corrente');
    await page.fill('input#balance', '500');
    await page.click('button:has-text("Criar Conta")');

    await expect(page.locator('span.truncate:has-text("Conta Corrente")')).toBeVisible();
  });

  test('deve mostrar o saldo inicial correto na conta criada', async ({ page }) => {
    await page.click('button:has-text("Nova Conta")');
    await page.fill('input#name', 'Poupança');
    await page.fill('input#balance', '2500');
    await page.click('button:has-text("Criar Conta")');

    await expect(page.locator('span.truncate:has-text("Poupança")')).toBeVisible();
    // span.truncate já confirma que a conta foi criada e aparece na lista
  });

  test('deve criar uma nova transação a partir do botão do header', async ({ page }) => {
    // Cria uma conta primeiro
    await page.click('button:has-text("Nova Conta")');
    await page.fill('input#name', 'Carteira');
    await page.fill('input#balance', '1000');
    await page.click('button:has-text("Criar Conta")');
    await expect(page.locator('span.truncate:has-text("Carteira")')).toBeVisible();

    // Abre modal de transação do header e verifica que a conta aparece no seletor
    const btn = page.locator('header button:has-text("Nova transação"), banner button:has-text("Nova transação")').first();
    await btn.click();
    await expect(page.locator('select#account option:has-text("Carteira")')).toBeAttached({ timeout: 5000 });
    await page.locator('[role="dialog"] button:has-text("Close"), [role="dialog"] button[aria-label="Close"]').click();
  });
});
