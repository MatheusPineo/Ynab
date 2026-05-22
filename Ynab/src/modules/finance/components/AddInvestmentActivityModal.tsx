import { useState } from "react";
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
import { Plus } from "lucide-react";
import { useWealthStore } from "@/modules/finance/store/useWealthStore";
import { toast } from "sonner";

interface Props {
  children?: React.ReactNode;
}

export const AddInvestmentActivityModal = ({ children }: Props) => {
  const [open, setOpen] = useState(false);
  const [isNewAsset, setIsNewAsset] = useState(false);
  const { assets, createActivity, createAsset } = useWealthStore();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    let assetId = formData.get("asset") as string;
    
    try {
        if (isNewAsset) {
            const newTicker = formData.get("new_asset_ticker") as string;
            const newName = formData.get("new_asset_name") as string;
            const newType = formData.get("new_asset_type") as any;
            
            if (!newTicker || !newName || !newType) {
                toast.error("Preencha todos os campos do novo ativo.");
                return;
            }
            
            const createdAsset = await createAsset({
                ticker: newTicker.toUpperCase(),
                name: newName,
                asset_type: newType,
                currency: "BRL"
            });
            
            if (createdAsset && createdAsset.id) {
                assetId = createdAsset.id.toString();
            } else {
                throw new Error("Erro inesperado ao criar o ativo.");
            }
        }

        if (!assetId) {
            toast.error("Por favor, selecione um ativo.");
            return;
        }

        await createActivity({
            asset: parseInt(assetId),
            activity_type: formData.get("activity_type") as any,
            date: formData.get("date") as string,
            quantity: parseFloat(formData.get("quantity") as string) || 0,
            unit_price: parseFloat(formData.get("unit_price") as string) || 0,
            fees: parseFloat(formData.get("fees") as string) || 0,
        });
        toast.success("Aporte/Atividade registrada com sucesso!");
        setOpen(false);
    } catch (error: any) {
        toast.error(error.message || "Erro ao registrar atividade");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Novo Aporte
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass border-border/60 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Atividade de Investimento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          <div className="grid gap-2">
            <Label htmlFor="asset">Ativo</Label>
            <div className="flex gap-2">
                <Select name="asset" disabled={isNewAsset} required={!isNewAsset}>
                <SelectTrigger className="bg-background/50 border-border/60 rounded-xl flex-1">
                    <SelectValue placeholder="Selecione um ativo" />
                </SelectTrigger>
                <SelectContent className="glass border-border/60 max-h-[200px]">
                    {assets.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">Nenhum ativo cadastrado.</div>
                    ) : (
                        assets.map(asset => (
                            <SelectItem key={asset.id} value={asset.id.toString()}>
                                {asset.ticker} - {asset.name}
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
                </Select>
                <Button type="button" variant="outline" className="border-border/60" onClick={() => setIsNewAsset(!isNewAsset)}>
                    {isNewAsset ? "Cancelar" : "+ Novo Ativo"}
                </Button>
            </div>
          </div>

          {isNewAsset && (
              <div className="grid gap-4 p-4 border rounded-xl bg-background/20 border-dashed border-border/60">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Cadastro Rápido de Ativo</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-2">
                        <Label>Ticker</Label>
                        <Input name="new_asset_ticker" placeholder="Ex: BOVA11" className="bg-background/50" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Tipo</Label>
                        <Select name="new_asset_type" defaultValue="STOCK">
                            <SelectTrigger className="bg-background/50 border-border/60 rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass border-border/60">
                                <SelectItem value="STOCK">Ações</SelectItem>
                                <SelectItem value="FIXED_INCOME">Renda Fixa</SelectItem>
                                <SelectItem value="FII">FIIs</SelectItem>
                                <SelectItem value="CRYPTO">Criptomoedas</SelectItem>
                                <SelectItem value="ETF">ETF</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Nome / Empresa</Label>
                    <Input name="new_asset_name" placeholder="Ex: iShares Ibovespa ETF" className="bg-background/50" />
                  </div>
              </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="activity_type">Tipo de Atividade</Label>
            <Select name="activity_type" defaultValue="BUY" required>
              <SelectTrigger className="bg-background/50 border-border/60 rounded-xl">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="glass border-border/60">
                <SelectItem value="BUY">Compra (Aporte)</SelectItem>
                <SelectItem value="SELL">Venda</SelectItem>
                <SelectItem value="DIVIDEND">Dividendo</SelectItem>
                <SelectItem value="SPLIT">Desdobramento (Split)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="date">Data da Operação</Label>
            <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-background/50" />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input id="quantity" name="quantity" type="number" step="0.00000001" placeholder="Ex: 100" required className="bg-background/50" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="unit_price">Preço Unitário (R$)</Label>
                <Input id="unit_price" name="unit_price" type="number" step="0.01" placeholder="Ex: 25.50" required className="bg-background/50" />
              </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fees">Taxas / Emolumentos (R$)</Label>
            <Input id="fees" name="fees" type="number" step="0.01" placeholder="Ex: 2.50" defaultValue="0" className="bg-background/50" />
          </div>

          <DialogFooter className="mt-4">
            <Button type="submit" className="w-full gradient-primary">Confirmar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
