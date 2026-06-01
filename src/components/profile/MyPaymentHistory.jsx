import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Receipt } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const planLabels = {
  "4_aulas": "4 aulas/mês",
  "8_aulas": "8 aulas/mês",
  "12_aulas": "12 aulas/mês",
  "avulsa": "Avulsa",
};

export default function MyPaymentHistory({ userId }) {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["myPaymentHistory", userId],
    queryFn: () => base44.entities.PaymentHistory.filter({ user_id: userId }, "-payment_date", 20),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
        <Receipt className="h-5 w-5 text-primary" />
        Histórico de Pagamentos
      </h2>

      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum pagamento registrado ainda</p>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {format(new Date(p.payment_date + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  {p.amount ? ` — R$ ${p.amount.toFixed(2).replace(".", ",")}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {planLabels[p.plan_name] || p.plan_name}
                  {p.notes ? ` · ${p.notes}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}