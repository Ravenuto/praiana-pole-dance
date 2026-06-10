import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { DEFAULTS, clearSettingsCache } from "@/lib/studioSettings";

const FIELDS = [
  { key: "booking_min_hours", label: "Antecedência mínima para MARCAR aula (horas)", description: "Horas mínimas antes da aula para permitir reserva" },
  { key: "cancel_min_hours", label: "Antecedência mínima para CANCELAR aula (horas)", description: "Horas mínimas antes da aula para cancelamento com devolução de crédito" },
];

export default function ManageStudioSettings() {
  const [values, setValues] = useState({ booking_min_hours: DEFAULTS.booking_min_hours, cancel_min_hours: DEFAULTS.cancel_min_hours });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbRows, setDbRows] = useState([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const rows = await base44.entities.StudioSettings.list();
    setDbRows(rows);
    const map = { booking_min_hours: DEFAULTS.booking_min_hours, cancel_min_hours: DEFAULTS.cancel_min_hours };
    rows.forEach((r) => { if (r.key in map) map[r.key] = r.value; });
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
    toast.success("Configurações salvas! As novas regras já estão em vigor no site.");
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h3 className="font-heading text-base font-semibold mb-1">Regras de Agendamento</h3>
        <p className="text-xs text-muted-foreground mb-4">Ao salvar, as novas regras passam a valer imediatamente para todas as alunas.</p>
      </div>
      {FIELDS.map((field) => (
        <div key={field.key}>
          <label className="text-sm font-medium block mb-1">{field.label}</label>
          <p className="text-xs text-muted-foreground mb-1.5">{field.description}</p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={values[field.key] || ""}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              className="w-24 text-sm"
            />
            <span className="text-sm text-muted-foreground">horas</span>
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