import { useState, useEffect, useMemo, useRef } from "react";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { GlobalAccountSelector } from "@/shared/components/ui/global-account-selector";
import { useInboxStore, type TransactionInbox } from "@/modules/finance/store/useInboxStore";
import { formatMoney } from "@/shared/lib/currency-utils";
import { CurrencyInput } from "@/shared/components/ui/currency-input";
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
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { HelpTooltip } from "@/shared/components/ui/help-tooltip";
import {
  Sparkles,
  Upload,
  Trash2,
  Check,
  FileText,
  AlertTriangle,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  CheckCircle2,
  ArrowRightLeft,
  DollarSign,
  Smartphone,
  Bell
} from "lucide-react";
import { toast } from "sonner";

const Inbox = () => {
  const { inboxItems, isLoading, uploadProgress, uploadTotal, fetchInboxItems, uploadInboxFiles, approveInboxItem, deleteInboxItem } = useInboxStore();
  const { tree, categoryGroups, fetchAccounts, fetchCategoryGroups } = useAccountStore();
  
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return inboxItems.find((item) => item.id === selectedItemId) || null;
  }, [inboxItems, selectedItemId]);
  
  // Img Zoom & Rotate State
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [isIncome, setIsIncome] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTxIndex, setActiveTxIndex] = useState<number>(0);

  // Fetch initial data
  useEffect(() => {
    fetchInboxItems();
    fetchAccounts();
    fetchCategoryGroups();
  }, [fetchInboxItems, fetchAccounts, fetchCategoryGroups]);

  // Atualiza automaticamente o status quando houver itens processando ou pendentes
  useEffect(() => {
    const hasActiveProcessing = inboxItems.some(
      (item) => item.status === "pending" || item.status === "processing"
    );

    if (!hasActiveProcessing) return;

    const interval = setInterval(() => {
      fetchInboxItems();
    }, 3000); // Polling a cada 3 segundos

    return () => clearInterval(interval);
  }, [inboxItems, fetchInboxItems]);

  // Reset activeTxIndex to first unapproved when changing selectedItem
  useEffect(() => {
    if (selectedItem) {
      const txs = selectedItem.ai_suggestions?.transactions || [];
      const firstUnapproved = txs.findIndex(t => !t.approved);
      setActiveTxIndex(firstUnapproved !== -1 ? firstUnapproved : 0);
    } else {
      setActiveTxIndex(0);
    }
  }, [selectedItem?.id]);

  // Sync Form State when Selected Staging Item or activeTxIndex changes
  useEffect(() => {
    if (selectedItem) {
      const suggestions = selectedItem.ai_suggestions || {};
      const txs = suggestions.transactions || [];
      
      if (txs.length > 0) {
        let idx = activeTxIndex;
        if (idx >= txs.length) {
          idx = 0;
        }
        const currentTx = txs[idx];
        if (currentTx) {
          setMerchant(currentTx.merchant || "Desconhecido");
          setAmount(currentTx.amount !== undefined && currentTx.amount !== null ? String(currentTx.amount) : "");
          setDate(currentTx.date || new Date().toISOString().split("T")[0]);
          setSelectedAccountId(currentTx.account || suggestions.account || "");
          setSelectedCategoryId(currentTx.category || suggestions.category || "");
          setIsIncome(currentTx.is_income === true || suggestions.is_income === true);
        }
      } else {
        setMerchant(suggestions.merchant || "Desconhecido");
        setAmount(suggestions.amount !== undefined && suggestions.amount !== null ? String(suggestions.amount) : "");
        setDate(suggestions.date || new Date().toISOString().split("T")[0]);
        setSelectedAccountId(suggestions.account || "");
        setSelectedCategoryId(suggestions.category || "");
        setIsIncome(suggestions.is_income === true);
      }
      setZoom(1);
      setRotation(0);
    } else {
      setMerchant("");
      setAmount("");
      setDate("");
      setSelectedAccountId("");
      setSelectedCategoryId("");
      setIsIncome(false);
    }
  }, [selectedItem, activeTxIndex]);

  // Auto-select first item if none selected or if current selected is no longer in list
  useEffect(() => {
    const isCurrentStillInList = inboxItems.some(item => item.id === selectedItemId);
    
    if (inboxItems.length > 0 && (!selectedItemId || !isCurrentStillInList)) {
      setSelectedItemId(inboxItems[0].id);
    } else if (inboxItems.length === 0) {
      setSelectedItemId(null);
    }
  }, [inboxItems, selectedItemId]);

  // Flatten accounts and categories for select options
  const allAccounts = useMemo(() => {
    const flatten = (nodes: any[]): any[] => {
      let result: any[] = [];
      nodes.forEach((n) => {
        result.push({ id: n.id, name: n.name, currency: n.currency });
        if (n.children) result = [...result, ...flatten(n.children)];
      });
      return result;
    };
    return flatten(tree);
  }, [tree]);

  const allCategories = useMemo(() => {
    const flatten = (nodes: any[]): any[] => {
      let result: any[] = [];
      nodes.forEach((n) => {
        if (n.children && n.children.length > 0) {
          result = [...result, ...flatten(n.children)];
        } else if (n.parent) {
          result.push({ id: n.id, name: n.name });
        }
      });
      return result;
    };
    return flatten(categoryGroups);
  }, [categoryGroups]);

  // Construct dynamic Media URL
  const getMediaUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8002/api";
    const domain = baseUrl.replace("/api", "");
    return `${domain}${url}`;
  };

  // Handle Drag & Drop Upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadInboxFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadInboxFiles(e.target.files);
    }
  };

  // Handle Approval Submission
  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (!selectedAccountId) {
      toast.error("Por favor, selecione uma Conta Financeira.");
      return;
    }

    if (!amount || isNaN(Number(amount))) {
      toast.error("Por favor, insira um valor numérico válido.");
      return;
    }

    if (!date) {
      toast.error("Por favor, insira uma data válida.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      account: selectedAccountId,
      category: selectedCategoryId === "none" || !selectedCategoryId ? null : selectedCategoryId,
      amount: Math.abs(Number(amount)),
      description: merchant || "Cupom Fiscal",
      date,
      is_income: isIncome,
      index: selectedItem.ai_suggestions?.transactions ? activeTxIndex : undefined
    };

    const success = await approveInboxItem(selectedItem.id, payload);
    setIsSubmitting(false);

    if (success) {
      // Ajusta o período do dashboard se a data da transação for diferente do período ativo
      const [txYear, txMonth] = date.split('-').map(Number);
      if (txYear && txMonth) {
        const store = useAccountStore.getState();
        if (store.currentMonth !== txMonth || store.currentYear !== txYear) {
          store.setCurrentPeriod(txMonth, txYear);
          const monthName = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
          ][txMonth - 1];
          toast.info(`Período ativo atualizado para ${monthName} de ${txYear} para visualização.`);
        }
      }

      // Encontra o item recém-atualizado do store para verificar se ainda restam transações pendentes no lote
      const updatedItems = useInboxStore.getState().inboxItems;
      const updatedItem = updatedItems.find(item => item.id === selectedItem.id);
      
      const remainingTxs = updatedItem?.ai_suggestions?.transactions || [];
      const hasMoreUnapproved = remainingTxs.some(t => !t.approved);
      
      if (hasMoreUnapproved && updatedItem) {
        setSelectedItemId(updatedItem.id);
        const nextUnapproved = remainingTxs.findIndex(t => !t.approved);
        if (nextUnapproved !== -1) {
          setActiveTxIndex(nextUnapproved);
        }
        toast.info("Transação homologada! Próxima compra do lote carregada.");
      } else {
        setSelectedItemId(null);
        setSelectedAccountId("");
        setSelectedCategoryId("");
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Inbox Inteligente
            <HelpTooltip content="Faça upload de cupons fiscais e recibos. O Gemini AI fará o parsing dos valores automaticamente para você revisar e criar transações em segundos." side="right" />
          </h1>
          <p className="text-sm text-muted-foreground">
            Área de staging inteligente para processamento multimodal e homologação de comprovantes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*,application/pdf"
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="gradient-primary text-white shadow-glow hover:scale-105 active:scale-95 transition-all flex items-center gap-2 rounded-xl"
            disabled={isLoading || uploadTotal > 0}
          >
            {uploadTotal > 0 ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Enviando {uploadProgress} de {uploadTotal}...</span>
              </>
            ) : isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Carregar Recibos
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Container */}
      {inboxItems.length === 0 ? (
        <Card
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border border-dashed border-border/60 bg-card/20 backdrop-blur-sm p-12 text-center rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:border-primary/50 group"
        >
          <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-soft">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Sua inbox está limpa!</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Arraste e solte seus cupons fiscais ou PDFs de comprovante aqui dentro, ou clique no botão de upload para que a nossa IA Gemini realize a extração instantânea.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border-border/40 hover:bg-muted/10 mt-2"
          >
            Selecionar Arquivos
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sidebar - Staging Items List (lg: col-span-3) */}
          <div className="lg:col-span-3 flex flex-col gap-3 max-h-[700px] overflow-y-auto pr-1">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground px-1">
              Fila de Staging ({inboxItems.length})
            </div>
            <div className="flex flex-col gap-2">
              {inboxItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const suggestions = item.ai_suggestions || {};
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`text-left p-3 rounded-xl border transition-all duration-200 flex flex-col gap-2 ${
                      isSelected
                        ? "bg-primary/5 border-primary shadow-soft"
                        : "bg-card/40 border-border/40 hover:bg-muted/10 hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="text-xs font-medium truncate text-foreground flex items-center gap-1.5 max-w-[150px]">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {item.file ? item.file.split("/").pop() : "Recibo"}
                      </span>
                      
                      {/* Status Badges */}
                      {item.status === "pending" && (
                        <Badge variant="outline" className="text-[9px] text-amber-500 bg-amber-500/10 border-transparent animate-pulse py-0 px-1">
                          Pendente
                        </Badge>
                      )}
                      {item.status === "processing" && (
                        <Badge variant="outline" className="text-[9px] text-blue-500 bg-blue-500/10 border-transparent py-0 px-1 flex items-center gap-1">
                          <Loader2 className="h-2 w-2 animate-spin" />
                          Processando
                        </Badge>
                      )}
                      {item.status === "ready" && (
                        <Badge variant="outline" className="text-[9px] text-emerald-500 bg-emerald-500/10 border-transparent py-0 px-1">
                          Pronto
                        </Badge>
                      )}
                      {item.status === "failed" && (
                        <Badge variant="outline" className="text-[9px] text-rose-500 bg-rose-500/10 border-transparent py-0 px-1">
                          Falhou
                        </Badge>
                      )}
                    </div>

                    {item.status === "ready" && (
                      <div className="flex items-center justify-between w-full text-[10px] text-muted-foreground">
                        {suggestions.transactions && suggestions.transactions.length > 0 ? (
                          <>
                            <span className="truncate max-w-[100px] font-semibold text-primary">
                              Lote ({suggestions.transactions.filter(t => !t.approved).length} pendentes)
                            </span>
                            <span className="font-bold text-foreground tabular-nums shrink-0">
                              {formatMoney(
                                suggestions.transactions
                                  .filter(t => !t.approved)
                                  .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0),
                                suggestions.transactions[0]?.currency || "BRL"
                              )}
                            </span>
                          </>
                        ) : suggestions.merchant ? (
                          <>
                            <span className="truncate max-w-[100px] font-semibold">{suggestions.merchant}</span>
                            {suggestions.amount !== undefined && (
                              <span className="font-bold text-foreground tabular-nums shrink-0">
                                {formatMoney(Number(suggestions.amount), suggestions.currency || "BRL")}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="truncate max-w-[100px] font-semibold text-muted-foreground">Comprovante</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details / Review Area - Split Screen (lg: col-span-9) */}
          <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedItem && (
              <>
                {/* Left Side - Image/Document Viewer or Mock Notification Bubble */}
                {selectedItem.file ? (
                  <Card className="rounded-2xl border-border/60 bg-card/20 backdrop-blur-sm overflow-hidden flex flex-col min-h-[580px] lg:h-[620px] shadow-soft">
                    <div className="h-10 border-b border-border/40 bg-muted/20 px-4 flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground truncate max-w-[180px]">
                        {selectedItem.file.split("/").pop()}
                      </span>
                      
                      {/* Zoom / Rotate Controls */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                          className="h-7 w-7 rounded-lg"
                          title="Zoom Out"
                        >
                          <ZoomOut className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                          className="h-7 w-7 rounded-lg"
                          title="Zoom In"
                        >
                          <ZoomIn className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRotation((r) => (r + 90) % 360)}
                          className="h-7 w-7 rounded-lg"
                          title="Rotacionar"
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-hidden relative flex items-center justify-center p-4 bg-muted/10">
                      <div
                        className="transition-transform duration-200 ease-out max-w-full max-h-full flex items-center justify-center"
                        style={{
                          transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        }}
                      >
                        <img
                          src={getMediaUrl(selectedItem.file)}
                          alt="Staging Document"
                          className="max-w-[90%] max-h-[500px] object-contain rounded-lg border border-border/40 shadow-soft"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                            toast.error("Erro ao carregar pré-visualização da imagem.");
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="rounded-2xl border-border/60 bg-card/20 backdrop-blur-sm overflow-hidden flex flex-col min-h-[580px] lg:h-[620px] shadow-soft justify-center items-center p-6 bg-slate-950/40 relative">
                    {/* Background glows */}
                    <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    {/* Smartphone Mockup Wrapper */}
                    <div className="w-full max-w-[280px] h-[480px] rounded-[36px] border-8 border-slate-800 bg-slate-950 shadow-2xl relative flex flex-col overflow-hidden">
                      {/* Speaker / Camera Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-b-xl z-20 flex items-center justify-center">
                        <div className="w-10 h-1 bg-slate-900 rounded-full" />
                      </div>
                      
                      {/* StatusBar mockup */}
                      <div className="pt-5 px-5 pb-2 flex justify-between items-center text-[10px] font-medium text-slate-400 z-10">
                        <span>09:41</span>
                        <div className="flex items-center gap-1">
                          <span className="w-3 h-2 bg-slate-400 rounded-sm inline-block" />
                          <span className="w-2.5 h-2.5 bg-slate-400 rounded-full inline-block" />
                        </div>
                      </div>
                      
                      {/* Lockscreen clock */}
                      <div className="flex flex-col items-center mt-6 mb-8 z-10">
                        <span className="text-3xl font-light text-slate-100 tracking-wide">09:41</span>
                        <span className="text-[10px] text-slate-400 mt-1">Terça-feira, 2 de Junho</span>
                      </div>
                      
                      {/* Notification Bubble */}
                      <div className="px-3 flex-1 z-10">
                        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/80 p-3.5 rounded-2xl shadow-lg flex flex-col gap-2 transition-all duration-300 hover:scale-[1.02] hover:bg-slate-900/100">
                          {/* App Info / Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center border border-primary/30">
                                <Bell className="h-3 w-3 text-primary animate-bounce" />
                              </div>
                              <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider truncate max-w-[130px]">
                                {selectedItem.package_name ? selectedItem.package_name.split('.').pop() : 'SMS / Push'}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-400">Agora</span>
                          </div>
                          
                          {/* Badge */}
                          <div>
                            <Badge variant="outline" className="text-[9px] font-bold bg-primary/10 text-primary border-transparent py-0.5 px-2">
                              Automated Mobile Capture
                            </Badge>
                          </div>
                          
                          {/* Notification Text */}
                          <p className="text-xs text-slate-200 font-normal leading-relaxed break-words line-clamp-4">
                            {selectedItem.ai_suggestions?.raw_text || "Nenhuma notificação encontrada"}
                          </p>
                        </div>
                      </div>
                      
                      {/* Home Indicator */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-700 rounded-full z-10" />
                    </div>
                  </Card>
                )}

                {/* Right Side - Form Validation Panel */}
                <Card className="rounded-2xl border-border/60 bg-card/40 backdrop-blur-md p-6 flex flex-col min-h-[580px] lg:h-[620px] shadow-soft justify-between">
                  <div className="flex-1 overflow-y-auto pr-1.5 space-y-4 max-h-[490px] scrollbar-thin">
                    {/* Header Info */}
                    <div className="flex items-center justify-between pb-4 border-b border-border/40 mb-4">
                      <div>
                        <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                          Revisão e Homologação
                          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Verifique e ajuste os dados antes de consolidar.
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (window.confirm("Deseja mesmo descartar este comprovante?")) {
                            deleteInboxItem(selectedItem.id);
                          }
                        }}
                        className="h-8 w-8 text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                        title="Descartar Comprovante"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Gemini AI Status Warning */}
                    {selectedItem.status === "processing" && (
                      <div className="mb-4 p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-2 text-xs text-blue-500">
                        <Loader2 className="h-4 w-4 animate-spin shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-semibold">O Gemini 2.5 Flash está trabalhando...</p>
                          <p className="opacity-80">A extração multimodal estruturada está ocorrendo na fila assíncrona. Os campos serão preenchidos automaticamente em instantes.</p>
                        </div>
                      </div>
                    )}

                    {selectedItem.status === "failed" && (
                      <div className="mb-4 p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-start gap-2 text-xs text-rose-500">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-semibold">Falha ao extrair com IA</p>
                          <p className="opacity-80">
                            {selectedItem.error_message || "Ocorreu um erro no processamento. Você pode preencher o formulário manualmente abaixo."}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedItem.status === "ready" && (
                      <div className="mb-4 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-2 text-xs text-emerald-500">
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-semibold">Sugestão estruturada carregada</p>
                          <p className="opacity-80">Dados extraídos com alta confiabilidade via Structured Outputs.</p>
                        </div>
                      </div>
                    )}

                    {/* Multi-transaction Selector Tabs if Lot is detected */}
                    {selectedItem.status === "ready" && (selectedItem.ai_suggestions?.transactions?.length ?? 0) > 1 && (
                      <div className="mb-4 space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground block">
                          Selecione a Transação do Lote ({selectedItem.ai_suggestions.transactions.filter(t => !t.approved).length} pendentes)
                        </Label>
                        <div className="flex flex-wrap gap-2 p-1.5 bg-muted/10 rounded-xl border border-border/40">
                          {selectedItem.ai_suggestions.transactions.map((tx, idx) => {
                            const isCurrent = idx === activeTxIndex;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setActiveTxIndex(idx)}
                                className={`flex-1 min-w-[90px] py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                  isCurrent
                                    ? "bg-primary text-white shadow-soft hover:scale-[1.02]"
                                    : tx.approved
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                                    : "bg-muted/10 text-muted-foreground hover:bg-muted/20 hover:text-foreground"
                                }`}
                              >
                                {tx.approved ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                ) : (
                                  <span className="h-3.5 w-3.5 rounded-full border border-current flex items-center justify-center text-[9px] font-bold shrink-0">
                                    {idx + 1}
                                  </span>
                                )}
                                <span className="truncate max-w-[85px]">{tx.merchant || `Compra ${idx + 1}`}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Editable Form */}
                    <form onSubmit={handleApprove} className="space-y-4">
                      {/* Merchant Description */}
                      <div className="space-y-1.5">
                        <Label htmlFor="merchant" className="text-xs font-semibold">Estabelecimento / Descrição</Label>
                        <Input
                          id="merchant"
                          value={merchant}
                          onChange={(e) => setMerchant(e.target.value)}
                          placeholder="Ex: Uber, Amazon, McDonald's..."
                          className="bg-muted/10 border-border/40 rounded-xl text-sm"
                          disabled={selectedItem.status === "processing"}
                        />
                      </div>

                      {/* Value / Amount & Date Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="amount" className="text-xs font-semibold">Valor</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <CurrencyInput
                              id="amount"
                              value={parseFloat(amount) || 0}
                              onChange={(val) => setAmount(String(val))}
                              placeholder="0.00"
                              className="pl-8 bg-muted/10 border-border/40 rounded-xl text-sm tabular-nums text-left"
                              disabled={selectedItem.status === "processing"}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="date" className="text-xs font-semibold">Data</Label>
                          <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-muted/10 border-border/40 rounded-xl text-sm"
                            disabled={selectedItem.status === "processing"}
                            required
                          />
                        </div>
                      </div>

                      {/* Account Selection */}
                      <div className="grid gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="account" className="text-xs font-semibold">Conta de Origem</Label>
                          <GlobalAccountSelector
                            value={selectedAccountId}
                            onValueChange={setSelectedAccountId}
                            placeholder="Selecione a conta..."
                            disabled={selectedItem.status === "processing"}
                            className="bg-muted/10 border-border/40 rounded-xl text-xs h-10 shadow-soft focus:ring-0"
                          />
                        </div>
                      </div>

                      {/* Category Selection */}
                      <div className="space-y-1.5">
                        <Label htmlFor="category" className="text-xs font-semibold">Categoria</Label>
                        <Select
                          value={selectedCategoryId || "none"}
                          onValueChange={(val) => setSelectedCategoryId(val === "none" ? "" : val)}
                          disabled={selectedItem.status === "processing"}
                        >
                          <SelectTrigger className="bg-muted/10 border-border/40 rounded-xl text-xs h-10 shadow-soft focus:ring-0">
                            <SelectValue placeholder="Selecione a categoria..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem categoria (Ignorar)</SelectItem>
                            {allCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Transaction Type Option */}
                      <div className="flex items-center gap-4 pt-2">
                        <span className="text-xs font-semibold">Tipo de Transação:</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setIsIncome(false)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                              !isIncome
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                : "bg-muted/10 text-muted-foreground border-transparent hover:bg-muted/20"
                            }`}
                            disabled={selectedItem.status === "processing"}
                          >
                            Despesa
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsIncome(true)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                              isIncome
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-muted/10 text-muted-foreground border-transparent hover:bg-muted/20"
                            }`}
                            disabled={selectedItem.status === "processing"}
                          >
                            Receita
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Submit Approval Button */}
                  <Button
                    type="submit"
                    onClick={handleApprove}
                    disabled={isSubmitting || selectedItem.status === "processing"}
                    className="w-full gradient-primary text-white shadow-glow hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 rounded-xl h-11"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Check className="h-5 w-5" />
                    )}
                    Homologar Transação
                  </Button>
                </Card>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Inbox;
