import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { DEFAULTS, clearSettingsCache } from "@/lib/studioSettings";

const FIELDS = [
  {
    section: "Regras de Agendamento",
    items: [
      { key: "booking_min_hours", label: "Antecedência mínima para MARCAR aula (horas)", type: "number", description: "Horas mínimas antes da aula para permitir reserva" },
      { key: "cancel_min_hours", label: "Antecedência mínima para CANCELAR aula (horas)", type: "number", description: "Horas mínimas antes da aula para cancelamento com devolução de crédito" },
      { key: "late_tolerance_minutes", label: "Tolerância de atraso (minutos)", type: "number", description: "Tempo máximo de atraso permitido na entrada da aula" },
      { key: "credits_validity_days", label: "Validade dos créditos (dias)", type: "number", description: "Dias de validade do plano a partir da data de início" },
    ],
  },
  {
    section: "Textos das Regras do Estúdio",
    items: [
      { key: "rule_credits", label: "Regra: Créditos e Validade", type: "textarea" },
      { key: "rule_waitlist", label: "Regra: Fila de Espera", type: "textarea" },
      { key: "rule_holidays", label: "Regra: Feriados", type: "textarea" },
    ],
  },
];

export default function ManageStudioSettings() {
  const [values, setValues] = useState({ ...DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbRows, setDbRows] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const rows = await base44.entities.StudioSettings.list();
    setDbRows(rows);
    const map = { ...DEFAULTS };
    rows.forEach((r) => { map[r.key] = r.value; });
    setValues(map);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    for (const [key, value] of Object.entries(values)) {
      const existing = dbRows.find((r) => r.key === key);
      if (existing) {
        await base44.entities.StudioSettings.update(existing.id, { value: String(value) });
      } else {
        await base44.entities.StudioSettings.create({ key, value: String(value) });
      }
    }
    clearSettingsCache();
    await load();
    setSaving(false);
    toast.success("Configurações salvas!");
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 max-w-2xl">
      {FIELDS.map((section) => (
        <div key={section.section}>
          <h3 className="font-heading text-base font-semibold mb-3">{section.section}</h3>
          <div className="space-y-4">
            {section.items.map((field) => (
              <div key={field.key}>
                <label className="text-sm font-medium block mb-1">{field.label}</label>
                {field.description && <p className="text-xs text-muted-foreground mb-1.5">{field.description}</p>}
                {field.type === "textarea" ? (
                  <Textarea
                    value={values[field.key] || ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    rows={2}
                    className="text-sm"
                  />
                ) : (
                  <Input
                    type="number"
                    min={0}
                    value={values[field.key] || ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    className="w-32 text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar configurações
      </Button>
    </div>
  );
}