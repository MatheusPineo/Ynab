import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { useAssetStore, type Asset } from "../store/useAssetStore";
import { useDebtStore } from "../store/useDebtStore";
import { CurrencyInput } from "@/shared/components/ui/currency-input";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetToEdit?: Asset | null;
}

export const AddAssetModal = ({ open, onOpenChange, assetToEdit }: Props) => {
  const { createAsset, updateAsset } = useAssetStore();
  const { debts, fetchDebts } = useDebtStore();

  const [name, setName] = useState("");
  const [purchaseValue, setPurchaseValue] = useState(0);
  const [currentMarketValue, setCurrentMarketValue] = useState(0);
  const [liquidityTier, setLiquidityTier] = useState<Asset["liquidity_tier"]>("IMMEDIATE");
  const [linkedDebt, setLinkedDebt] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchDebts();
      if (assetToEdit) {
        setName(assetToEdit.name);
        setPurchaseValue(assetToEdit.purchase_value);
        setCurrentMarketValue(assetToEdit.current_market_value);
        setLiquidityTier(assetToEdit.liquidity_tier);
        setLinkedDebt(assetToEdit.linked_debt);
      } else {
        setName("");
        setPurchaseValue(0);
        setCurrentMarketValue(0);
        setLiquidityTier("IMMEDIATE");
        setLinkedDebt(null);
      }
    }
  }, [open, assetToEdit, fetchDebts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name,
        purchase_value: purchaseValue,
        current_market_value: currentMarketValue,
        liquidity_tier: liquidityTier,
        linked_debt: linkedDebt === "none" ? null : linkedDebt,
      };

      if (assetToEdit) {
        await updateAsset(assetToEdit.id, payload);
      } else {
        await createAsset(payload);
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border/60 rounded-2xl max-w-md w-full shadow-elevated">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            {assetToEdit ? "Editar Ativo" : "Registrar Novo Ativo"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Nome */}
          <div className="space-y-1">
            <Label htmlFor="asset-name" className="text-xs text-muted-foreground font-medium">Nome do Ativo</Label>
            <Input
              id="asset-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Apartamento, Carro SUV, Reserva de Ouro"
              className="bg-background/40 border-border/50 rounded-xl"
              required
            />
          </div>

          {/* Valores de Compra e Mercado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground font-medium">Valor de Compra</Label>
              <CurrencyInput
                value={purchaseValue}
                onChange={setPurchaseValue}
                className="bg-background/40 border-border/50 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground font-medium">Valor de Mercado Atual</Label>
              <CurrencyInput
                value={currentMarketValue}
                onChange={setCurrentMarketValue}
                className="bg-background/40 border-border/50 rounded-xl"
              />
            </div>
          </div>

          {/* Nível de Liquidez */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground font-medium">Grau de Liquidez</Label>
            <Select
              value={liquidityTier}
              onValueChange={(v: any) => setLiquidityTier(v)}
            >
              <SelectTrigger className="bg-background/40 border-border/50 rounded-xl">
                <SelectValue placeholder="Selecione a liquidez" />
              </SelectTrigger>
              <SelectContent className="glass border-border/60">
                <SelectItem value="IMMEDIATE">Liquidez Imediata (Resgate Hoje)</SelectItem>
                <SelectItem value="MEDIUM">Liquidez Média (Dias/Semanas)</SelectItem>
                <SelectItem value="ILLIQUID">Ilíquido / Sem Liquidez (Imóveis/Bens)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dívida Vinculada */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground font-medium">Vincular Financiamento/Dívida (Opcional)</Label>
            <Select
              value={linkedDebt || "none"}
              onValueChange={(v) => setLinkedDebt(v === "none" ? null : v)}
            >
              <SelectTrigger className="bg-background/40 border-border/50 rounded-xl">
                <SelectValue placeholder="Selecione um financiamento" />
              </SelectTrigger>
              <SelectContent className="glass border-border/60">
                <SelectItem value="none">Nenhum Financiamento</SelectItem>
                {debts
                  .filter((d) => d.is_mine)
                  .map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.counterparty_name} ({d.currency} {d.amount_remaining.toFixed(2)})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-1.5" /> Cancelar
            </Button>
            <Button
              type="submit"
              className="gradient-primary text-primary-foreground rounded-xl shadow-glow"
              disabled={isSubmitting}
            >
              <Check className="h-4 w-4 mr-1.5" /> {assetToEdit ? "Salvar" : "Registrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
