# Manual de Operação: Inbox IA e Reconciliação Contábil

No centro da filosofia de automação do Vault Finance OS, a coleta de dados e a auditoria histórica andam de mãos dadas. Enquanto a Inteligência Artificial agiliza a alimentação de faturas e comprovantes sem digitação mecânica, a Reconciliação Bancária garante que o sistema reflita, ao centavo, a realidade do mundo exterior.

---

## 1. O Inbox Inteligente com IA Generativa

O módulo de Inbox Inteligente não é apenas um leitor óptico; é uma inteligência generativa (Google Gemini 2.5 Flash) projetada para deduzir o real contexto por trás dos seus gastos.

### Como funciona a Automação:
1. **Captura Visual (Canvas Compression):** Você arrasta um PDF complexo de boleto ou tira a foto de um cupom fiscal amassado do restaurante. O aplicativo mobile processa a imagem localmente (compressão em HTML5 Canvas), removendo excesso de carga e poupando até 96% dos seus dados móveis antes de enviar para a nuvem.
2. **Processamento Assíncrono:** O arquivo chega no backend de forma imediata. O servidor libera o seu dispositivo para você continuar usando o app e passa a análise da imagem para filas em background.
3. **Extração de Parâmetros:** A inteligência do Gemini mapeia os valores numéricos, datas escondidas nos parágrafos e CNPJs envolvidos.
4. **Homologação:** Minutos (ou segundos) depois, a nota aparece na tela de **Inbox** classificada de forma amigável (Staging). Você confere a sugestão da IA de qual banco, valor, e categoria a conta pertencia e clica em **Homologar** e **Lançar**. O lançamento atinge seu saldo real naquele instante.

---

## 2. Processo de Reconciliação Bancária Semanal

A reconciliação (bater extrato) é o pilar da contabilidade exata. Este processo serve para garantir que transações criadas no sistema e as transações reais caídas em débito ou compensadas no banco estejam 100% equiparadas.

### O Fluxo Perfeito de Auditoria:
1. Ao longo da semana, você compra e faz lançamentos na rua. Toda nova transação nasce no sistema com o status **Pendente (`pending`)** ou **Efetivada (`realized`)**, mas ainda não foram auditadas.
2. Sábado pela manhã, você abre o site/app real do seu banco, puxa o Extrato e entra na tela de Detalhes da Conta no Vault.
3. Você clica em **Reconciliar Conta**.
4. O sistema pedirá que você insira o **Saldo Exato** que o seu banco está marcando agora na sua tela (Saldo Real do Banco).
5. Você analisa a lista de transações não reconciliadas do mês. Se a transação no Vault bate exatamente com a linha do extrato do banco de forma correspondente, você marca a caixa como **Compensada (`Cleared`)**.
6. Conforme você vai compensando (clicando), o Vault recalculará o seu sub-saldo provisório. 
7. Se ao fim da conferência do extrato o sub-saldo batido equivaler à meta do "Saldo Exato" informada no início, a contabilidade bateu! Você confirma a operação e encerra a semana.

---

## 3. Ajustes Automáticos e Travamento Blindado (Reconciled)

Se você finalizou todas as marcações e há pequenas discrepâncias (você esqueceu um café de R$ 3,00 e ele não consta nas suas anotações do sistema, mas o banco já debitou), é inútil ficar quebrando a cabeça por dias.

* **Reconciliação Forçada e Ajustes:** Se você bater o martelo para fechar e a matemática não igualar, o Vault Finance OS forçará um *Ajuste de Reconciliação* (Reconciliation Adjustment). Uma nova transação neutra será gerada automaticamente na data de hoje compensando a diferença (positiva ou negativa), absorvendo o baque do RTA e garantindo a paridade para a próxima semana.

### O Status Imutável: Reconciled
Uma vez que as transações foram declaradas como batidas e validadas, elas passam a portar a flag `Reconciled` no banco de dados.

> [!CAUTION]
> Transações e transferências que possuam a tag verde **Reconciliado** tornam-se virtualmente imutáveis. O sistema travará através de travas fortes na ORM do Django (métodos `clean()`, `save()` e `delete()`) qualquer tentativa de exclusão ou alteração de valor nessas transações, prevenindo destruição acidental da sua contabilidade histórica. Para mexer numa transação reconciliada, a conta deve ser forçosamente desreconciliada.
