import { useState } from "react";
import { useGoals } from "@/hooks/useGoals";
import { formatMoney } from "@/lib/currency-utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Target, Calendar, Trash2, CheckCircle2, Pencil, Wallet, Coins } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Goal, Currency } from "@/types";
import { toast } from "sonner";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme } from "next-themes";

const GoalModal = ({ goal, open, setOpen }: { goal?: Goal; open: boolean; setOpen: (open: boolean) => void }) => {
  const { addGoal, updateGoal } = useGoals();
  const { theme } = useTheme();
  const [hasDeadline, setHasDeadline] = useState(!!goal?.deadline);
  const [currency, setCurrency] = useState<Currency>((goal?.currency as Currency) || "EUR");
  const [emoji, setEmoji] = useState(goal?.emoji || "🎯");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      target_amount: Number(parseFloat(formData.get("target") as string).toFixed(2)),
      current_amount: Number((parseFloat(formData.get("current") as string) || 0).toFixed(2)),
      deadline: hasDeadline ? (formData.get("deadline") as string) : null,
      emoji: emoji,
      currency: currency,
    };

    if (goal) {
      await updateGoal.mutateAsync({ id: goal.id, updates: data as any });
      toast.success("Meta atualizada!");
    } else {
      await addGoal.mutateAsync(data as any);
    }

    setOpen(false);
  };

  return (
    <DialogContent className="glass border-border/60">
      <DialogHeader>
        <DialogTitle>{goal ? "Editar Objetivo" : "Criar Novo Objetivo"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="grid gap-4 py-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="grid gap-2 col-span-1">
            <Label className="text-center">Emoji</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 w-full text-2xl bg-background/50 border-border/60 hover:bg-white/10 transition-colors">
                  {emoji}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 border-none bg-transparent" align="start">
                <EmojiPicker 
                  onEmojiClick={(data) => setEmoji(data.emoji)} 
                  theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                  lazyLoadEmojis
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2 col-span-3">
            <Label htmlFor="name">Nome da Meta</Label>
            <Input id="name" name="name" defaultValue={goal?.name} placeholder="Ex: Viagem, Carro novo..." required className="bg-background/50 h-10" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="target">Valor Alvo</Label>
            <Input id="target" name="target" type="number" step="0.01" defaultValue={goal?.target_amount} placeholder="0.00" required className="bg-background/50 h-10" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="currency">Moeda</Label>
            <Select value={currency} onValueChange={(v: Currency) => setCurrency(v)}>
              <SelectTrigger className="bg-background/50 border-border/60 h-10">
                <SelectValue placeholder="Moeda" />
              </SelectTrigger>
              <SelectContent className="glass border-border/60">
                <SelectItem value="EUR">Euro (€)</SelectItem>
                <SelectItem value="BRL">Real (R$)</SelectItem>
                <SelectItem value="USD">Dólar ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {!goal && (
          <div className="grid gap-2">
            <Label htmlFor="current">Saldo Inicial (opcional)</Label>
            <Input id="current" name="current" type="number" step="0.01" placeholder="0.00" className="bg-background/50 h-10" />
          </div>
        )}

        <div className="space-y-4 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="hasDeadline" checked={hasDeadline} onCheckedChange={(checked) => setHasDeadline(!!checked)} />
            <Label htmlFor="hasDeadline" className="text-sm font-medium leading-none cursor-pointer">
              Ativar data limite (Deadline)
            </Label>
          </div>

          {hasDeadline && (
            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="deadline">Data Limite</Label>
              <Input id="deadline" name="deadline" type="date" defaultValue={goal?.deadline || ""} required className="bg-background/50 h-10" />
            </div>
          )}
        </div>

        <DialogFooter className="pt-4">
          <Button type="submit" className="w-full gradient-primary h-11 text-base">
            {goal ? "Salvar Alterações" : "Começar a Poupar"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

const Goals = () => {
  const { goals, isLoading, deleteGoal, updateGoal } = useGoals();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col items-center text-center sm:text-left sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col items-center sm:items-start gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
            Metas e Objetivos
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Planeje seus grandes sonhos e acompanhe o progresso de cada economia.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gradient-primary shadow-glow gap-2 h-11 px-6">
              <Plus className="h-5 w-5" />
              <span className="font-bold">Nova Meta</span>
            </Button>
          </DialogTrigger>
          <GoalModal open={open} setOpen={setOpen} />
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center text-muted-foreground">Carregando metas...</div>
        ) : goals.length === 0 ? (
          <div className="col-span-full h-64 flex flex-col items-center justify-center border border-dashed border-border/60 rounded-3xl bg-muted/10 text-muted-foreground gap-3">
             <Target className="h-12 w-12 opacity-20" />
             <p className="font-medium">Você ainda não tem metas. Comece uma agora!</p>
          </div>
        ) : (
          goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onUpdate={(id, updates) => updateGoal.mutateAsync({ id, updates })} onDelete={(id) => deleteGoal.mutate(id)} />
          ))
        )}
      </div>
    </div>
  );
};

const GoalCard = ({ goal, onUpdate, onDelete }: { goal: Goal, onUpdate: any, onDelete: any }) => {
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  const currentAmt = Number(goal.current_amount) || 0;
  const targetAmt = Number(goal.target_amount) || 0;
  const percent = Math.min(Math.round((currentAmt / targetAmt) * 100), 100);
  const remaining = targetAmt - currentAmt;
  const isCompleted = percent >= 100;
  const currency = goal.currency || "EUR";

  const handleDeposit = async () => {
    console.log("💰 handleDeposit chamado com depositAmount:", depositAmount);
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0) {
      toast.error("Insira um valor válido");
      return;
    }
    try {
      console.log(`🚀 Chamando onUpdate para o ID: ${goal.id} com valor de adição: ${val}`);
      await onUpdate(goal.id, { current_amount: Number((currentAmt + val).toFixed(2)) });
      console.log("✅ onUpdate concluído com sucesso!");
      setDepositAmount("");
      setIsDepositOpen(false);
      toast.success(`Saldo adicionado! +${formatMoney(val, currency)}`);
    } catch (err: any) {
      console.error("❌ Erro ao depositar saldo na meta:", err);
      toast.error(`Falha ao depositar saldo: ${err.message || err}`);
    }
  };

  return (
    <Card className={cn(
      "rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden transition-all hover:shadow-soft group",
      isCompleted && "border-emerald-500/30 bg-emerald-500/5"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            {goal.emoji}
          </div>
          <div>
            <CardTitle className="text-lg font-bold">{goal.name}</CardTitle>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">
              {goal.deadline ? (
                <>
                  <Calendar className="h-3 w-3" />
                  {new Date(goal.deadline).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' })}
                </>
              ) : (
                <>
                  <Target className="h-3 w-3" />
                  Sem prazo definido
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <button className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100">
                <Pencil className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <GoalModal goal={goal} open={isEditOpen} setOpen={setIsEditOpen} />
          </Dialog>

          <button 
            onClick={() => {
                if(window.confirm(`Excluir meta "${goal.name}"?`)) onDelete(goal.id);
            }}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-rose-400 hover:bg-rose-400/10 transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
             <Coins className="h-4 w-4" /> Progresso
          </div>
          <div className={cn("text-xl font-black tabular", isCompleted ? "text-emerald-400" : "text-primary")}>
            {percent}%
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={percent} className={cn("h-2.5", isCompleted ? "bg-emerald-500/20" : "bg-primary/20")} />
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            <span>{formatMoney(goal.current_amount, currency)}</span>
            <span>Alvo: {formatMoney(goal.target_amount, currency)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 rounded-xl border-border/40 bg-background/30 hover:bg-primary/10 hover:border-primary/50 transition-all gap-2 h-10 group/btn">
                <Wallet className="h-4 w-4 text-primary group-hover/btn:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider">Adicionar Saldo</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border/60 sm:max-w-[300px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Investir na Meta
                </DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                   <Label className="text-xs text-muted-foreground">Valor para adicionar ({currency})</Label>
                   <Input 
                    type="number" 
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="h-12 text-lg font-bold bg-background/50 border-border/40 focus:border-primary"
                   />
                </div>
                <Button onClick={handleDeposit} className="w-full h-12 gradient-primary text-base font-bold">
                  Confirmar Depósito
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {isCompleted ? (
            <div className="h-10 px-4 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in">
              <CheckCircle2 className="h-4 w-4" /> Concluído
            </div>
          ) : (
            <div className="h-10 px-4 rounded-xl bg-muted/30 text-muted-foreground flex flex-col justify-center leading-tight">
              <span className="text-[8px] uppercase font-black opacity-50 tracking-tighter">Restam</span>
              <span className="text-xs font-black text-foreground tabular">{formatMoney(remaining, currency)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Goals;
