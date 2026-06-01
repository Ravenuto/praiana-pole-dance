import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Plus, Star, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const EMPTY = {
  label: "", price_value: 0, credits: 1, highlight: false, is_active: true, benefits: [""],
};

export default function ManagePlansAdmin() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(null); // null | { plan?, form }
  const [saving, setSaving] = useState(false);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["studioPlans"],
    queryFn: () => base44.entities.StudioPlan.list(),
  });

  const sorted = [...plans].sort((a, b) => (a.credits || 0) - (b.credits || 0));

  // Gera chave automática a partir do label
  const autoKey = (label) => label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

  const openNew = () => setDialog({ form: { ...EMPTY, benefits: [""] } });
  const openEdit = (plan) => setDialog({ plan, form: { ...plan, key: plan.key || "", benefits: plan.benefits?.length ? [...plan.benefits] : [""] } });
  const closeDialog = () => setDialog(null);

  const setField = (field, value) =>
    setDialog((d) => ({ ...d, form: { ...d.form, [field]: value } }));

  const setBenefit = (idx, value) =>
    setDialog((d) => {
      const b = [...d.form.benefits];
      b[idx] = value;
      return { ...d, form: { ...d.form, benefits: b } };
    });

  const addBenefit = () =>
    setDialog((d) => ({ ...d, form: { ...d.form, benefits: [...d.form.benefits, ""] } }));

  const removeBenefit = (idx) =>
    setDialog((d) => {
      const b = d.form.benefits.filter((_, i) => i !== idx);
      return { ...d, form: { ...d.form, benefits: b.length ? b : [""] } };
    });

  const handleSave = async () => {
    if (!dialog) return;
    const { form, plan } = dialog;
    if (!form.label || !form.price_value) return toast.error("Preencha nome e preço.");
    setSaving(true);
    // Calcula campos derivados automaticamente
    const credits = Number(form.credits) || 1;
    const priceValue = Number(form.price_value) || 0;
    const perClassValue = credits > 0 ? (priceValue / credits).toFixed(2).replace(".", ",") : priceValue.toFixed(2).replace(".", ",");
    const per_class = credits === 1 ? "por aula" : `R$ ${perClassValue}/aula`;
    const price = `R$ ${String(priceValue).replace(".", ",")}`;
    const key = form.key || autoKey(form.label) || `plano_${Date.now()}`;
    const data = { ...form, key, price, price_value: priceValue, per_class, credits, benefits: form.benefits.filter(Boolean) };
    if (plan?.id) {
      await base44.entities.StudioPlan.update(plan.id, data);
      toast.success("Plano atualizado!");
    } else {
      await base44.entities.StudioPlan.create(data);
      toast.success("Plano criado!");
    }
    queryClient.invalidateQueries({ queryKey: ["studioPlans"] });
    setSaving(false);
    closeDialog();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este plano?")) return;
    await base44.entities.StudioPlan.delete(id);
    queryClient.invalidateQueries({ queryKey: ["studioPlans"] });
    toast.success("Plano removido.");
  };

  const handleToggleActive = async (plan) => {
    await base44.entities.StudioPlan.update(plan.id, { is_active: !plan.is_active });
    queryClient.invalidateQueries({ queryKey: ["studioPlans"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-semibold">Planos do Estúdio</h2>
        <Button onClick={openNew} className="gap-2 rounded-full" size="sm">
          <Plus className="h-4 w-4" /> Novo plano
        </Button>
      </div>

      {isLoading ? (
        Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl mb-3" />)
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-4">Nenhum plano cadastrado</p>
          <Button onClick={openNew} variant="outline" className="gap-2 rounded-full">
            <Plus className="h-4 w-4" /> Criar primeiro plano
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {sorted.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl border-2 p-5 relative flex flex-col gap-3 ${
                plan.highlight ? "border-primary bg-primary/5" : "border-border bg-card"
              } ${!plan.is_active ? "opacity-50" : ""}`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3" /> Mais popular
                </span>
              )}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-heading text-lg font-bold">{plan.label}</p>
                  <p className="text-2xl font-bold text-primary font-heading">{plan.price}</p>
                  <p className="text-xs text-muted-foreground">{plan.per_class}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="secondary" className="text-xs">{plan.credits || 0} créditos</Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{plan.is_active ? "Ativo" : "Inativo"}</span>
                    <Switch checked={!!plan.is_active} onCheckedChange={() => handleToggleActive(plan)} />
                  </div>
                </div>
              </div>

              {plan.benefits?.length > 0 && (
                <ul className="space-y-1">
                  {plan.benefits.map((b, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> {b}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2 mt-auto pt-2">
                <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs h-8 rounded-full" onClick={() => openEdit(plan)}>
                  <Pencil className="h-3 w-3" /> Editar
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0 rounded-full" onClick={() => handleDelete(plan.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={!!dialog} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{dialog?.plan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
          </DialogHeader>
          {dialog && (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs mb-1 block">Nome do plano *</Label>
                <Input placeholder="ex: 8 aulas / mês" value={dialog.form.label} onChange={(e) => setField("label", e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Preço (R$) *</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <Input
                      type="number" min={0} step="0.01"
                      placeholder="0"
                      value={dialog.form.price_value || ""}
                      onChange={(e) => setField("price_value", e.target.value)}
                      className="h-8 text-sm pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Créditos (aulas) *</Label>
                  <Input type="number" min={1} value={dialog.form.credits} onChange={(e) => setField("credits", Number(e.target.value))} className="h-8 text-sm" />
                </div>
              </div>
              {/* Preview automático do preço por aula */}
              {dialog.form.price_value > 0 && dialog.form.credits >= 1 && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                  Preço por aula calculado automaticamente:{" "}
                  <strong>
                    {dialog.form.credits == 1
                      ? "por aula"
                      : `R$ ${(Number(dialog.form.price_value) / Number(dialog.form.credits)).toFixed(2).replace(".", ",")}/aula`
                    }
                  </strong>
                </p>
              )}

              <div>
                <Label className="text-xs mb-2 block">Benefícios</Label>
                <div className="space-y-2">
                  {dialog.form.benefits.map((b, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={b} onChange={(e) => setBenefit(i, e.target.value)} className="h-8 text-sm flex-1" placeholder={`Benefício ${i + 1}`} />
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => removeBenefit(i)}>✕</Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={addBenefit}>
                    <Plus className="h-3 w-3" /> Adicionar benefício
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={!!dialog.form.highlight} onCheckedChange={(v) => setField("highlight", v)} />
                  <Label className="text-sm cursor-pointer">Destacar como "Mais popular"</Label>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full rounded-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar plano"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}