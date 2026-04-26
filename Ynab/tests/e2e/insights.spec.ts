import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';

test.describe('Insights', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await page.click('a[href="/insights"]');
    await expect(page.getByRole('heading', { name: 'Insights', level: 1 })).toBeVisible();
  });

  test('deve carregar a página de Insights sem erros', async ({ page }) => {
    await expect(page.locator('text=Evolução do seu patrimônio')).toBeVisible();
  });

  test('deve exibir o card de Evolução do Patrimônio', async ({ page }) => {
    await expect(page.locator('text=Evolução do Patrimônio')).toBeVisible();
    // O gráfico de área (AreaChart) está dentro de um ResponsiveContainer
    await expect(page.locator('.recharts-responsive-container').first()).toBeVisible();
  });

  test('deve exibir o card de Despesas por Categoria', async ({ page }) => {
    await expect(page.locator('text=Despesas por Categoria (Este Mês)')).toBeVisible();
  });

  test('deve mostrar mensagem de sem dados quando não há transações', async ({ page }) => {
    // Novo usuário não tem transações, então o gráfico de pizza mostra estado vazio
    await expect(page.locator('text=Nenhuma despesa registrada neste mês')).toBeVisible();
  });
});
