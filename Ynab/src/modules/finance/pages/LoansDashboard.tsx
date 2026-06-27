import { useState, useMemo, useEffect } from "react";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { useDebtStore } from "@/modules/finance/store/useDebtStore";
import { useTransactions } from "@/shared/hooks/useTransactions";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { GlobalAccountSelector } from "@/shared/components/ui/global-account-selector";
import { formatMoney } from "@/shared/lib/currency-utils";
import { HandCoins, ArrowDownToLine, Info, Calendar, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/shared/components/ui/accordion";
import { AnimatePresence, motion } from "framer-motion";
import { Debt } from "@/modules/finance/store/useDebtStore";
import { Input } from "@/shared/components/ui/input";

const LoansDashboard = () => {
  const { fetchAccounts } = useAccountStore();
  const { fetchDebts, debts, addPayment } = useDebtStore();
  const { addTransaction } = useTransactions();
  
  useEffect(() => {
    fetchAccounts();
    fetchDebts();
  }, [fetchAccounts, fetchDebts]);

  const activeDebts = useMemo(() => debts.filter(d => d.amount_remaining > 0 && d.is_mine), [debts]);

  const nameMap = useMemo(() => {
    const map: Record<string, string> = {};
    debts.forEach(d => {
      if (d.counterparty_name && isNaN(Number(d.counterparty_name))) {
        map[d.id] = d.counterparty_name;
      }
    });
    return map;
  }, [debts]);

  const resolveDebtorName = (rawName: string) => {
    if (!rawName) return "Desconhecido";
    if (!isNaN(Number(rawName)) && nameMap[rawName]) {
      return nameMap[rawName];
    }
    return rawName;
  };

  const persons = useMemo(() => {
    const groups: Record<string, Debt[]> = {};
    activeDebts.forEach(d => {
      const name = resolveDebtorName(d.counterparty_name);
      if (!groups[name]) groups[name] = [];
      groups[name].push(d);
    });
    return Object.entries(groups).map(([name, tickets]) => ({ name, tickets }));
  }, [activeDebts, nameMap]);

  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [destinationAccountId, setDestinationAccountId] = useState<string>("");
  const [receiveDate, setReceiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleTicket = (ticketId: string) => {
    const newSet = new Set(selectedTickets);
    if (newSet.has(ticketId)) newSet.delete(ticketId);
    else newSet.add(ticketId);
    setSelectedTickets(newSet);
  };

  const selectedTicketsList = useMemo(() => 
    activeDebts.filter(d => selectedTickets.has(d.id)), 
    [activeDebts, selectedTickets]
  );
  
  const totalSelectedSum = useMemo(() => 
    selectedTicketsList.reduce((sum, d) => sum + d.amount_remaining, 0),
    [selectedTicketsList]
  );

  const handleReceiveSelected = async () => {
    if (!destinationAccountId) {
      toast.error("Selecione a conta de destino.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      for (const ticket of selectedTicketsList) {
        // Option A Orchestration
        await addPayment({
          debt: ticket.id,
          amount: ticket.amount_remaining,
          date: receiveDate,
          account: destinationAccountId
        });
        
        // Manual umbilical loop via standard transaction logic, explicitly linking the category if present
        if (ticket.origin_category) {
          await addTransaction.mutateAsync({
            account: destinationAccountId,
            description: `Retorno de Rateio: ${ticket.counterparty_name}`,
            amount: ticket.amount_remaining,
            is_income: true,
            date: receiveDate,
            category: ticket.origin_category,
            status: "realized",
            is_recurring: false
          } as any);
        }
      }
      
      toast.success("Recebimentos processados e roteados com sucesso!");
      setIsModalOpen(false);
      setSelectedTickets(new Set());
      await fetchDebts();
      await fetchAccounts();
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar o recebimento múltiplo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex flex-col gap-1 mt-2">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <HandCoins className="h-6 w-6 text-rose-500" />
          Central de Devedores
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Gestão baseada em Tickets individuais. Acompanhe recibos específicos e liquide parcialmente com roteamento direto para o envelope original (Umbilical Loop).
        </p>
      </div>

      {persons.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border/60 rounded-2xl bg-muted/10 text-center">
          <Info className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="text-base font-semibold text-foreground">Nenhum devedor ativo</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            Quando você dividir uma compra ou emprestar dinheiro usando a modalidade Rateio, os tickets aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {persons.map((person) => {
            const totalDebt = person.tickets.reduce((sum, t) => sum + t.amount_remaining, 0);
            
            return (
              <Card key={person.name} className="glass border-border/50 shadow-soft overflow-hidden relative flex flex-col bg-gradient-to-b from-card/80 to-background/50 rounded-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-400" />
                <CardHeader className="pb-3 px-5 pt-6">
                  <CardTitle className="text-xl flex items-center justify-between font-black">
                    <span className="truncate">{person.name}</span>
                    <span className="text-rose-500">{formatMoney(totalDebt, person.tickets[0]?.currency || "BRL")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-4 flex-1">
                  <Accordion type="multiple" className="w-full space-y-2">
                    <AccordionItem value="tickets" className="border-none">
                      <AccordionTrigger className="hover:no-underline py-2 px-3 rounded-lg hover:bg-white/5 transition-colors text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <span className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full text-[10px]">{person.tickets.length}</span>
                          Tickets Ativos
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 px-1 pb-1">
                        <div className="space-y-2">
                          {person.tickets.map(ticket => (
                            <div 
                              key={ticket.id} 
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                selectedTickets.has(ticket.id) ? "border-emerald-500/50 bg-emerald-500/10" : "border-white/10 bg-black/20 hover:bg-white/5"
                              }`}
                              onClick={() => handleToggleTicket(ticket.id)}
                            >
                              <Checkbox 
                                checked={selectedTickets.has(ticket.id)} 
                                onCheckedChange={() => handleToggleTicket(ticket.id)}
                                onClick={e => e.stopPropagation()}
                                className="h-5 w-5 rounded-md"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold truncate text-foreground">
                                  {ticket.notes || ticket.origin_transaction_description || "Empréstimo genérico"}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3"/> {new Date(ticket.created_at).toLocaleDateString()}</span>
                                  {ticket.origin_category_name && (
                                    <span className="flex items-center gap-0.5 text-rose-400/80">
                                      <ArrowRight className="h-3 w-3"/> {ticket.origin_category_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm font-black tabular-nums text-foreground">
                                {formatMoney(ticket.amount_remaining, ticket.currency)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sticky Action Bar */}
      <AnimatePresence>
        {selectedTickets.size > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50"
          >
            <div className="glass border border-white/20 p-4 rounded-2xl shadow-2xl bg-popover/90 backdrop-blur-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">
                  {selectedTickets.size} {selectedTickets.size === 1 ? 'ticket selecionado' : 'tickets selecionados'}
                </span>
                <span className="text-lg font-black text-emerald-400">
                  {formatMoney(totalSelectedSum, "BRL")}
                </span>
              </div>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="w-full h-11 gradient-primary font-bold shadow-glow text-primary-foreground"
              >
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                Receber Valores Selecionados
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Destination Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[400px] glass border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-emerald-500" />
              Para onde vai o dinheiro?
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="receiveDate">Data do Recebimento</Label>
              <Input 
                id="receiveDate" 
                type="date" 
                value={receiveDate}
                onChange={(e) => setReceiveDate(e.target.value)}
                className="bg-background/50" 
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Conta Destino</Label>
              <GlobalAccountSelector
                value={destinationAccountId}
                onValueChange={setDestinationAccountId}
                placeholder="Ex: Nubank, Carteira..."
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                O valor de {formatMoney(totalSelectedSum, "BRL")} será depositado nesta conta. Graças ao <strong>Loop Umbilical</strong>, se algum ticket tiver envelope original (ex: Mercado), o saldo voltará para lá automaticamente!
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleReceiveSelected}
              disabled={isSubmitting || !destinationAccountId}
              className="gradient-primary text-primary-foreground font-bold"
            >
              {isSubmitting ? "Processando..." : "Confirmar Recebimento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoansDashboard;
