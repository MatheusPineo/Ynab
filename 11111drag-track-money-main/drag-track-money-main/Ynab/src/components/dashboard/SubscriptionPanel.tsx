import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import {
  Crown,
  Sparkles,
  Check,
  Zap,
  Shield,
  Infinity as InfinityIcon,
  Apple,
  Play,
  Globe,
  CreditCard,
  Download,
  Receipt,
  Calendar,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  Star,
  TrendingUp,
  Users,
  HelpCircle,
} from "lucide-react";

type Plan = "free" | "pro";
type Platform = "stripe" | "google_play" | "apple";
type Cycle = "monthly" | "annual";

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: "paid" | "pending" | "failed" | "refunded";
  platform: Platform;
  description: string;
}

const platformMeta: Record<Platform, { label: string; icon: typeof Apple; color: string }> = {
  stripe: { label: "Stripe (Web)", icon: Globe, color: "text-violet-400" },
  google_play: { label: "Google Play", icon: Play, color: "text-emerald-400" },
  apple: { label: "App Store", icon: Apple, color: "text-sky-400" },
};

const statusMeta: Record<Invoice["status"], { label: string; cls: string }> = {
  paid: { label: "Pago", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  pending: { label: "Pendente", cls: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  failed: { label: "Falhou", cls: "bg-rose-500/15 text-rose-400 border-rose-500/20" },
  refunded: { label: "Reembolsado", cls: "bg-zinc-500/15 text-zinc-300 border-zinc-500/20" },
};

const proFeatures = [
  { icon: InfinityIcon, label: "Contas e transações ilimitadas" },
  { icon: TrendingUp, label: "Insights avançados com IA preditiva" },
  { icon: Shield, label: "Backup criptografado em nuvem" },
  { icon: Zap, label: "Sincronização em tempo real multi-dispositivo" },
  { icon: Star, label: "Categorização automática inteligente" },
  { icon: Users, label: "Compartilhamento familiar (até 5 membros)" },
];

const detectPlatform = (): Platform => {
  if (typeof window === "undefined") return "stripe";
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "apple";
  if (/android/.test(ua)) return "google_play";
  return "stripe";
};

export const SubscriptionPanel = () => {
  const { user } = useAuthStore();

  // Mock state — em produção vem da API
  const [plan] = useState<Plan>("free");
  const [cycle, setCycle] = useState<Cycle>("annual");
  const platform = useMemo(detectPlatform, []);
  const PlatformIcon = platformMeta[platform].icon;

  const isPro = plan === "pro";
  const renewalDate = "12 de junho de 2026";
  const memberSince = "15 de jan, 2025";

  // Uso atual (free tier)
  const usage = {
    accounts: { used: 3, limit: 5 },
    transactions: { used: 87, limit: 100 },
    goals: { used: 2, limit: 3 },
  };

  const invoices: Invoice[] = [
    { id: "INV-2026-0512", date: "12 mai, 2026", amount: "R$ 29,90", status: "paid", platform: "stripe", description: "Vault Pro · Mensal" },
    { id: "INV-2026-0412", date: "12 abr, 2026", amount: "R$ 29,90", status: "paid", platform: "stripe", description: "Vault Pro · Mensal" },
    { id: "INV-2026-0312", date: "12 mar, 2026", amount: "R$ 29,90", status: "refunded", platform: "google_play", description: "Vault Pro · Mensal" },
    { id: "INV-2026-0212", date: "12 fev, 2026", amount: "R$ 29,90", status: "paid", platform: "apple", description: "Vault Pro · Mensal" },
  ];

  const handleUpgrade = () => {
    if (platform === "apple") {
      toast.info("Você será redirecionado para a App Store para concluir a assinatura.");
    } else if (platform === "google_play") {
      toast.info("Abrindo Google Play Billing para finalizar a compra.");
    } else {
      toast.info("Redirecionando para o checkout seguro do Stripe...");
    }
  };

  const handleManageOnPlatform = () => {
    const map: Record<Platform, string> = {
      stripe: "Abrindo portal de cobrança Stripe (Customer Portal)...",
      google_play: "Para gerenciar, acesse Google Play → Conta → Assinaturas.",
      apple: "Para gerenciar, acesse Ajustes do iPhone → Apple ID → Assinaturas.",
    };
    toast.info(map[platform]);
  };

  return (
    <div className="space-y-6">
      {/* HERO — Status do plano */}
      <Card className="rounded-3xl border-border/60 bg-gradient-to-br from-card/60 via-card/40 to-primary/5 backdrop-blur-sm overflow-hidden relative">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <CardHeader className="relative pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {isPro ? (
                  <Crown className="h-5 w-5 text-amber-400" />
                ) : (
                  <Sparkles className="h-5 w-5 text-primary" />
                )}
                <Badge
                  className={
                    isPro
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/15"
                      : "bg-zinc-500/15 text-zinc-300 border-zinc-500/20 hover:bg-zinc-500/15"
                  }
                >
                  {isPro ? "Plano Pro" : "Plano Gratuito"}
                </Badge>
                <Badge variant="outline" className="border-border/60 gap-1.5">
                  <PlatformIcon className={`h-3 w-3 ${platformMeta[platform].color}`} />
                  <span className="text-xs">{platformMeta[platform].label}</span>
                </Badge>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
                {isPro ? "Você está no Vault Pro" : "Desbloqueie todo o potencial do Vault"}
              </CardTitle>
              <CardDescription className="text-sm max-w-xl">
                {isPro
                  ? `Sua assinatura é renovada automaticamente em ${renewalDate}.`
                  : "Faça upgrade para o Pro e tenha acesso ilimitado a recursos avançados, IA preditiva e suporte prioritário."}
              </CardDescription>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              {isPro ? (
                <>
                  <Button onClick={handleManageOnPlatform} className="gradient-primary rounded-xl font-bold shadow-glow gap-2">
                    <CreditCard className="h-4 w-4" /> Gerenciar Cobrança
                  </Button>
                  <Button variant="outline" className="rounded-xl border-border/60 gap-2">
                    <RefreshCw className="h-4 w-4" /> Trocar de Plano
                  </Button>
                </>
              ) : (
                <Button onClick={handleUpgrade} className="gradient-primary rounded-xl font-bold shadow-glow gap-2 h-11 px-6">
                  <Crown className="h-4 w-4" /> Fazer Upgrade
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/40">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Status</p>
              <p className="text-sm font-bold flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${isPro ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
                {isPro ? "Ativo" : "Inativo"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Membro desde</p>
              <p className="text-sm font-bold">{memberSince}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Próxima cobrança</p>
              <p className="text-sm font-bold">{isPro ? renewalDate : "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Valor</p>
              <p className="text-sm font-bold">{isPro ? "R$ 29,90/mês" : "Grátis"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* USO ATUAL — apenas para free */}
      {!isPro && (
        <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 font-bold">
              <TrendingUp className="h-5 w-5 text-primary" /> Uso do Plano Gratuito
            </CardTitle>
            <CardDescription>Veja quanto do seu limite gratuito você já utilizou.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {Object.entries(usage).map(([key, { used, limit }]) => {
              const pct = (used / limit) * 100;
              const labels: Record<string, string> = {
                accounts: "Contas conectadas",
                transactions: "Transações neste mês",
                goals: "Metas ativas",
              };
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{labels[key]}</span>
                    <span className="text-muted-foreground tabular-nums">
                      <span className={pct >= 80 ? "text-amber-400 font-bold" : "text-foreground"}>{used}</span> / {limit}
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 mt-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/80">
                Você está perto de atingir o limite gratuito. Faça upgrade para o <strong>Pro</strong> e tenha tudo ilimitado.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* COMPARATIVO DE PLANOS */}
      <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 font-bold">
                <Crown className="h-5 w-5 text-amber-400" /> Compare os planos
              </CardTitle>
              <CardDescription>Escolha o ciclo que mais combina com você.</CardDescription>
            </div>
            <div className="inline-flex items-center bg-muted/30 border border-border/60 rounded-xl p-1 self-start sm:self-auto">
              <button
                onClick={() => setCycle("monthly")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  cycle === "monthly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setCycle("annual")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  cycle === "annual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Anual
                <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md text-[9px]">-20%</span>
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          {/* Free */}
          <div
            className={`relative p-6 rounded-2xl border ${
              !isPro ? "border-primary/40 bg-primary/5" : "border-border/40 bg-muted/10"
            }`}
          >
            {!isPro && (
              <Badge className="absolute -top-2 right-4 bg-primary text-primary-foreground hover:bg-primary">
                Plano atual
              </Badge>
            )}
            <h4 className="font-bold text-lg">Gratuito</h4>
            <p className="text-3xl font-bold mt-2">
              R$ 0 <span className="text-sm text-muted-foreground font-normal">/sempre</span>
            </p>
            <Separator className="my-4" />
            <ul className="space-y-2.5 text-sm">
              {["Até 5 contas", "100 transações/mês", "3 metas ativas", "Suporte por e-mail"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-muted-foreground" /> {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div
            className={`relative p-6 rounded-2xl border overflow-hidden ${
              isPro ? "border-amber-500/40 bg-amber-500/5" : "border-primary/30 bg-gradient-to-br from-primary/10 to-emerald-500/5"
            }`}
          >
            <div className="absolute top-0 right-0 h-32 w-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            {isPro ? (
              <Badge className="absolute -top-2 right-4 bg-amber-500 text-black hover:bg-amber-500">Plano atual</Badge>
            ) : (
              <Badge className="absolute -top-2 right-4 bg-primary text-primary-foreground hover:bg-primary">Recomendado</Badge>
            )}
            <h4 className="font-bold text-lg flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-400" /> Pro
            </h4>
            <p className="text-3xl font-bold mt-2">
              {cycle === "annual" ? "R$ 23,92" : "R$ 29,90"}
              <span className="text-sm text-muted-foreground font-normal">/mês</span>
            </p>
            {cycle === "annual" && (
              <p className="text-xs text-emerald-400 font-semibold mt-1">Cobrado R$ 287,04/ano · economize R$ 71,76</p>
            )}
            <Separator className="my-4" />
            <ul className="space-y-2.5 text-sm">
              {proFeatures.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary shrink-0" /> {label}
                </li>
              ))}
            </ul>
            {!isPro && (
              <Button
                onClick={handleUpgrade}
                className="w-full mt-5 gradient-primary rounded-xl font-bold shadow-glow gap-2"
              >
                <Crown className="h-4 w-4" /> Assinar Pro
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MÉTODO DE PAGAMENTO */}
      <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 font-bold">
            <CreditCard className="h-5 w-5 text-primary" /> Método de Pagamento
          </CardTitle>
          <CardDescription>
            Sua assinatura é processada pela plataforma onde você se inscreveu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/40">
            <div className="flex items-center gap-4">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center bg-background/60 border border-border/40`}>
                <PlatformIcon className={`h-5 w-5 ${platformMeta[platform].color}`} />
              </div>
              <div>
                <p className="text-sm font-bold">{platformMeta[platform].label}</p>
                <p className="text-xs text-muted-foreground">
                  {platform === "stripe" && "•••• •••• •••• 4242 · Vence 08/28"}
                  {platform === "google_play" && `Conta Google: ${user?.email || "—"}`}
                  {platform === "apple" && `Apple ID: ${user?.email || "—"}`}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleManageOnPlatform} className="rounded-xl gap-1.5">
              Gerenciar <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["stripe", "apple", "google_play"] as Platform[]).map((p) => {
              const Icon = platformMeta[p].icon;
              const active = p === platform;
              return (
                <div
                  key={p}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    active ? "border-primary/40 bg-primary/5" : "border-border/40 bg-muted/10 opacity-60"
                  }`}
                >
                  <Icon className={`h-4 w-4 mx-auto ${platformMeta[p].color}`} />
                  <p className="text-[10px] font-bold mt-1">{platformMeta[p].label}</p>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Por exigência das lojas, assinaturas iniciadas no <strong>iOS</strong> só podem ser canceladas pela App Store, e
            assinaturas do <strong>Android</strong> pelo Google Play. Assinaturas Web são gerenciadas pelo portal Stripe.
          </p>
        </CardContent>
      </Card>

      {/* EXTRATO DE PAGAMENTOS */}
      <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 font-bold">
                <Receipt className="h-5 w-5 text-primary" /> Extrato de Pagamentos
              </CardTitle>
              <CardDescription>Histórico completo de cobranças e recibos.</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
              <Download className="h-3.5 w-3.5" /> Exportar tudo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {invoices.map((inv) => {
              const Icon = platformMeta[inv.platform].icon;
              return (
                <div
                  key={inv.id}
                  className="flex items-center gap-3 px-6 py-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="h-10 w-10 rounded-xl bg-background/60 border border-border/40 flex items-center justify-center shrink-0">
                    <Icon className={`h-4 w-4 ${platformMeta[inv.platform].color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{inv.description}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" /> {inv.date} · {inv.id}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums">{inv.amount}</p>
                    <Badge variant="outline" className={`text-[10px] mt-1 ${statusMeta[inv.status].cls}`}>
                      {statusMeta[inv.status].label}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-xl shrink-0 h-8 w-8">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="p-4 text-center border-t border-border/40">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              Ver histórico completo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* BENEFÍCIOS EXCLUSIVOS PRO */}
      {isPro && (
        <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 font-bold">
              <Sparkles className="h-5 w-5 text-amber-400" /> Benefícios exclusivos Pro
            </CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            {proFeatures.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 p-4 rounded-2xl bg-muted/20 border border-border/40">
                <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm font-semibold">{label}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AJUDA & CANCELAMENTO */}
      <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 font-bold">
            <HelpCircle className="h-5 w-5 text-primary" /> Ajuda e Suporte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <Button variant="outline" className="rounded-xl h-auto py-4 flex-col items-start gap-1 border-border/40">
              <Receipt className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">Solicitar reembolso</span>
              <span className="text-[10px] text-muted-foreground text-left">Até 14 dias após a compra</span>
            </Button>
            <Button variant="outline" className="rounded-xl h-auto py-4 flex-col items-start gap-1 border-border/40">
              <RefreshCw className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">Restaurar compra</span>
              <span className="text-[10px] text-muted-foreground text-left">Recuperar assinatura antiga</span>
            </Button>
            <Button variant="outline" className="rounded-xl h-auto py-4 flex-col items-start gap-1 border-border/40">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">Falar com suporte</span>
              <span className="text-[10px] text-muted-foreground text-left">Resposta em até 24h</span>
            </Button>
          </div>
          {isPro && (
            <div className="pt-2">
              <Button variant="ghost" className="text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs">
                Cancelar assinatura
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
