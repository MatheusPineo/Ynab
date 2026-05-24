import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Upload, FileUp } from "lucide-react";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { useTransactions } from "@/shared/hooks/useTransactions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { toast } from "sonner";
import { GlobalAccountSelector } from "@/shared/components/ui/global-account-selector";

export const ImportModal = ({ children }: { children?: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { tree, fetchAccounts } = useAccountStore();
  const { importFile } = useTransactions();

  const getLeafAccounts = (nodes: any[]): any[] => {
    let leaves: any[] = [];
    if (!nodes || !Array.isArray(nodes)) return leaves;
    nodes.forEach(node => {
      if (node.children && Array.isArray(node.children) && node.children.length > 0) {
        leaves = [...leaves, ...getLeafAccounts(node.children)];
      } else {
        leaves.push(node);
      }
    });
    return leaves;
  };
  
  const leafAccounts = getLeafAccounts(tree);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      toast.error("Por favor, selecione um arquivo.");
      return;
    }
    if (!accountId) {
      toast.error("Por favor, selecione a conta de destino.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("account", accountId);

    try {
      await importFile.mutateAsync(formData);
      await fetchAccounts(); // recarrega árvore de contas para atualizar saldos
      setOpen(false);
      setFile(null);
      setAccountId("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      // erro é tratado no hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        setFile(null);
        setAccountId("");
      }
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="border-border/60 bg-muted/20 hover:bg-muted/40 font-semibold gap-2 shadow-sm rounded-full">
            <Upload className="h-4 w-4" />
            Importar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass border-border/60">
        <DialogHeader>
          <DialogTitle>Importar Transações</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="account">Conta de Destino</Label>
            <GlobalAccountSelector
              value={accountId}
              onValueChange={setAccountId}
              placeholder="Selecione uma conta"
              filterLeafOnly={true}
            />
          </div>

          <div className="grid gap-2">
            <Label>Arquivo (CSV ou OFX)</Label>
            <div 
              className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${file ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/50 bg-background/30'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept=".csv,.ofx" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <FileUp className={`h-8 w-8 mb-2 ${file ? 'text-primary' : 'text-muted-foreground'}`} />
              {file ? (
                <p className="text-sm font-medium text-primary text-center truncate w-full px-4">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm font-medium">Clique para selecionar</p>
                  <p className="text-xs text-muted-foreground mt-1">Extensões suportadas: .csv, .ofx</p>
                </>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="submit" className="w-full gradient-primary" disabled={importFile.isPending}>
              {importFile.isPending ? "Importando..." : "Iniciar Importação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
