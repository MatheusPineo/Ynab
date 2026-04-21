import {
  Wallet,
  PiggyBank,
  CreditCard,
  Landmark,
  Bitcoin,
  ShoppingBag,
  UtensilsCrossed,
  Car,
  Home,
  Sparkles,
  Plane,
  Film,
  Dumbbell,
  Briefcase,
} from "lucide-react";

/* ============================================================
   YNAB-style recursive accounts tree
   ============================================================ */

export type Currency = "EUR" | "BRL" | "USD";

export interface Transaction {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  date: string;
  category?: string;
}

export interface AccountNode {
  id: string;
  name: string;
  /** Currency only set on master/intermediate nodes — leaves inherit from parent */
  currency?: Currency;
  type?: "master";
  /** Only on leaves */
  balance?: number;
  /** Target / base amount for the leaf — used to show % variance */
  base?: number;
  children?: AccountNode[];
}

export const accountsTree: AccountNode[] = [
  {
    id: "1",
    name: "Novo Banco",
    currency: "EUR",
    type: "master",
    children: [
      {
        id: "1-1",
        name: "Matheus",
        currency: "EUR",
        children: [
          { id: "1-1-1", name: "Aposentadoria", balance: 1000, base: 1200 },
          { id: "1-1-2", name: "Cinema", balance: 50, base: 40 },
          { id: "1-1-3", name: "Jogos", balance: 120, base: 100 },
        ],
      },
      {
        id: "1-2",
        name: "Egberto",
        currency: "EUR",
        children: [
          { id: "1-2-1", name: "Uber", balance: 80, base: 100 },
          { id: "1-2-2", name: "Viagem Brasil", balance: 2500, base: 3000 },
          { id: "1-2-3", name: "Dentista", balance: 150, base: 150 },
        ],
      },
      {
        id: "1-3",
        name: "Casa",
        currency: "EUR",
        children: [
          { id: "1-3-1", name: "Água", balance: 40, base: 50 },
          { id: "1-3-2", name: "Energia", balance: 90, base: 80 },
          { id: "1-3-3", name: "Arrendamento", balance: 800, base: 800 },
          { id: "1-3-4", name: "Mercado", balance: 400, base: 250 },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "Nubank",
    currency: "BRL",
    type: "master",
    children: [
      { id: "2-1", name: "Aposentadoria", balance: 5000, base: 6000 },
      { id: "2-2", name: "Implante Capilar", balance: 15000, base: 15000 },
      { id: "2-3", name: "Implante Dentário", balance: 8000, base: 10000 },
      { id: "2-4", name: "Lasik", balance: 6500, base: 5000 },
    ],
  },
];

/* Fixed mock FX rates relative to EUR */
const RATES_TO_EUR: Record<Currency, number> = {
  EUR: 1,
  BRL: 0.16,
  USD: 0.92,
};

export function convert(amount: number, from: Currency, to: Currency): number {
  const inEur = amount * RATES_TO_EUR[from];
  return inEur / RATES_TO_EUR[to];
}

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  EUR: "€",
  BRL: "R$",
  USD: "$",
};

export const CURRENCY_LOCALE: Record<Currency, string> = {
  EUR: "pt-PT",
  BRL: "pt-BR",
  USD: "en-US",
};

export function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function sumNode(node: AccountNode): number {
  if (typeof node.balance === "number") return node.balance;
  if (!node.children) return 0;
  return node.children.reduce((acc, c) => acc + sumNode(c), 0);
}

export function nodeCurrency(node: AccountNode, parentCurrency?: Currency): Currency {
  return node.currency ?? parentCurrency ?? "EUR";
}

export function totalsByCurrency(tree: AccountNode[]): Record<Currency, number> {
  const totals: Record<Currency, number> = { EUR: 0, BRL: 0, USD: 0 };
  const walk = (node: AccountNode, inherited: Currency) => {
    const cur = nodeCurrency(node, inherited);
    if (typeof node.balance === "number") {
      totals[cur] += node.balance;
    }
    node.children?.forEach((c) => walk(c, cur));
  };
  tree.forEach((root) => walk(root, nodeCurrency(root)));
  return totals;
}

export function netWorth(tree: AccountNode[], base: Currency): number {
  const totals = totalsByCurrency(tree);
  return (Object.entries(totals) as [Currency, number][]).reduce(
    (acc, [cur, amount]) => acc + convert(amount, cur, base),
    0,
  );
}

/* ============================================================
   Legacy mocks (kept for any leftover references; safe to remove later)
   ============================================================ */

export type Account = {
  id: string;
  name: string;
  type: "checking" | "savings" | "credit" | "investment" | "crypto";
  bank: string;
  balance: number;
  currency: string;
  icon: typeof Wallet;
  accent: "primary" | "secondary" | "info" | "warning";
  last4: string;
};

export const accounts: Account[] = [
  { id: "a1", name: "Conta Principal", type: "checking", bank: "Nubank", balance: 12480.55, currency: "BRL", icon: Wallet, accent: "primary", last4: "4521" },
  { id: "a2", name: "Reserva de Emergência", type: "savings", bank: "Inter", balance: 28900.0, currency: "BRL", icon: PiggyBank, accent: "secondary", last4: "0098" },
  { id: "a3", name: "Cartão Black", type: "credit", bank: "Itaú", balance: -3284.12, currency: "BRL", icon: CreditCard, accent: "warning", last4: "8821" },
  { id: "a4", name: "Investimentos", type: "investment", bank: "XP", balance: 84210.32, currency: "BRL", icon: Landmark, accent: "info", last4: "1140" },
  { id: "a5", name: "Cripto Wallet", type: "crypto", bank: "Binance", balance: 6720.88, currency: "BRL", icon: Bitcoin, accent: "warning", last4: "BTC" },
];

export type Category = { id: string; name: string; budgeted: number; spent: number; icon: typeof ShoppingBag; color: string };
export const categories: Category[] = [
  { id: "c1", name: "Alimentação", budgeted: 1800, spent: 1240, icon: UtensilsCrossed, color: "158 70% 60%" },
  { id: "c2", name: "Moradia", budgeted: 3500, spent: 3500, icon: Home, color: "268 60% 70%" },
  { id: "c3", name: "Transporte", budgeted: 900, spent: 612, icon: Car, color: "210 90% 65%" },
  { id: "c4", name: "Lazer", budgeted: 1200, spent: 980, icon: Film, color: "38 92% 60%" },
  { id: "c5", name: "Compras", budgeted: 800, spent: 1120, icon: ShoppingBag, color: "0 70% 65%" },
  { id: "c6", name: "Saúde", budgeted: 600, spent: 240, icon: Dumbbell, color: "178 65% 55%" },
];

export type Transaction = { id: string; description: string; category: string; amount: number; date: string; account: string; icon: typeof ShoppingBag };
export const transactions: Transaction[] = [
  { id: "t1", description: "iFood — Sushi Yassu", category: "Alimentação", amount: -89.5, date: "Hoje, 20:14", account: "Nubank", icon: UtensilsCrossed },
  { id: "t2", description: "Salário — Acme Inc.", category: "Renda", amount: 14500.0, date: "Hoje, 08:00", account: "Nubank", icon: Briefcase },
  { id: "t3", description: "Uber — Centro", category: "Transporte", amount: -32.4, date: "Ontem, 22:01", account: "Nubank", icon: Car },
  { id: "t4", description: "Netflix Premium", category: "Lazer", amount: -55.9, date: "Ontem, 12:00", account: "Itaú", icon: Film },
  { id: "t5", description: "Zara — Compras", category: "Compras", amount: -489.0, date: "15 abr", account: "Itaú", icon: ShoppingBag },
  { id: "t6", description: "Passagem São Paulo", category: "Viagem", amount: -1240.0, date: "14 abr", account: "Nubank", icon: Plane },
  { id: "t7", description: "Aporte XP", category: "Investimento", amount: -2000.0, date: "12 abr", account: "Nubank", icon: Sparkles },
];

export type Goal = { id: string; name: string; current: number; target: number; deadline: string; emoji: string };
export const goals: Goal[] = [
  { id: "g1", name: "Viagem ao Japão", current: 8400, target: 18000, deadline: "Out 2025", emoji: "🗾" },
  { id: "g2", name: "MacBook Pro M4", current: 12200, target: 21000, deadline: "Jul 2025", emoji: "💻" },
  { id: "g3", name: "Reserva 12 meses", current: 28900, target: 60000, deadline: "Dez 2026", emoji: "🛡️" },
];

export const monthlyFlow = [
  { month: "Nov", income: 14200, expense: 9800 },
  { month: "Dez", income: 18500, expense: 12400 },
  { month: "Jan", income: 14500, expense: 10200 },
  { month: "Fev", income: 14500, expense: 9100 },
  { month: "Mar", income: 15800, expense: 11200 },
  { month: "Abr", income: 14500, expense: 8692 },
];

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
