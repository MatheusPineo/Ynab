import { useState, useMemo, useEffect } from "react";
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
import { INVESTMENT_TAXONOMY } from "@/constants/investmentTaxonomy";
import { CountryCombobox } from "./CountryCombobox";
import { CurrencyInput } from "@/shared/components/ui/currency-input";

interface Props {
  children?: React.ReactNode;
}

const mapSpecificTypeToBackendAssetType = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('aç') || t.includes('stock') || t.includes('bdr') || t.includes('opç') || t.includes('futuro')) return 'STOCK';
    if (t.includes('fii') || t.includes('fiagro') || t.includes('reit')) return 'FII';
    if (t.includes('etf')) return 'ETF';
    if (t.includes('cripto') || t.includes('stable') || t.includes('nft') || t.includes('staking')) return 'CRYPTO';
    if (t.includes('bond') || t.includes('treasury')) return 'BOND';
    if (t.includes('tesouro')) return 'TREASURY';
    if (t.includes('fundo') || t.includes('mutual')) return 'MUTUAL_FUND';
    return 'FIXED_INCOME';
};

export const AddInvestmentActivityModal = ({ children }: Props) => {
  const [open, setOpen] = useState(false);
  
  // Taxonomy States
  const [custodyRegion, setCustodyRegion] = useState<string>("BR");
  const [macroGroup, setMacroGroup] = useState<string>("Renda Variável");
  const [specificType, setSpecificType] = useState<string>("Ações / Units");

  const taxonomyRegion = custodyRegion === "BR" ? "BR" : "GLOBAL";

  const availableMacroGroups = useMemo(() => {
    return [
      ...Object.keys(INVESTMENT_TAXONOMY[taxonomyRegion] || {}),
      ...Object.keys(INVESTMENT_TAXONOMY["UNIVERSAL"] || {})
    ];
  }, [taxonomyRegion]);

  const availableSpecificTypes = useMemo(() => {
    if (INVESTMENT_TAXONOMY[taxonomyRegion]?.[macroGroup]) {
      return INVESTMENT_TAXONOMY[taxonomyRegion][macroGroup];
    } else if (INVESTMENT_TAXONOMY["UNIVERSAL"]?.[macroGroup]) {
      return INVESTMENT_TAXONOMY["UNIVERSAL"][macroGroup];
    }
    return [];
  }, [taxonomyRegion, macroGroup]);

  // Sync resets
  useEffect(() => {
    const firstMacro = availableMacroGroups[0];
    if (firstMacro && !availableMacroGroups.includes(macroGroup)) {
      setMacroGroup(firstMacro);
    }
  }, [availableMacroGroups, macroGroup]);

  useEffect(() => {
    const firstType = availableSpecificTypes[0];
    if (firstType && !availableSpecificTypes.includes(specificType)) {
      setSpecificType(firstType);
    }
  }, [availableSpecificTypes, specificType]);

  const [liquidityDaily, setLiquidityDaily] = useState(false);
  
  // Real-time calculation states
  const [rfValor, setRfValor] = useState<number>(0);
  const [rvQuantidade, setRvQuantidade] = useState<string>("1");
  const [rvPreco, setRvPreco] = useState<number>(0);
  const [rvCustos, setRvCustos] = useState<number>(0);
  
  // Renda Variável states
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [isNewAsset, setIsNewAsset] = useState(false);

  const { assets, createActivity, createAsset } = useWealthStore();
  
  const isFixedIncome = macroGroup === "Renda Fixa Brasileira" || macroGroup === "Renda Fixa Global";

  const valorTotal = useMemo(() => {
      if (isFixedIncome) {
          return rfValor || 0;
      } else {
          const q = parseFloat(rvQuantidade || "0");
          const p = rvPreco || 0;
          const c = rvCustos || 0;
          return (q * p) + c;
      }
  }, [isFixedIncome, rfValor, rvQuantidade, rvPreco, rvCustos]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
        let assetId = selectedAssetId;
        const backendAssetType = mapSpecificTypeToBackendAssetType(specificType);

        if (isFixedIncome) {
            const issuer = formData.get("issuer") as string;
            const titleType = formData.get("title_type") as string;
            const indexer = formData.get("indexer") as string;
            const rateType = formData.get("rate_type") as string;
            const dueDate = formData.get("due_date") as string;
            
            const createdAsset = await createAsset({
                ticker: `${titleType} ${indexer}`,
                name: `${titleType} ${issuer} ${rateType === 'POS' ? 'Pós-fixado' : rateType === 'PRE' ? 'Prefixado' : 'Misto'}`,
                asset_type: backendAssetType,
                market_country: custodyRegion,
                asset_category: macroGroup,
                currency: custodyRegion === "BR" ? "BRL" : "USD",
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
                asset_type: backendAssetType,
                market_country: custodyRegion,
                asset_category: macroGroup,
                currency: custodyRegion === "BR" ? "BRL" : "USD"
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
            const principal = rfValor || 0;
            const cdiPercentage = parseFloat(formData.get("cdi_percentage") as string) || 0;
            
            await createActivity({
                asset: parseInt(assetId),
                activity_type: "BUY",
                date: formData.get("date") as string,
                quantity: 1,
                unit_price: principal,
                principal_amount: principal,
                cdi_percentage: formData.get("indexer") === "CDI" ? cdiPercentage : null,
                fees: 0
            });
        } else {
            const qty = parseFloat(rvQuantidade) || 0;
            const unitPrice = rvPreco || 0;
            const fees = rvCustos || 0;
            
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
        setRfValor(0);
        setRvQuantidade("1");
        setRvPreco(0);
        setRvCustos(0);
    } catch (error: any) {
        toast.error(error.message || "Erro ao registrar atividade");
    }
  };

  const rvAssets = assets.filter(a => a.asset_type !== "FIXED_INCOME" && a.asset_type !== "TREASURY" && a.asset_type !== "BOND");

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
          
          <div className="grid gap-4 bg-background/20 p-4 rounded-xl border border-border/60">
            <div className="grid gap-2">
              <Label>Onde o ativo está custodiado?</Label>
              <CountryCombobox value={custodyRegion} onChange={setCustodyRegion} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="macroGroup">Macro Grupo</Label>
              <Select value={macroGroup} onValueChange={setMacroGroup}>
                <SelectTrigger className="bg-background/50 border-border/60 rounded-xl font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-border/60">
                  {availableMacroGroups.map((group) => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="specificType">Tipo Específico</Label>
              <Select value={specificType} onValueChange={setSpecificType}>
                <SelectTrigger className="bg-background/50 border-border/60 rounded-xl font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-border/60">
                  {availableSpecificTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                    <Select name="title_type" defaultValue={specificType.includes("Tesouro") ? "TESOURO" : "CDB"}>
                      <SelectTrigger className="bg-background/50 border-border/60 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass border-border/60">
                        {specificType.includes("Tesouro") ? (
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
                    <Select name="indexer" defaultValue={specificType.includes("Tesouro") ? "SELIC" : "CDI"}>
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
                    <Label htmlFor="cdi_percentage">Taxa <span className="text-muted-foreground font-normal text-xs">(%)</span></Label>
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
                    <Label htmlFor="principal_amount">Valor Aplicado <span className="text-muted-foreground font-normal text-xs"></span></Label>
                    <CurrencyInput 
                      id="principal_amount" 
                      value={rfValor}
                      onChange={setRfValor}
                      placeholder="0,00" 
                      className="bg-background/50 text-left" 
                      required
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
                    <Input id="due_date" name="due_date" type="date" required className="bg-background/50" />
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
                    <Label htmlFor="unit_price">Preço Unitário</Label>
                    <CurrencyInput 
                      id="unit_price" 
                      value={rvPreco}
                      onChange={setRvPreco}
                      placeholder="0,00" 
                      required 
                      className="bg-background/50 text-left" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fees">Outros custos / Taxas</Label>
                    <CurrencyInput 
                      id="fees" 
                      value={rvCustos}
                      onChange={setRvCustos}
                      placeholder="0,00" 
                      className="bg-background/50 text-left" 
                    />
                  </div>
              </div>
            </div>
          )}

          <div className="mt-2 px-4 py-3 rounded-xl bg-muted/40 border border-border/60 flex justify-between items-center">
            <span className="font-semibold text-foreground/80">Valor total</span>
            <span className="font-bold text-lg">
                {custodyRegion === "BR" ? "R$" : "$"} {valorTotal.toLocaleString(custodyRegion === "BR" ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
