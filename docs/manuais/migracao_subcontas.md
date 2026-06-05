# Guia de Transição: Migração de Sub-contas para Categorias (Metodologia YNAB)

Para modernizar o gerenciamento do seu dinheiro e adotar o modelo puro de orçamento por envelopes (YNAB), o Vault Finance OS conta com uma ferramenta automatizada para transformar as suas antigas "Sub-contas" em "Categorias de Orçamento" (Envelopes).

Este guia explica como a migração funciona, as fases do processo técnico de segurança e como executar o comando no servidor.

---

## 1. Por que migrar de Sub-contas para Categorias?

No modelo antigo de "Sub-contas", você criava divisões fictícias dentro de uma conta bancária (ex: "Nubank > Crunchyroll", "Nubank > Google One"). Isso gerava complexidade desnecessária e dificultava a conciliação do extrato real do banco.

No modelo YNAB de envelopes:
* **Conta Única no Banco:** Suas contas representam exatamente a realidade física do seu extrato bancário (ex: conta Nubank com saldo consolidado de R$ 5.000,00).
* **Envelopes Virtuais:** O seu dinheiro é dividido em categorias de orçamento ("Aluguel", "Google One", "Streaming").
* **Separação de Preocupações:** O dinheiro fica guardado em um só lugar físico no banco, mas ganha propósitos diferentes e flexíveis na tela de orçamento.

---

## 2. Como funciona o Processo de Migração

A migração é dividida em 3 fases automatizadas executadas sequencialmente em uma única transação segura:

### 🚀 Phase 1: Clonagem
* Identifica todas as sub-contas (contas vinculadas a uma conta-mãe).
* Cria um novo grupo de categorias chamado **"Sub-contas Migradas"** para cada usuário.
* Dentro deste grupo, clona cada sub-conta como uma nova Categoria YNAB (ex: `Nubank > Crunchyroll`).
* Se a sub-conta tinha um limite ou teto definido, ele é convertido automaticamente na meta mensal (`target_value`) da nova categoria.

### 🔗 Phase 2: Re-vínculo (Rebinding) de Transações
* Varre todo o histórico financeiro e re-aponta transações e regras.
* As movimentações de gastos que apontavam para a sub-conta antiga passam a apontar para a conta-mãe real (mantendo a integridade do extrato físico) e recebem a classificação da nova Categoria (envelope).
* O script re-vincula com precisão:
  1. Transações simples (`Transaction`)
  2. Compras parceladas no cartão (`CreditCardTransaction`)
  3. Lançamentos de parcelas (`Installment`)
  4. Controles de dívidas (`DebtItem`)
  5. Itens de modelos de distribuição (`DistributionTemplateItem`)
  6. Regras de preenchimento inteligente via IA (`LearnedTransactionRule`)

### 🧹 Phase 3: Purge Seguro (Limpeza Automática)
* Remove as sub-contas antigas do banco de dados para limpar a interface.
* **Segurança contra restrições:** Se uma sub-conta ainda possuir qualquer vínculo externo não migrável (como um plano de pagamento protegido), a deleção é pulada para esta conta específica e um aviso informativo é gerado contendo os objetos pendentes. O script continua a execução das outras deleções sem quebrar o sistema.

---

## 3. Segurança e Simulação (Dry-Run)

Para garantir que a migração ocorra sem sustos, o sistema traz duas travas de segurança fundamentais:

1. **Rollback Automático:** Toda a migração roda dentro de uma transação de banco de dados (`transaction.atomic()`). Se qualquer erro grave ocorrer no meio do processo, o banco reverte tudo instantaneamente ao estado anterior.
2. **Modo Simulação (Dry-Run):** Permite simular toda a migração e conferir o relatório detalhado de quantas contas e transações seriam afetadas, sem realizar nenhuma alteração física no banco.

---

## 4. Como Executar a Migração

O comando deve ser executado no console do servidor (terminal do backend). 

### Passo 1: Simular a migração (Altamente Recomendado)
Execute o comando abaixo para visualizar o relatório de tudo que será processado:
```bash
python manage.py migrate_subaccounts --dry-run
```

### Passo 2: Executar a migração de fato
Após validar no relatório do Dry-Run que tudo está correto, rode o comando sem a flag de simulação para gravar as alterações:
```bash
python manage.py migrate_subaccounts
```

### Opcional: Migrar um usuário específico
Caso queira rodar a migração de forma isolada apenas para um usuário (útil para testes em produção), utilize a flag `--user-id`:
```bash
python manage.py migrate_subaccounts --user-id=194
```
