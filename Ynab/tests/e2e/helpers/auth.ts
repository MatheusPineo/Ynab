import { Page } from '@playwright/test';

// Usuário fixo de teste — criado uma única vez no banco de dados
// Execute uma vez manualmente para criar: POST /api/auth/register/
export const TEST_USER = {
  email: 'e2e_fixed@teste.com',
  password: 'SenhaSegura123',
  name: 'Usuário E2E',
};

/**
 * Faz o registro de um novo usuário único (com timestamp) e retorna as credenciais.
 * Use quando precisar de um usuário NOVO e isolado por teste.
 */
export async function registerAndLogin(page: Page) {
  const uniqueId = Date.now();
  const email = `e2e_${uniqueId}@teste.com`;
  const password = 'SenhaSegura123';

  await page.goto('/auth');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.click('text=Criar agora');
  await page.fill('#name', 'Usuário E2E');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');

  await page.locator('text=Conta criada com sucesso').waitFor({ state: 'visible', timeout: 30000 });

  // Login
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');

  await page.waitForURL(/.*dashboard/, { timeout: 30000 });

  return { email, password };
}
