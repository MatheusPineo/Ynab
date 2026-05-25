import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authenticatedFetch } from "@/shared/lib/api";
import { Button } from "@/shared/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { BillDetailsView } from "@/modules/finance/components/BillDetailsView";

const BillDetails = () => {
  const { cardId, billId } = useParams<{ cardId: string; billId: string }>();
  const navigate = useNavigate();
  const [bill, setBill] = useState<any>(null);
  const [card, setCard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDetails = async () => {
    if (!cardId || !billId) return;
    setIsLoading(true);
    try {
      const cardRes = await authenticatedFetch(`/credit-cards/${cardId}/`);
      if (cardRes.ok) {
        setCard(await cardRes.json());
      }
      const billsRes = await authenticatedFetch(`/credit-cards/${cardId}/bills/`);
      if (billsRes.ok) {
        const bills = await billsRes.json();
        const found = bills.find((b: any) => String(b.id) === String(billId));
        setBill(found || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [cardId, billId]);

  const handleEditInstallmentClick = (inst: any) => {
    // This could open a modal if we had one extracted. For now we will just show a toast since this is a dedicated page
    toast.error("Edição detalhada só está disponível na aba Cartões de Crédito por enquanto.");
  };

  const handleDeleteInstallmentClick = async (id: string) => {
    if (!window.confirm("Deseja excluir este lançamento?")) return;
    setIsSubmitting(true);
    try {
      const response = await authenticatedFetch(`/credit-cards/${cardId}/manage_installment/${id}/?mode=single`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Erro ao excluir lançamento");
      toast.success("Lançamento excluído com sucesso!");
      fetchDetails();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnticipateInstallment = async (id: string) => {
    setIsSubmitting(true);
    try {
      const response = await authenticatedFetch(`/credit-cards/${cardId}/anticipate_installment/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installment_id: id })
      });
      if (!response.ok) throw new Error("Erro ao antecipar parcela");
      toast.success("Parcela antecipada com sucesso!");
      fetchDetails();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!bill || !card) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground mt-20">
        <p>Fatura não encontrada.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
              Fatura de {bill.month.toString().padStart(2, '0')}/{bill.year}
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              Cartão: {card.name}
            </p>
          </div>
        </div>
      </div>

      <BillDetailsView
        card={card}
        bill={bill}
        onEditInstallment={handleEditInstallmentClick}
        onDeleteInstallment={handleDeleteInstallmentClick}
        onAnticipateInstallment={handleAnticipateInstallment}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default BillDetails;
