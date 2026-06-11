# Regras de Rateio (Split Rules) 🔗🤝

As **Regras de Rateio (Split Rules)** do Vault Finance OS permitem simplificar o processo de divisão de despesas recorrentes ou pontuais com seus roommates, parceiros ou amigos. Em vez de calcular manualmente quem deve o quê em cada compra, você pode configurar regras predefinidas de divisão e aplicá-las instantaneamente aos seus lançamentos.

---

## 1. O que são Regras de Rateio?

Uma Regra de Rateio é um modelo de divisão de despesas associado a devedores cadastrados no sistema. Cada regra possui:
* **Nome identificador:** Um nome amigável para a regra (ex: "Aluguel Compartilhado", "Mercado 50/50").
* **Devedores participantes:** As pessoas que dividem a conta com você.
* **Proporções de divisão:** Podem ser baseadas em porcentagem (ex: 50% para cada) ou valores fixos por pessoa.

---

## 2. Operações e Gerenciamento (CRUD)

O sistema agora disponibiliza operações completas de criação, leitura, atualização e exclusão (CRUD) de regras de rateio integradas diretamente ao gerenciador de estado financeiro:

* **Criar Regra:** Permite configurar uma nova regra de rateio do zero, definindo o nome e os itens/devedores associados com suas respectivas porcentagens ou parcelas fixas.
* **Visualizar Regras:** Lista todas as regras disponíveis no seu perfil de usuário para seleção rápida no lançamento de transações.
* **Editar Regra:** Permite ajustar os devedores envolvidos ou recalcular as porcentagens de rateio caso as dinâmicas de divisão de despesas da casa mudem.
* **Excluir Regra:** Remove permanentemente regras obsoletas ou que não são mais utilizadas, limpando as opções no formulário de transações.

---

## 3. Como Utilizar no Lançamento de Transações

Ao registrar qualquer despesa ou receita na tela principal, você pode ativar a opção de rateio de forma simples e dinâmica por item:

1. Ative a opção **"Aplicar Regra de Rateio?"** no formulário.
2. Uma interface de **Itens a Dividir (Reembolsos)** será exibida instantaneamente.
3. Clique em **"Adicionar Produto"** para incluir um novo item na despesa.
4. Preencha a **Descrição do Produto/Despesa**, o **Valor do Item**, a **Qtd. de Pessoas** pela qual dividir e selecione quais **Categorias/Devedores** devem reembolsar (clicando sobre as tags/badges dos participantes).
5. O sistema calcula automaticamente em tempo real a parcela exata que cada pessoa selecionada deverá pagar.
6. A parte correspondente aos devedores gerará títulos de cobrança individuais na fila cronológica de devedores, mantendo o controle total de reembolsos sem poluir o seu saldo do envelope YNAB.
