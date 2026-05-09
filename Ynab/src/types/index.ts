export type TransactionStatus = "realized" | "pending";
export type Currency = string;

export interface Transaction {
  id: string;
  account: string; // ID da conta (relacionamento no Django)
  description: string;
  amount: number;
  date: string;
  is_income: boolean;
  category?: string; // ID da categoria
  status: TransactionStatus;
  is_recurring?: boolean;
  recurrence_interval?: "daily" | "weekly" | "monthly" | "yearly";
  next_recurrence_date?: string;
  created_at?: string;
}

export interface AccountNode {
  id: string;
  name: string;
  currency?: Currency;
  balance?: number;
  icon_url?: string;
  parent?: string | null;
  children?: AccountNode[];
  ceiling?: number | null;
}

export interface CategoryNode {
  id: string;
  name: string;
  assigned_amount: number;
  spent_amount: number;
  parent: string | null;
  children?: CategoryNode[];
}

export type CategoryGroup = CategoryNode;

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  currency: Currency;
  deadline: string | null;
  emoji: string;
}
