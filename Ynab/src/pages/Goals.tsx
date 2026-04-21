import { useState } from "react";
import { useAccountStore, Goal } from "@/store/useAccountStore";
import { formatMoney } from "@/data/mockData";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Target, Calendar, Trash2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Goals = () => {
  const { goals, addGoal, updateGoal, deleteGoal } = useAccountStore();
  const [open, setOpen] = useState(false);

  const handleAddGoal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    addGoal({
      name: formData.get("name") as string,
      targetAmount: parseFloat(formData.get("target") as string),
      currentAmount: parseFloat(formData.get("current") as string) || 0,
      deadline: formData.get("deadline") as string,
      emoji: (formData.get("emoji") as string) || "🎯",
    });

    toast.success("Meta criada com sucesso!");
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            Metas e Objetivos
          </h1>
          <p className="text-muted-foreground">
            Planeje seus grandes sonhos e acompanhe o progresso de cada economia.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gradient-primary shadow-glow gap-2">
              <Plus className="h-4 w-4" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-border/60">
            <DialogHeader>
              <DialogTitle>Criar Novo Objetivo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddGoal} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="grid gap-2 col-span-1">
                  <Label htmlFor="emoji">Emoji</Label>
                  <Input id="emoji" name="emoji" placeholder="🎯" className="bg-background/50 text-center text-lg" />
                </div>
                <div className="grid gap-2 col-span-3">
                  <Label htmlFor="name">Nome da Meta</Label>
                  <Input id="name" name="name" placeholder="Ex: Viagem, Carro novo..." required className="bg-background/50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="target">Valor Alvo</Label>
                  <Input id="target" name="target" type="number" step="0.01" placeholder="0.00" required className="bg-background/50" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="current">Já tenho (opcional)</Label>
                  <Input id="current" name="current" type="number" step="0.01" placeholder="0.00" className="bg-background/50" />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deadline">Data Limite (Deadline)</Label>
                <Input id="deadline" name="deadline" type="date" required className="bg-background/50" />
              </div>

              <DialogFooter>
                <Button type="submit" className="w-full gradient-primary">Salvar Meta</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.length === 0 ? (
          <div className="col-span-full h-64 flex flex-col items-center justify-center border border-dashed border-border/60 rounded-3xl bg-muted/10 text-muted-foreground gap-3">
             <Target className="h-12 w-12 opacity-20" />
             <p className="font-medium">Você ainda não tem metas. Comece uma agora!</p>
          </div>
        ) : (
          goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} updateGoal={updateGoal} deleteGoal={deleteGoal} />
          ))
        )}
      </div>
    </div>
  );
};

const GoalCard = ({ goal, updateGoal, deleteGoal }: { goal: Goal, updateGoal: any, deleteGoal: any }) => {
  const percent = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
  const remaining = goal.targetAmount - goal.currentAmount;
  const isCompleted = percent >= 100;

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
              <Calendar className="h-3 w-3" />
              {new Date(goal.deadline).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
        <button 
          onClick={() => deleteGoal(goal.id)}
          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-rose-400 hover:bg-rose-400/10 transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-sm font-medium text-muted-foreground">Progresso</div>
          <div className={cn("text-xl font-black tabular", isCompleted ? "text-emerald-400" : "text-primary")}>
            {percent}%
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={percent} className={cn("h-2.5", isCompleted ? "bg-emerald-500/20" : "bg-primary/20")} />
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            <span>{formatMoney(goal.currentAmount, "EUR")}</span>
            <span>Alvo: {formatMoney(goal.targetAmount, "EUR")}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5 block">Atualizar Saldo</Label>
            <Input 
              type="number" 
              defaultValue={goal.currentAmount}
              onBlur={(e) => updateGoal(goal.id, parseFloat(e.target.value) || 0)}
              className="h-9 bg-background/50 border-border/40 focus:border-primary/50 text-sm font-semibold"
            />
          </div>
          {isCompleted ? (
            <div className="h-9 px-3 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center gap-2 text-xs font-bold self-end animate-in fade-in zoom-in">
              <CheckCircle2 className="h-4 w-4" /> Completo
            </div>
          ) : (
            <div className="h-9 px-3 rounded-xl bg-muted/30 text-muted-foreground flex flex-col justify-center leading-tight self-end">
              <span className="text-[9px] uppercase font-bold opacity-60">Faltam</span>
              <span className="text-xs font-bold text-foreground">{formatMoney(remaining, "EUR")}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Goals;
