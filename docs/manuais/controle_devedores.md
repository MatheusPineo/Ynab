# Controle de Devedores (Divisão de Despesas e Motor FIFO) 👥💰

O Vault Finance OS possui um sistema completo e granular para gerenciar despesas compartilhadas (como contas divididas com colegas de quarto ou amigos). Em vez de anotações soltas, você pode cadastrar devedores (roommates) e associar itens de dívida individuais vinculados aos seus envelopes de orçamento, com liquidação automatizada em fila cronológica.

---

## 1. O que são os Devedores e Itens de Dívida?

* **Devedor (Debtor/Roommate):** Representa o perfil de uma pessoa que divide despesas com você (ex: "Davi", "Miguel").
* **Itens de Dívida (DebtItem):** Lançamentos específicos de despesas que essa pessoa deve a você. Cada item possui:
  * **Envelope de Origem (Subaccount):** O envelope de onde saiu o dinheiro originalmente (ex: *Mercado*, *Lazer*).
  * **Produto/Serviço:** Descrição do gasto (ex: "Detergente", "Amaciante").
  * **Valor Total:** O valor devido pela pessoa.
  * **Valor Pago:** O quanto já foi amortizado (inicia em 0,00).
  * **Status:** Transiciona automaticamente entre `PENDING` (Pendente), `PARTIAL` (Parcialmente Pago) e `SETTLED` (Totalmente Quitado).

---

## 2. Como Funciona a Visualização Agrupada?

Na interface do usuário, as dívidas de um devedor não são mostradas apenas como uma lista gigante e desorganizada. O sistema realiza uma **Agregação por Envelope (Origin Subaccount)**:
1. **Agrupamento por Categoria:** Os débitos são divididos por envelopes de origem (ex: todas as compras de supermercado ficam sob "Mercado", despesas de luz ficam sob "Contas de Consumo").
2. **Saldo Total Pendente:** Para cada grupo/envelope, o sistema calcula a soma exata dos valores que ainda restam ser pagos.
3. **Itens Underlying:** Dentro de cada grupo, você pode expandir para ver a listagem detalhada de cada produto ou serviço individual, com suas respectivas datas e status.

---

## 3. O Motor de Pagamento FIFO Agrupado (First-In, First-Out)

Ao receber um valor pago pelo devedor direcionado a um envelope específico, o sistema executa um fluxo automatizado e atômico no banco de dados para garantir que você não precise gerenciar qual item pagar manualmente:

1. **Injeção de Saldo (Recuperação do Envelope):** O valor recebido (ex: 30€) é injetado diretamente de volta no saldo do envelope correspondente (ex: *Mercado*). Isso "cura" o envelope que sofreu o gasto inicial, devolvendo o dinheiro para o seu orçamento disponível.
2. **Lançamento no Livro Razão (Ledger):** Uma transação de receita (Income) é criada automaticamente no histórico do envelope, registrando o fluxo e identificando o devedor.
3. **Fila FIFO Cronológica:** O sistema busca todas as dívidas pendentes ou parciais daquele devedor naquele envelope, ordenando-as da mais antiga para a mais recente (`date_created` ASC).
4. **Dedução Sequencial:** O valor recebido é amortizado de item em item na ordem de criação:
   * Quita totalmente as dívidas mais antigas (mudando para `SETTLED`).
   * Caso o saldo acabe no meio de uma dívida, amortiza o máximo possível, deixando-a como `PARTIAL` com o saldo restante atualizado.
   * Quaisquer dívidas posteriores da fila permanecem inalteradas até o próximo pagamento.

Esse comportamento garante integridade matemática absoluta, mantendo o histórico de caixa e envelopes perfeitamente auditável e reconciliado.

---

## 4. Cadastro de Itens em Lote (Bulk Creation)

Para agilizar o fluxo de divisão de compras detalhadas (como notas longas de supermercado em que cada colega de quarto comprou itens específicos), o sistema dispõe do endpoint `/api/debtors/{id}/add_items/`:
1. **Payload Estruturado:** O frontend envia a ID do envelope (`subaccount_id`) e uma lista contendo os produtos e seus respectivos valores totais: `[{"product_name": "Sabão em Pó", "total_amount": 15.50}, ...]`.
2. **Registro e Rastreamento:** O serviço `register_itemized_debts` cria e persiste de forma atômica cada registro como `PENDING` (Pendente) com `paid_amount=0.00`.
3. **Não-duplicação de Débito:** Importante ressaltar que este serviço **NÃO** subtrai saldo do envelope ou da conta física novamente. Ele apenas cria os títulos de controle de dívida. O débito financeiro real do envelope já foi registrado anteriormente quando você lançou a transação global da compra (ex: o gasto de 100€ pago no caixa do mercado).

---

## 5. Edição Inline e Seletor de Contas Global

Para facilitar a manutenção dos registros de dívidas, a interface oferece recursos práticos de edição direta nos cards de dívidas:
* **Alteração de Subconta (Envelope):** Ao clicar no nome da subconta/envelope associado à dívida, o sistema abre o **Seletor de Contas Global**, permitindo buscar por nome e reassociar o lançamento a outro envelope de forma instantânea (disponível para itens de dívida individuais).
* **Edição de Valor:** Ao dar um duplo clique no valor pendente da dívida, um campo numérico é exibido para alteração rápida. Pressione *Enter* para salvar.
* **Exclusão de Dívidas:** Um botão de lixeira (ícone de lixo) está disponível ao lado de cada linha, permitindo remover o registro e reverter automaticamente seu peso financeiro no saldo dos envelopes.
