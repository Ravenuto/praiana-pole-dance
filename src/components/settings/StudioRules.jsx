import React, { useState, useEffect } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { getStudioSettings } from "@/lib/studioSettings";

export default function StudioRules() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getStudioSettings().then(setSettings);
  }, []);

  if (!settings) return (
    <div className="flex justify-center py-6">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    </div>
  );

  const bookingHours = settings.booking_min_hours || "4";
  const cancelHours = settings.cancel_min_hours || "4";
  const lateMins = settings.late_tolerance_minutes || "15";

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-lg font-semibold">Regras do Estúdio</h2>
      </div>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <p className="font-medium text-foreground">Agendamento e Cancelamento</p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>O agendamento deve ser feito com no mínimo <strong className="text-foreground">{bookingHours} hora{bookingHours !== "1" ? "s" : ""}</strong> de antecedência.</li>
            <li>O cancelamento deve ser feito com no mínimo <strong className="text-foreground">{cancelHours} hora{cancelHours !== "1" ? "s" : ""}</strong> de antecedência. Após esse prazo, o crédito não será devolvido.</li>
          </ul>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <p className="font-medium text-foreground">Pontualidade</p>
          <p>Alunas com atraso superior a <strong className="text-foreground">{lateMins} minutos</strong> poderão não ser admitidas na aula.</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <p className="font-medium text-foreground">Créditos</p>
          <p>Os créditos têm validade de 1 mês a partir da data de início do plano. Créditos não utilizados dentro do período não são transferidos.</p>
        </div>
      </div>
    </div>
  );
}