import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, DollarSign, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const planPrices = {
  "4_aulas": 230,
  "8_aulas": 380,
  "12_aulas": 500,
  "avulsa": 0,
};

export default function PaymentHistoryDialog({ student, onClose }) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [amountEdited, setAmountEdited] = useState(false);
  const [form, setForm] = useState({
    payment_date: format(new Date(), "yyyy-MM-dd"),
    plan_name: student.plan || "4_aulas",
    amount: planPrices[student.plan || "4_aulas"] || 0,
    payment_method: "pix",
    explanation: "",
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["paymentHistory", student.id],
    queryFn: () => base44.entities.PaymentHistory.filter({ user_id: student.id }, "-payment_date", 50),
  });

  const handleAdd = async () => {
    if (!form.payment_date) return toast.error("Data de pagamento obrigatória");
    if (amountEdited && !form.explanation) return toast.error("Explicação é obrigatória quando o valor é alterado");
    setSaving(true);
    try {
      await base44.entities.PaymentHistory.create({
        user_id: student.id,
        user_email: student.email,
        user_name: student.full_name || student.email,
        plan_name: form.plan_name,
        amount: parseFloat(form.amount) || 0,
        payment_date: form.payment_date,
        payment_method: form.payment_method,
        notes: form.explanation || "",
      });
      // Atualiza last_payment_date no perfil da aluna
      await base44.entities.User.update(student.id, {
        last_payment_date: form.payment_date,
      });
      queryClient.invalidateQueries({ queryKey: ["paymentHistory", student.id] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("Pagamento registrado!");
      setAdding(false);
      setAmountEdited(false);
      setForm({ payment_date: format(new Date(), "yyyy-MM-dd"), plan_name: student.plan || "4_aulas", amount: planPrices[student.plan || "4_aulas"] || 0, payment_method: "pix", explanation: "" });
    } catch {
      toast.error("Erro ao registrar pagamento");
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.PaymentHistory.delete(id);
    queryClient.invalidateQueries({ queryKey: ["paymentHistory", student.id] });
    toast.success("Pagamento removido");
  };

  const planLabels = {
    "4_aulas": "4 aulas/mês",
    "8_aulas": "8 aulas/mês",
    "12_aulas": "12 aulas/mês",
    "avulsa": "Avulsa",
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Histórico de Pagamentos</DialogTitle>
          <p className="text-sm text-muted-foreground">{student.full_name || student.email}</p>
        </DialogHeader>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 w-full"
          onClick={() => setAdding(!adding)}
        >
          <Plus className="h-4 w-4" /> Registrar pagamento
        </Button>

        {adding && (
          <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/20">
            <div>
              <Label className="text-xs mb-1 block">Data do pagamento *</Label>
              <Input type="date" value={form.payment_date} onChange={(e) => setForm(f => ({ ...f, payment_date: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Plano *</Label>
              <Select value={form.plan_name} onValueChange={(v) => {
                const newAmount = planPrices[v] || 0;
                setForm(f => ({ ...f, plan_name: v, amount: newAmount }));
                setAmountEdited(false);
              }}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4_aulas">4 aulas/mês — R$ 230</SelectItem>
                  <SelectItem value="8_aulas">8 aulas/mês — R$ 380</SelectItem>
                  <SelectItem value="12_aulas">12 aulas/mês — R$ 500</SelectItem>
                  <SelectItem value="avulsa">Avulsa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Valor (R$)</Label>
              <Input type="number" value={form.amount} onChange={(e) => {
                setForm(f => ({ ...f, amount: e.target.value }));
                setAmountEdited(e.target.value !== (planPrices[form.plan_name] || 0).toString());
              }} className="h-8 text-sm" placeholder="Ex: 230" />
            </div>
            {amountEdited && (
              <div>
                <Label className="text-xs mb-1 block">Explicação da alteração *</Label>
                <Input value={form.explanation} onChange={(e) => setForm(f => ({ ...f, explanation: e.target.value }))} className="h-8 text-sm" placeholder="Ex: Desconto promocional, bônus..." />
              </div>
            )}
            <div>
              <Label className="text-xs mb-1 block">Forma de pagamento</Label>
              <Select value={form.payment_method} onValueChange={(v) => setForm(f => ({ ...f, payment_method: v }))}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} disabled={saving} className="w-full rounded-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        )}

        <div className="space-y-2 mt-2">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
          ) : payments.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">Nenhum pagamento registrado</p>
          ) : (
            payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {format(new Date(p.payment_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                      {p.amount ? ` — R$ ${p.amount.toFixed(2).replace(".", ",")}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {planLabels[p.plan_name] || p.plan_name}
                      {p.payment_method && ` · ${p.payment_method === "pix" ? "PIX" : p.payment_method === "cartao_credito" ? "Cartão crédito" : p.payment_method.replace("_", " ")}`}
                      {p.notes && ` · ${p.notes}`}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDelete(p.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}