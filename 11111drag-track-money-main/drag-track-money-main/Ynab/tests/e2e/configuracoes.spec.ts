import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';

test.describe('Configurações', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await page.click('a[href="/settings"]');
    await expect(page.getByRole('heading', { name: 'Configurações', level: 1 })).toBeVisible();
  });

  // --- Aba Perfil ---
  test('deve exibir as informações do usuário na aba Perfil', async ({ page }) => {
    await expect(page.locator('text=Plano Premium')).toBeVisible();
    await expect(page.locator('input#name')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
  });

  test('deve ter o botão Salvar Alterações visível na aba Perfil', async ({ page }) => {
    await expect(page.locator('button:has-text("Salvar Alterações")')).toBeVisible();
  });

  test('deve ter o botão Alterar Foto visível', async ({ page }) => {
    await expect(page.locator('button:has-text("Alterar Foto")')).toBeVisible();
  });

  test('deve exibir as opções de segurança na aba Perfil', async ({ page }) => {
    await expect(page.locator('text=Segurança da Conta')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Alterar', exact: true })).toBeVisible(); // Alterar senha
    await expect(page.locator('button:has-text("Ativar")')).toBeVisible();  // Ativar 2FA
  });

  // --- Aba Preferências ---
  test('deve abrir a aba Preferências e mostrar os seletores', async ({ page }) => {
    await page.click('button:has-text("Preferências")');
    await expect(page.locator('text=Regional e Moeda')).toBeVisible();
    await expect(page.locator('text=Idioma do Sistema')).toBeVisible();
    await expect(page.locator('text=Moeda Principal de Exibição')).toBeVisible();
  });

  test('deve conseguir trocar o idioma nas Preferências', async ({ page }) => {
    await page.click('button:has-text("Preferências")');
    const idiomaSelect = page.locator('select').first();
    await idiomaSelect.selectOption('English (US)');
    await expect(idiomaSelect).toHaveValue('English (US)');
  });

  // --- Aba Dados ---
  test('deve abrir a aba Dados e mostrar as opções', async ({ page }) => {
    await page.click('button:has-text("Dados")');
    await expect(page.locator('text=Backup de Segurança')).toBeVisible();
    await expect(page.locator('text=Exportar JSON')).toBeVisible();
    await expect(page.locator('text=Zona de Perigo')).toBeVisible();
    await expect(page.locator('button:has-text("Limpar Tudo")')).toBeVisible();
  });

  test('deve fazer logout e redirecionar para /auth', async ({ page }) => {
    await page.click('button:has-text("Dados")');
    await page.click('button:has-text("Encerrar Sessão")');
    await expect(page).toHaveURL(/.*auth/, { timeout: 5000 });
  });
});
