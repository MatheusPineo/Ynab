import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Plus } from "lucide-react";
import { useWealthStore } from "@/modules/finance/store/useWealthStore";
import { toast } from "sonner";

interface Props {
  children?: React.ReactNode;
}

export const AddInvestmentActivityModal = ({ children }: Props) => {
  const [open, setOpen] = useState(false);
  const [assetType, setAssetType] = useState<string>("FIXED_INCOME");
  const [liquidityDaily, setLiquidityDaily] = useState(false);
  
  // Real-time calculation states
  const [rfValor, setRfValor] = useState<string>("");
  const [rvQuantidade, setRvQuantidade] = useState<string>("1");
  const [rvPreco, setRvPreco] = useState<string>("");
  const [rvCustos, setRvCustos] = useState<string>("0");
  
  // Renda Variável states
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [isNewAsset, setIsNewAsset] = useState(false);

  const { assets, createActivity, createAsset } = useWealthStore();
  
  const isFixedIncome = assetType === "FIXED_INCOME" || assetType === "TREASURY";

  // Calculate dynamic total
  const valorTotal = useMemo(() => {
      if (isFixedIncome) {
          return parseFloat(rfValor || "0");
      } else {
          const q = parseFloat(rvQuantidade || "0");
          const p = parseFloat(rvPreco || "0");
          const c = parseFloat(rvCustos || "0");
          return (q * p) + c;
      }
  }, [isFixedIncome, rfValor, rvQuantidade, rvPreco, rvCustos]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
        let assetId = selectedAssetId;

        if (isFixedIncome) {
            // Para Renda Fixa, sempre criamos um novo ativo ou tranche
            const issuer = formData.get("issuer") as string;
            const titleType = formData.get("title_type") as string;
            const indexer = formData.get("indexer") as string;
            const rateType = formData.get("rate_type") as string;
            const dueDate = formData.get("due_date") as string;
            
            const createdAsset = await createAsset({
                ticker: `${titleType} ${indexer}`, // Ex: CDB CDI
                name: `${titleType} ${issuer} ${rateType === 'POS' ? 'Pós-fixado' : rateType === 'PRE' ? 'Prefixado' : 'Misto'}`,
                asset_type: assetType,
                currency: "BRL",
                issuer: issuer,
                title_type: titleType,
                indexer: indexer,
                rate_type: rateType,
                due_date: dueDate || null,
                liquidity_daily: liquidityDaily
            });
            
            if (createdAsset && createdAsset.id) {
                assetId = createdAsset.id.toString();
            } else {
                throw new Error("Erro inesperado ao criar o ativo de Renda Fixa.");
            }
        } else if (isNewAsset) {
            const newTicker = formData.get("new_asset_ticker") as string;
            const newName = formData.get("new_asset_name") as string;
            
            if (!newTicker || !newName) {
                toast.error("Preencha todos os campos do novo ativo.");
                return;
            }
            
            const createdAsset = await createAsset({
                ticker: newTicker.toUpperCase(),
                name: newName,
                asset_type: assetType,
                currency: "BRL"
            });
            
            if (createdAsset && createdAsset.id) {
                assetId = createdAsset.id.toString();
            } else {
                throw new Error("Erro inesperado ao criar o ativo.");
            }
        }

        if (!assetId) {
            toast.error("Por favor, selecione ou crie um ativo.");
            return;
        }

        if (isFixedIncome) {
            const principal = parseFloat(rfValor) || 0;
            const cdiPercentage = parseFloat(formData.get("cdi_percentage") as string) || 0;
            
            await createActivity({
                asset: parseInt(assetId),
                activity_type: "BUY",
                date: formData.get("date") as string,
                quantity: 1, // Representa 1 contrato inteiro de RF
                unit_price: principal,
                principal_amount: principal,
                cdi_percentage: indexer === "CDI" ? cdiPercentage : null,
                fees: 0
            });
        } else {
            const qty = parseFloat(rvQuantidade) || 0;
            const unitPrice = parseFloat(rvPreco) || 0;
            const fees = parseFloat(rvCustos) || 0;
            
            await createActivity({
                asset: parseInt(assetId),
                activity_type: formData.get("activity_type") as any || "BUY",
                date: formData.get("date") as string,
                quantity: qty,
                unit_price: unitPrice,
                fees: fees
            });
        }
        
        toast.success("Lançamento registrado com sucesso!");
        setOpen(false);
        // Reset states
        setRfValor("");
        setRvQuantidade("1");
        setRvPreco("");
        setRvCustos("0");
    } catch (error: any) {
        toast.error(error.message || "Erro ao registrar atividade");
    }
  };

  const rvAssets = assets.filter(a => a.asset_type !== "FIXED_INCOME" && a.asset_type !== "TREASURY");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Adicionar Lançamento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] glass border-border/60 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Lançamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5 py-2">
          
          <div className="grid gap-2">
            <Label htmlFor="assetType">Tipo de ativo</Label>
            <Select value={assetType} onValueChange={setAssetType}>
              <SelectTrigger className="bg-background/50 border-border/60 rounded-xl font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass border-border/60">
                <SelectItem value="FIXED_INCOME">Renda Fixa (CDB/LCI/LCA/LC/LF)</SelectItem>
                <SelectItem value="TREASURY">Tesouro Direto</SelectItem>
                <SelectItem value="STOCK">Ações</SelectItem>
                <SelectItem value="FII">Fundos Imobiliários (FIIs)</SelectItem>
                <SelectItem value="ETF">ETFs</SelectItem>
                <SelectItem value="CRYPTO">Criptomoedas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isFixedIncome ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="issuer">Emissor</Label>
                    <Input id="issuer" name="issuer" placeholder="Ex: Itaú, Nubank" required className="bg-background/50" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="title_type">Tipo de título</Label>
                    <Select name="title_type" defaultValue={assetType === "TREASURY" ? "TESOURO" : "CDB"}>
                      <SelectTrigger className="bg-background/50 border-border/60 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass border-border/60">
                        {assetType === "TREASURY" ? (
                          <>
                            <SelectItem value="SELIC">Tesouro Selic</SelectItem>
                            <SelectItem value="IPCA">Tesouro IPCA+</SelectItem>
                            <SelectItem value="PREFIXADO">Tesouro Prefixado</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="CDB">CDB</SelectItem>
                            <SelectItem value="LCI">LCI</SelectItem>
                            <SelectItem value="LCA">LCA</SelectItem>
                            <SelectItem value="LC">LC</SelectItem>
                            <SelectItem value="LF">LF</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="indexer">Indexador</Label>
                    <Select name="indexer" defaultValue={assetType === "TREASURY" ? "SELIC" : "CDI"}>
                      <SelectTrigger className="bg-background/50 border-border/60 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass border-border/60">
                        <SelectItem value="CDI">CDI</SelectItem>
                        <SelectItem value="SELIC">SELIC</SelectItem>
                        <SelectItem value="IPCA">IPCA</SelectItem>
                        <SelectItem value="PRE">PRÉ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cdi_percentage">Taxa do CDI <span className="text-muted-foreground font-normal text-xs">(%)</span></Label>
                    <div className="relative">
                        <Input id="cdi_percentage" name="cdi_percentage" type="number" step="0.01" placeholder="Ex: 110" className="bg-background/50 pr-8" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">%</span>
                    </div>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="rate_type">Forma <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></Label>
                    <Select name="rate_type" defaultValue="POS">
                      <SelectTrigger className="bg-background/50 border-border/60 rounded-xl text-muted-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass border-border/60">
                        <SelectItem value="POS">Pós-fixado</SelectItem>
                        <SelectItem value="PRE">Prefixado</SelectItem>
                        <SelectItem value="MIX">Misto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="principal_amount">Valor <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></Label>
                    <Input 
                      id="principal_amount" 
                      name="principal_amount" 
                      type="number" 
                      step="0.01" 
                      placeholder="0,00" 
                      value={rfValor}
                      onChange={(e) => setRfValor(e.target.value)}
                      className="bg-background/50" 
                    />
                  </div>
              </div>

              <div className="flex items-center space-x-2 py-2">
                  <Switch id="liquidity_daily" checked={liquidityDaily} onCheckedChange={setLiquidityDaily} />
                  <Label htmlFor="liquidity_daily" className="font-medium cursor-pointer">Liquidez diária</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Data da compra</Label>
                    <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-background/50" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="due_date">Data de vencimento</Label>
                    <Input id="due_date" name="due_date" type="date" className="bg-background/50" />
                  </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2 col-span-2">
                    <Label htmlFor="asset">Ativo</Label>
                    <div className="flex gap-2">
                        <Select value={selectedAssetId} onValueChange={setSelectedAssetId} disabled={isNewAsset} required={!isNewAsset}>
                        <SelectTrigger className="bg-background/50 border-border/60 rounded-xl flex-1 text-muted-foreground">
                            <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent className="glass border-border/60 max-h-[200px]">
                            {rvAssets.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">Nenhum ativo.</div>
                            ) : (
                                rvAssets.map(asset => (
                                    <SelectItem key={asset.id} value={asset.id.toString()}>
                                        {asset.ticker} - {asset.name}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" className="border-border/60" onClick={() => setIsNewAsset(!isNewAsset)}>
                            {isNewAsset ? "Cancelar" : "+ Novo"}
                        </Button>
                    </div>
                </div>
              </div>

              {isNewAsset && (
                  <div className="grid gap-4 p-4 border rounded-xl bg-background/20 border-dashed border-border/60 animate-in fade-in duration-200">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cadastro de Ativo</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Ticker</Label>
                            <Input name="new_asset_ticker" placeholder="Ex: BOVA11" className="bg-background/50" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Nome / Empresa</Label>
                            <Input name="new_asset_name" placeholder="Ex: Banco do Brasil" className="bg-background/50" />
                        </div>
                      </div>
                  </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Data da compra</Label>
                    <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-background/50" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantidade</Label>
                    <Input 
                      id="quantity" 
                      name="quantity" 
                      type="number" 
                      step="0.00000001" 
                      placeholder="1" 
                      required 
                      value={rvQuantidade}
                      onChange={(e) => setRvQuantidade(e.target.value)}
                      className="bg-background/50" 
                    />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="unit_price">Preço em R$</Label>
                    <Input 
                      id="unit_price" 
                      name="unit_price" 
                      type="number" 
                      step="0.01" 
                      placeholder="0,00" 
                      required 
                      value={rvPreco}
                      onChange={(e) => setRvPreco(e.target.value)}
                      className="bg-background/50" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fees">Outros custos <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></Label>
                    <Input 
                      id="fees" 
                      name="fees" 
                      type="number" 
                      step="0.01" 
                      placeholder="0,00" 
                      value={rvCustos}
                      onChange={(e) => setRvCustos(e.target.value)}
                      className="bg-background/50" 
                    />
                  </div>
              </div>
            </div>
          )}

          <div className="mt-2 px-4 py-3 rounded-xl bg-muted/40 border border-border/60 flex justify-between items-center">
            <span className="font-semibold text-foreground/80">Valor total</span>
            <span className="font-bold text-lg">
                R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <DialogFooter className="mt-2 flex items-center gap-2 sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl px-6">Cancelar</Button>
            <Button type="submit" className="flex-1 gradient-primary rounded-xl">+ Adicionar Lançamento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
