import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';

test.describe('Metas', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await page.click('a[href="/goals"]');
    await expect(page.getByRole('heading', { name: 'Metas e Objetivos', level: 1 })).toBeVisible();
  });

  test('deve carregar a página de Metas com estado vazio', async ({ page }) => {
    await expect(page.locator('text=Você ainda não tem metas')).toBeVisible();
    await expect(page.locator('button:has-text("Nova Meta")')).toBeVisible();
  });

  test('deve criar uma nova meta e exibi-la', async ({ page }) => {
    const deadline = new Date();
    deadline.setFullYear(deadline.getFullYear() + 1);
    const deadlineStr = deadline.toISOString().split('T')[0];

    await page.click('button:has-text("Nova Meta")');
    await expect(page.locator('text=Criar Novo Objetivo')).toBeVisible();

    await page.fill('input#name', 'Viagem para o Japão');
    await page.fill('input#target', '5000');
    await page.fill('input#current', '500');
    await page.fill('input#deadline', deadlineStr);
    await page.click('button:has-text("Salvar Meta")');

    await expect(page.locator('text=Viagem para o Japão')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=10%')).toBeVisible(); // 500/5000 = 10%
  });

  test('deve mostrar o progresso correto na meta', async ({ page }) => {
    const deadline = new Date();
    deadline.setFullYear(deadline.getFullYear() + 1);
    const deadlineStr = deadline.toISOString().split('T')[0];

    await page.click('button:has-text("Nova Meta")');
    await page.fill('input#name', 'Carro Novo');
    await page.fill('input#target', '20000');
    await page.fill('input#current', '10000');
    await page.fill('input#deadline', deadlineStr);
    await page.click('button:has-text("Salvar Meta")');

    await expect(page.locator('text=Carro Novo')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=50%')).toBeVisible(); // 10000/20000 = 50%
    await expect(page.locator('text=Alvo:')).toBeVisible();
  });

  test('deve excluir uma meta', async ({ page }) => {
    const deadline = new Date();
    deadline.setFullYear(deadline.getFullYear() + 1);
    const deadlineStr = deadline.toISOString().split('T')[0];

    await page.click('button:has-text("Nova Meta")');
    await page.fill('input#name', 'Meta para Deletar');
    await page.fill('input#target', '100');
    await page.fill('input#deadline', deadlineStr);
    await page.click('button:has-text("Salvar Meta")');
    await expect(page.locator('text=Meta para Deletar')).toBeVisible({ timeout: 5000 });

    // Hover no card para revelar o botão de lixeira
    await page.locator('div:has-text("Meta para Deletar") h3, h3:has-text("Meta para Deletar")').first().hover();
    
    // Confirma o diálogo de exclusão
    page.on('dialog', d => d.accept());
    await page.locator('[data-radix-popper-content-wrapper], article, .group').filter({ hasText: 'Meta para Deletar' })
      .locator('button').filter({ has: page.locator('svg') }).last().click();

    await expect(page.locator('text=Meta para Deletar')).not.toBeVisible({ timeout: 5000 });
  });
});
