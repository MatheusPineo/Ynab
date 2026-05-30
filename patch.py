with open('C:/Users/mathe/PROJETO-YNAB/Ynab/src/modules/finance/components/BillDetailsView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

imports = """import { GlobalAccountSelector } from "@/shared/components/ui/global-account-selector";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
"""

content = content.replace('import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";', 'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";\n' + imports)

# state for dialog
state_str = "  const [search, setSearch] = useState(\"\");"
new_state = "  const [search, setSearch] = useState(\"\");\n  const [bindPrompt, setBindPrompt] = useState<{isOpen: boolean, installmentId: string, subaccountId: string} | null>(null);"
content = content.replace(state_str, new_state)

# modify handleBindInstallmentToSubaccount
old_handler = """  const handleBindInstallmentToSubaccount = async (installmentId: string, subaccountId: string) => {
    try {
      const res = await authenticatedFetch(`/credit-cards/${card.id}/manage_installment/${installmentId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subaccount_id: subaccountId })
      });"""

new_handler = """  const handleBindInstallmentToSubaccount = async (installmentId: string, subaccountId: string, mode: 'single' | 'future' = 'single') => {
    try {
      const res = await authenticatedFetch(`/credit-cards/${card.id}/manage_installment/${installmentId}/?mode=${mode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subaccount_id: subaccountId })
      });
      setBindPrompt(null);"""
content = content.replace(old_handler, new_handler)

# Modify TableHead Conta to add Tooltip
old_thead = "<TableHead>Conta</TableHead>"
new_thead = """<TableHead>
                      <div className="flex items-center gap-1">
                        Conta
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px] text-xs">
                              <p>Vincular a despesa a um envelope garante que o limite seja provisionado no orçamento para cobrir a fatura.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableHead>"""
content = content.replace(old_thead, new_thead)

# Modify Select to GlobalAccountSelector
old_select = """<Select 
                          value={inst.subaccount ? inst.subaccount.id.toString() : undefined} 
                          onValueChange={(val) => handleBindInstallmentToSubaccount(inst.id, val)}
                        >
                          <SelectTrigger className={`h-7 text-xs rounded font-bold w-[140px] ${inst.subaccount ? 'bg-secondary/10 text-secondary border-transparent font-normal' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'}`}>
                            <SelectValue placeholder="Vincular Envelope" />
                          </SelectTrigger>
                          <SelectContent>
                            {subaccounts.map((sub: any) => (
                              <SelectItem key={sub.id} value={sub.id.toString()} className="text-xs">
                                {sub.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>"""

new_select = """<div className="w-[180px]">
                          <GlobalAccountSelector
                            value={inst.subaccount ? inst.subaccount.id.toString() : ""}
                            onValueChange={(val) => setBindPrompt({ isOpen: true, installmentId: inst.id, subaccountId: val })}
                            placeholder="Vincular Envelope"
                            filterLeafOnly={true}
                            className={`h-7 text-xs rounded-md ${inst.subaccount ? 'bg-secondary/10 border-transparent font-normal text-secondary' : 'bg-amber-500/10 border-amber-500/30 font-bold text-amber-500'}`}
                          />
                        </div>"""
content = content.replace(old_select, new_select)

# Insert Dialog JSX at the end of the return statement
old_end = """    </div>
  );
};"""
new_end = """
      {/* Modal de Confirmação de Repasse */}
      <Dialog open={bindPrompt?.isOpen} onOpenChange={(open) => { if (!open) setBindPrompt(null); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Vincular Envelope</DialogTitle>
            <DialogDescription>
              Deseja aplicar essa vinculação apenas nesta parcela, ou replicá-la automaticamente para todas as parcelas futuras desta compra?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => bindPrompt && handleBindInstallmentToSubaccount(bindPrompt.installmentId, bindPrompt.subaccountId, 'single')}
              className="justify-start"
            >
              Somente esta parcela
            </Button>
            <Button 
              variant="default" 
              onClick={() => bindPrompt && handleBindInstallmentToSubaccount(bindPrompt.installmentId, bindPrompt.subaccountId, 'future')}
              className="justify-start bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
            >
              Todas as futuras
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};"""
content = content.replace(old_end, new_end)

with open('C:/Users/mathe/PROJETO-YNAB/Ynab/src/modules/finance/components/BillDetailsView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('BillDetailsView.tsx patched successfully.')
