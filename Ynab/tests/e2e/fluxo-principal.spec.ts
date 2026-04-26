import { test, expect } from '@playwright/test';

test.describe('Fluxo Principal do Usuário', () => {
  const uniqueId = Date.now();
  const email = `user_${uniqueId}@teste.com`;
  const password = 'SenhaSegura123';

  test('deve registrar, logar e criar uma transação com sucesso', async ({ page }) => {
    // 1. Registro
    await page.goto('/auth');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    await page.click('text=Criar agora');
    await page.fill('#name', 'Usuário Teste');
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');

    // Espera o toast de sucesso do registro e a mudança para tela de login
    // Aumentamos o timeout para 10s caso o backend demore a responder
    const successToast = page.locator('text=Conta criada com sucesso');
    const errorToast = page.locator('text=Failed to fetch');
    
    await Promise.race([
        successToast.waitFor({ state: 'visible', timeout: 15000 }),
        errorToast.waitFor({ state: 'visible', timeout: 15000 }).then(() => {
            throw new Error('O Backend não está rodando ou não está acessível (Failed to fetch)');
        })
    ]);
    
    // 2. Login
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');

    // 3. Verificar Dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
    await expect(page.getByText('Vault', { exact: true })).toBeVisible();
    await expect(page.getByText('Minhas contas')).toBeVisible();

    // 4. Criar uma Conta (necessário para ter transações)
    await page.click('button:has-text("Nova Conta")');
    await page.fill('input#name', 'Minha Carteira');
    await page.fill('input#balance', '1000'); // Saldo inicial
    await page.click('button:has-text("Criar Conta")');
    
    await expect(page.locator('span.truncate:has-text("Minha Carteira")')).toBeVisible();

    // 5. Adicionar uma Transação
    // Abre o modal diretamente do header do Dashboard (sem navegar para outra página)
    // Isso garante que as contas já estão no estado do Zustand
    const headerTransactionBtn = page.locator('header button:has-text("Nova transação"), banner button:has-text("Nova transação")').first();
    await headerTransactionBtn.click();
    
    // Modal abre - preenche os campos
    await page.fill('input#description', 'Venda de Item');
    await page.fill('input#amount', '250');
    await page.selectOption('select#type', 'income');
    await page.selectOption('select#account', { label: 'Minha Carteira' });
    await page.click('button:has-text("Salvar Transação")');

    // 6. Navega para /transactions e verifica se a transação aparece
    await page.click('a[href="/transactions"]');
    await expect(page.getByRole('heading', { name: 'Transações', level: 1 })).toBeVisible();
    await expect(page.locator('text=Venda de Item')).toBeVisible();
    await expect(page.locator('text=250')).toBeVisible();
  });
});
