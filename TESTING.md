# Guia de Testes Automatizados, Cobertura e QA — Vault Finance OS

Este guia estabelece os padrões técnicos, ferramentas e boas práticas de controle de qualidade (QA) do **Vault Finance OS**. Ele serve como instrução técnica detalhada para que novos engenheiros escrevam testes consistentes e mantenham a barra de qualidade e as regras rígidas de cobertura do projeto intactas.

---

## 1. Filosofia de Testes e Pirâmide de QA

No Vault Finance OS, a estabilidade financeira e a exatidão dos saldos são críticas. Adotamos uma estratégia baseada em:

* **Isolamento de Estado:** Testes unitários puros para lógicas puras (arredondamento, conversão cambial, formatação).
* **Testes de Integração:** Validação da árvore de categorias recursiva, fluxo de caixa e transações recorrentes.
* **Mocks de Fronteira:** Isolamento estrito de requisições de rede HTTP no frontend e interações com serviços terceiros de autenticação (MFA/Google) no backend.

---

## 2. Testes do Backend (Django + Pytest)

O backend utiliza o framework **pytest** integrado com o `pytest-django` para simplificar e acelerar a validação das tabelas relacionais e regras de negócios.

### A. Como criar testes para noções recursivas de saldos e transações
Os testes de herança recursiva de saldos devem garantir que transações criadas em subcontas propaguem corretamente para suas contas mestre, mas que transações futuras ou pendentes sejam isoladas das somatórias de liquidez líquida.

#### Exemplo de Teste de saldo recursivo (`test_accounts.py`):

```python
import pytest
from decimal import Decimal
from datetime import date
from finance.models import Account, Transaction

@pytest.mark.django_db
class TestAccountRecursion:
    def test_recursive_balance_summation(self, authenticated_client, test_user):
        """
        Garante que transações criadas em contas filhas alterem o saldo individual 
        e o saldo consolidado de contas superiores (pais).
        """
        # 1. Cria a Conta Mestre (Pai)
        parent_account = Account.objects.create(
            user=test_user,
            name="Ativos Globais",
            currency="BRL",
            balance=Decimal('0.00')
        )
        
        # 2. Cria a Subconta (Filha)
        child_account = Account.objects.create(
            user=test_user,
            name="Nubank Corrente",
            currency="BRL",
            balance=Decimal('0.00'),
            parent=parent_account
        )
        
        # 3. Cria uma transação realizada na conta filha
        Transaction.objects.create(
            account=child_account,
            description="Aporte Mensal",
            amount=Decimal('1500.00'),
            date=date.today(),
            is_income=True,
            status='realized',
            is_applied_to_balance=True
        )
        
        # Atualiza saldos em lote
        child_account.refresh_from_db()
        parent_account.refresh_from_db()
        
        # 4. Asserções (Validação)
        assert child_account.balance == Decimal('1500.00')
        
        # Nota: O saldo direto do pai continua 0, mas a lógica de consolidação acumula
        assert parent_account.balance == Decimal('0.00')
        assert parent_account.get_consolidated_balance() == Decimal('1500.00')
```

### B. Como testar uploads de mídias e arquivos (`test_icons.py`)

Para testar endpoints de upload que lidam com arquivos em lote ou Multipart Form Data (como ícones de contas ou fotos de avatar), utilize a classe `SimpleUploadedFile` do Django para criar arquivos simulados na memória:

```python
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

def test_icon_upload_endpoint(self):
    # Cria uma imagem fictícia de 1 pixel em memória para fins de teste
    image_data = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4'
        b'\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    fake_file = SimpleUploadedFile("test_icon.png", image_data, content_type="image/png")
    
    response = self.client.post(
        '/api/icons/upload/',
        {'file': fake_file},
        format='multipart'
    )
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertIn('url', response.json())
```

### C. Execução e Relatórios de Cobertura (Backend)

Para verificar quais partes do código Django não estão cobertas por testes, utilizamos o pacote `pytest-cov`.

* **Comando para rodar a suíte completa de testes:**
  ```bash
  cd backend
  venv\Scripts\pytest
  ```
* **Comando para gerar relatório de cobertura no terminal:**
  ```bash
  pytest --cov=core --cov=finance
  ```
* **Comando para gerar relatório detalhado em HTML:**
  ```bash
  pytest --cov=core --cov=finance --cov-report=html
  ```
  * *Uso:* Abra o arquivo `backend/htmlcov/index.html` em seu navegador para inspecionar visualmente quais linhas de código (views, serializadores, actions de transbordo) ainda precisam de testes.

---

## 3. Testes do Frontend (React + Vitest)

O frontend adota o **Vitest** (executor de testes integrado ao Vite, extremamente veloz) e o **React Testing Library** para validação de fluxos de renderização e reatividade de dados. Atualmente a suíte conta com **30 de 30 testes passando no verde**, incluindo a blindagem da página de Cartões de Crédito (`CreditCards.test.tsx`) e modais de transação.

### A. Como Mockar Chamadas de Rede da API

Para isolar o frontend de requisições de servidores de staging ou produção durante os testes, utilizamos interceptações e mocks via Vitest mocks ou MSW (Mock Service Worker).

#### Exemplo de Mock de chamadas HTTP (`useCurrencyStore.test.ts`):

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCurrencyStore } from "@/store/useCurrencyStore";

describe("useCurrencyStore - Mocks de Rede", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useCurrencyStore.setState({
      rates: { EUR: 1, BRL: 6.0, USD: 1.08 },
      isLoading: false,
    });
  });

  it("deve buscar taxas de câmbio da API de forma segura simulando sucesso", async () => {
    // 1. Simula (Mock) a resposta da API externa de câmbio
    const fakeResponse = {
      rates: {
        EUR: 1,
        BRL: 5.5,
        USD: 1.10,
      },
    };
    
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(fakeResponse),
    } as any);

    // 2. Executa a action do Zustand
    await useCurrencyStore.getState().fetchRates();

    // 3. Valida os efeitos no estado global do app
    expect(useCurrencyStore.getState().rates.BRL).toBe(5.5);
    expect(useCurrencyStore.getState().rates.USD).toBe(1.10);
    expect(useCurrencyStore.getState().isLoading).toBe(false);
  });
});
```

#### Exemplo de teste de Componente Visual com Mock de Rotas e Temas:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EmptyState } from "@/components/ui/EmptyState";

describe("Componente EmptyState", () => {
  it("deve renderizar o título e descrição corretamente na interface", () => {
    render(
      <EmptyState 
        title="Nenhuma Conta Encontrada" 
        description="Comece adicionando uma carteira ou subconta financeira." 
      />
    );

    expect(screen.getByText("Nenhuma Conta Encontrada")).toBeDefined();
    expect(screen.getByText("Comece adicionando uma carteira ou subconta financeira.")).toBeDefined();
  });
});
```

### B. Execução e Relatórios de Cobertura (Frontend)

Para mensurar e validar a cobertura do frontend com o Vitest:

* **Comando para rodar a suíte completa de testes (Modo Interativo):**
  ```bash
  cd Ynab
  npm run test
  ```
* **Comando para rodar testes apenas uma vez (Modo CI/CD):**
  ```bash
  cd Ynab
  npm run test -- --run
  ```
* **Comando para gerar cobertura de código via terminal:**
  ```bash
  npm run test -- --coverage
  ```
  * *Ferramenta utilizada:* O Vitest utiliza o `@vitest/coverage-v8` para analisar as linhas cobertas da interface e de stores do Zustand, expondo arquivos vulneráveis à regressões visuais.

---

## 4. O Checklist do Desenvolvedor Inteligente

Toda vez que uma nova funcionalidade for desenvolvida, certifique-se de que a cobertura não sofreu regressões. Siga estes passos antes de abrir um PR:

1. **Desenvolveu lógica de saldo no backend?** Escreva testes unitários cobrindo o `refresh_from_db()` no `finance/test_accounts.py` ou `finance/test_transactions.py`.
2. **Adicionou um seletor visual ou painel no React?** Crie um teste de renderização no diretório `src/test/components/` validando o comportamento de clique e visibilidade de strings de texto.
3. **Validou os Mocks de Rede?** Verifique se nenhum teste depende de uma conexão real à internet ou banco de dados externo ativo.
