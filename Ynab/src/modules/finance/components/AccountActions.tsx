import { useState, useEffect, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Button } from "@/shared/components/ui/button";
import { MoreHorizontal, Edit, Trash, Plus, Eye, LifeBuoy, ArrowRightFromLine, Move } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { GlobalAccountSelector } from "@/shared/components/ui/global-account-selector";
import { Input } from "@/shared/components/ui/input";
import { CurrencyInput } from "@/shared/components/ui/currency-input";
import { Label } from "@/shared/components/ui/label";
import { HelpTooltip } from "@/shared/components/ui/help-tooltip";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { AccountNode } from "@/types";
import { toast } from "sonner";
import { IconPicker } from "./IconPicker";
import { authenticatedFetch } from "@/shared/lib/api";

interface AccountActionsProps {
  account: AccountNode;
}

export const AccountActions = ({ account }: AccountActionsProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState(account.name);
  const [editedBalance, setEditedBalance] = useState(account.balance);
  const [editedIcon, setEditedIcon] = useState(account.icon_url);
  const [editedCeiling, setEditedCeiling] = useState<number | null>(account.ceiling ?? null);
  const [editedExcludeFromTotals, setEditedExcludeFromTotals] = useState(!!account.exclude_from_totals);
  const [editedBankDomain, setEditedBankDomain] = useState(account.bank_domain || "");
  const [editedAccountType, setEditedAccountType] = useState((account.account_type || "checking").toLowerCase());
  const [isSaving, setIsSaving] = useState(false);
  
  // Mover Conta (App & Web)
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string>("root");
  const { updateNode, deleteNode, coverOverspending, distributeExcess, tree } = useAccountStore();

  useEffect(() => {
    if (isMoveDialogOpen) {
      setSelectedParentId(account.parent ? String(account.parent) : "root");
    }
  }, [isMoveDialogOpen, account]);

  const eligibleParents = useMemo(() => {
    const list: AccountNode[] = [];
    
    const isDescendantOrSelf = (parent: AccountNode, childId: number): boolean => {
      if (parent.id === childId) return true;
      if (!parent.children) return false;
      return parent.children.some(child => isDescendantOrSelf(child, childId));
    };

    const walk = (nodes: AccountNode[]) => {
      nodes.forEach(n => {
        if (!isDescendantOrSelf(account, n.id)) {
          list.push(n);
        }
        if (n.children) {
          walk(n.children);
        }
      });
    };

    walk(tree);
    return list;
  }, [tree, account]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isEditDialogOpen) {
      setEditedName(account.name);
      setEditedBalance(account.balance);
      setEditedIcon(account.icon_url);
      setEditedCeiling(account.ceiling ?? null);
      setEditedExcludeFromTotals(!!account.exclude_from_totals);
      setEditedBankDomain(account.bank_domain || "");
      setEditedAccountType((account.account_type || "checking").toLowerCase());
    }
  }, [isEditDialogOpen, account]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await updateNode(account.id, { 
        name: editedName, 
        balance: editedBalance,
        icon_url: editedIcon,
        ceiling: editedCeiling,
        exclude_from_totals: editedExcludeFromTotals,
        bank_domain: editedBankDomain,
        account_type: editedAccountType
      });
      
      setIsEditDialogOpen(false);
    } catch (error: any) {
      toast.error("Erro ao salvar: " + (error.message || "Erro desconhecido"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir a conta "${account.name}" e todas as suas sub-contas e transações?`)) {
      await deleteNode(account.id);
      toast.success(`Conta "${account.name}" excluída.`);
    }
  };

  const handleCoverOverspending = async () => {
    if (window.confirm(`Deseja cobrir o saldo negativo de ${account.name} retirando valores iguais das outras subcontas com a mesma moeda?`)) {
      try {
        await coverOverspending(account.id);
      } catch (e) {
        // Error already handled by toast in store
      }
    }
  };

  const handleDistributeExcess = async () => {
    const excess = Number(account.balance) - Number(account.ceiling);
    const formatted = excess.toLocaleString('pt-BR', { style: 'currency', currency: account.currency || 'BRL' });
    if (window.confirm(`Deseja distribuir o excedente de ${formatted} da conta "${account.name}" entre as outras subcontas do mesmo banco que ainda não atingiram o teto?`)) {
      try {
        await distributeExcess(account.id);
      } catch (e) {
        // Error already handled by toast in store
      }
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => navigate(`/account/${account.id}`)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalhes
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsMoveDialogOpen(true)}>
            <Move className="mr-2 h-4 w-4" />
            Mover Conta
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleDelete} className="text-red-500">
            <Trash className="mr-2 h-4 w-4" />
            Deletar
          </DropdownMenuItem>
          {Number(account.balance) < 0 && account.parent != null && (
            <DropdownMenuItem onSelect={handleCoverOverspending} className="text-emerald-500 focus:text-emerald-600 focus:bg-emerald-500/10">
              <LifeBuoy className="mr-2 h-4 w-4" />
              <span className="flex-1">Cobrir Saldo Negativo</span>
              <HelpTooltip content="Retira valores iguais das outras subcontas para zerar esta conta devedora." side="right" />
            </DropdownMenuItem>
          )}
          {account.ceiling != null && Number(account.balance) > Number(account.ceiling) && account.parent != null && (
            <DropdownMenuItem onSelect={handleDistributeExcess} className="text-amber-500 focus:text-amber-600 focus:bg-amber-500/10">
              <ArrowRightFromLine className="mr-2 h-4 w-4" />
              <span className="flex-1">Distribuir Excedente</span>
              <HelpTooltip content="Retira o valor que passou do teto e distribui entre as contas irmãs." side="right" />
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] glass border-border/60">
          <DialogHeader>
            <DialogTitle>Editar Conta: {account.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Conta</Label>
              <Input
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-1.5" htmlFor="account_type">
                Tipo de Conta
                <HelpTooltip content="Define o comportamento do dinheiro. Cartões de crédito geram dívida, Contas de Acompanhamento não entram no orçamento principal."/>
              </Label>
              <Select onValueChange={setEditedAccountType} value={editedAccountType}>
                <SelectTrigger className="bg-background/50" id="account_type">
                  <SelectValue placeholder="Selecione o tipo..."/>
                </SelectTrigger>
                <SelectContent className="glass border-border/60">
                  <SelectItem value="checking">Conta Corrente / Carteira</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="tracking">Conta de Acompanhamento (Fora do Orçamento)</SelectItem>
                  <SelectItem value="LOAN_GIVEN">Empréstimo Concedido (A Receber)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bank_domain">Website / Domínio do Banco</Label>
              <Input
                id="bank_domain"
                value={editedBankDomain}
                onChange={(e) => setEditedBankDomain(e.target.value)}
                placeholder="Ex: nubank.com.br"
                className="bg-background/50"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="balance">Saldo Atual</Label>
              <CurrencyInput
                id="balance"
                value={editedBalance}
                onChange={(val) => setEditedBalance(val)}
                className="bg-background/50 text-left"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ceiling">Teto (Limite Opcional)</Label>
              <CurrencyInput
                id="ceiling"
                value={editedCeiling ?? 0}
                onChange={(val) => setEditedCeiling(val === 0 ? null : val)}
                placeholder="Ex: 1000.00"
                className="bg-background/50 text-left"
              />
            </div>
            <div className="flex items-center space-x-3 py-1 bg-muted/20 border border-border/40 px-3.5 py-3 rounded-xl">
              <input
                id="exclude_from_totals"
                type="checkbox"
                checked={editedExcludeFromTotals}
                onChange={(e) => setEditedExcludeFromTotals(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-border/60 text-primary focus:ring-primary bg-background/50 cursor-pointer accent-primary shrink-0"
              />
              <div className="space-y-0.5 min-w-0">
                <Label htmlFor="exclude_from_totals" className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-1.5 select-none">
                  Desconsiderar nos Totais
                  <HelpTooltip content="Oculta o saldo desta conta dos somatórios de contas pai, Net Worth e do dashboard global." />
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                className="w-full gradient-primary" 
                disabled={isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Mover Conta (Mobile & Web Fallback) */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent className="sm:max-w-[425px] glass border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold">
              <Move className="h-5 w-5 text-primary" /> Mover Conta: {account.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2 col-span-full">
              <Label htmlFor="parent-select">Nova Conta Pai</Label>
              <GlobalAccountSelector 
                value={selectedParentId} 
                onValueChange={setSelectedParentId}
                placeholder="Selecione a conta pai"
                showRootOption={true}
                allowListIds={eligibleParents.map(p => String(p.id))}
              />
              <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                O seletor filtra automaticamente e oculta a própria conta e todos os descendentes dela para prevenir recursão cíclica infinita.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setIsMoveDialogOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              onClick={async () => {
                setIsSaving(true);
                try {
                  const newParent = selectedParentId === "root" ? null : Number(selectedParentId);
                  await updateNode(account.id, { parent: newParent });
                  toast.success(`Conta "${account.name}" movida com sucesso!`);
                  setIsMoveDialogOpen(false);
                } catch (error: any) {
                  toast.error("Erro ao mover conta: " + (error.message || "Erro desconhecido"));
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className="gradient-primary px-6 rounded-xl font-bold shadow-glow h-10"
            >
              {isSaving ? "Movendo..." : "Confirmar Movimentação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};