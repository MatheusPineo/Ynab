/**
 * @file index.ts
 * @description Definições de tipo TypeScript oficiais do ecossistema Vault Finance OS.
 * Fornece tipagem estrita de ponta a ponta e JSDoc em Português para documentação dinâmica no editor.
 */

/**
 * Representa os estados possíveis de conciliação de uma transação.
 * - `"realized"`: Transação concluída e conciliada, afetando o saldo imediato se a data for menor ou igual a hoje.
 * - `"pending"`: Transação agendada ou temporária, não afeta o balanço líquido atual.
 */
export type TransactionStatus = "realized" | "pending";

/**
 * Código de moeda ISO de 3 caracteres (ex: "USD", "BRL", "EUR").
 */
export type Currency = string;

/**
 * Intervalos válidos para templates de transações agendadas e recorrentes.
 */
export type RecurrenceInterval = "daily" | "weekly" | "monthly" | "yearly";

/**
 * Representa um Usuário do sistema (User nativo do Django).
 */
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Representa o perfil complementar do usuário, incluindo preferências regionais e dados de segurança 2FA.
 */
export interface UserProfile {
  id: number;
  user: number; // ID do Usuário associado
  bio: string;
  avatar_url: string | null;
  /** Indica se a Autenticação de Dois Fatores está ativada no perfil do usuário */
  two_factor_enabled: boolean;
  /** Código de moeda padrão de preferência (ex: "BRL") */
  preferred_currency: Currency;
  /** Idioma de preferência para o dashboard (ex: "pt-BR", "en-US") */
  language: string;
  created_at: string;
  updated_at: string;
}

/**
 * Contrato de retorno para o início de configuração do 2FA.
 */
export interface TwoFactorSetupResponse {
  /** O segredo em Base32 compartilhado com o Authenticator do usuário */
  secret: string;
  /** URI para geração de QR Code de pareamento automático */
  provisioning_uri: string;
}

/**
 * Representa uma Conta Financeira (ou Envelope) estruturada de forma recursiva.
 */
export interface AccountNode {
  id: string;
  name: string;
  /** Tipo de Conta:checking (Corrente), savings (Poupança), credit_card (Cartão), investment (Investimento) */
  account_type: "checking" | "savings" | "credit_card" | "investment" | "LOAN_GIVEN";
  /** Código da moeda na qual a conta é operada */
  currency: Currency;
  /** Saldo atualizado da conta líquido de transações aplicadas */
  balance: number;
  /** URL opcional do ícone estilizado da conta */
  icon_url: string | null;
  /** ID da conta pai. Se null, define uma Conta Mestre (Root Account) */
  parent: string | null;
  /** Lista recursiva de subcontas filhas vinculadas */
  children?: AccountNode[];
  /** Teto de saldo opcional que ativa o gatilho de transbordo e distribuição de excedentes */
  ceiling: number | null;
  /** Se true, o saldo desta conta/subconta não é computado na soma mestre e nem nos totais do dashboard */
  exclude_from_totals?: boolean;
  actual_balance?: number;
  reserved_credit_balance?: number;
  available_balance?: number;
  pending_restitutions_total?: number;
  debtors_summary?: { debtor_name: string; amount: number }[];
  bank_domain?: string;
  bank_logo_url?: string;
}

/**
 * Representa uma Categoria de Orçamento (Envelope de Gastos YNAB) com suporte a recursão hierárquica.
 */
export interface CategoryNode {
  id: string;
  name: string;
  /** Valor monetário alocado/planejado para esta categoria no mês visualizado */
  assigned_amount: number;
  /** Montante total acumulado gasto por despesas vinculadas no mês visualizado */
  spent_amount: number;
  /** ID da categoria pai. Se null, define um Grupo de Categorias mestre */
  parent: string | null;
  macro_allocation?: 'NEEDS' | 'WANTS' | 'SAVINGS' | 'NONE';
  /** Subcategorias ou envelopes filhos vinculados */
  children?: CategoryNode[];
}

/**
 * Alias semântico para um Grupo de Categorias raiz.
 */
export type CategoryGroup = CategoryNode;

/**
 * Dotação Orçamentária Mensal de uma Categoria.
 */
export interface MonthlyBudget {
  id: number;
  category: string; // ID da Categoria
  month: number; // 1-12
  year: number;
  /** Valor alocado no orçamento */
  amount: number;
}

/**
 * Representa uma Transação Financeira (Receita, Despesa ou Transferência Coordenada).
 */
export interface Transaction {
  id: string;
  /** ID da conta à qual a transação pertence */
  account: string;
  /** ID da categoria à qual a transação pertence (opcional para receitas) */
  category?: string | null;
  /** Montante monetário da transação */
  amount: number;
  /** Descrição textual ou histórico da movimentação */
  description: string;
  /** Data de execução (YYYY-MM-DD) */
  date: string;
  /** Indica se é uma Receita (true) ou Despesa (false) */
  is_income: boolean;
  /** Indica se esta transação originou-se de um agendamento recorrente */
  is_recurring: boolean;
  /** Intervalo de repetição automática da transação agendada */
  recurrence_interval?: RecurrenceInterval | null;
  /** Próxima data agendada para criação automática da transação */
  next_recurrence_date?: string | null;
  /** Vínculo para a transação "template" que gerou esta ocorrência */
  recurring_parent?: string | null;
  /** Marca se esta ocorrência específica foi "pulada" ou "excluída" */
  is_recurrence_exception?: boolean;
  status: TransactionStatus;
  /** Indica se a transação já alterou o saldo real da conta associada */
  is_applied_to_balance: boolean;
  /** UUID compartilhado por transações de transferência ou distribuições complexas para exclusão em cascata */
  transfer_group?: string | null;
  created_at?: string;
}

/**
 * Representa um Objetivo Financeiro (Meta de Poupança ou Investimento).
 */
export interface Goal {
  id: string;
  name: string;
  /** Valor total desejado a ser alcançado */
  target_amount: number;
  /** Montante poupado e alocado para esta meta até o momento */
  current_amount: number;
  currency: Currency;
  /** Data limite opcional para cumprimento da meta (YYYY-MM-DD) */
  deadline: string | null;
  /** Emoji representativo para visualização lúdica */
  emoji: string;
  created_at: string;
}

/**
 * Representa um modelo/template para distribuição rápida e automatizada de receitas recebidas.
 */
export interface DistributionTemplate {
  id: number;
  name: string;
  created_at: string;
  items: DistributionTemplateItem[];
}

/**
 * Item de partilha dentro de um template de distribuição.
 */
export interface DistributionTemplateItem {
  id: number;
  template: number; // ID do template associado
  account: string; // ID da conta que receberá a fração
  /** Porcentagem do montante total a ser alocada (ex: 20.00 para 20%) */
  percentage: number | null;
  /** Valor absoluto fixo a ser alocado (ex: 150.00 para R$ 150) */
  fixed_amount: number | null;
}

/**
 * Representa uma dívida registrada no sistema.
 */
export interface Debt {
  id: number;
  /** Nome da contraparte (credor ou devedor) */
  counterparty_name: string;
  /** Montante inicial total da dívida */
  original_amount: number;
  currency: Currency;
  /** Se true, eu devo para a contraparte (Despesa Futura). Se false, a contraparte me deve (Receita Futura). */
  is_mine: boolean;
  notes: string;
  created_at: string;
  /** Pagamentos parciais ou totais realizados vinculados à dívida */
  payments?: DebtPayment[];
}

/**
 * Registro de amortização ou pagamento parcial de uma dívida.
 */
export interface DebtPayment {
  id: number;
  debt: number; // ID da Dívida associada
  /** Montante amortizado no pagamento */
  amount: number;
  /** Data do pagamento (YYYY-MM-DD) */
  date: string;
  /** ID da conta bancária de onde saíram/entraram os recursos */
  account: string | null;
  /** ID da transação correspondente gerada no fluxo de caixa */
  transaction: string | null;
  created_at: string;
}
