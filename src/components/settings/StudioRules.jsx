import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, BookOpen, Loader2 } from "lucide-react";
import { getStudioSettings } from "@/lib/studioSettings";

export default function StudioRules() {
  const [open, setOpen] = useState(null);
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

  const rules = [
    {
      title: "Agendamento de aulas",
      content: `O agendamento deve ser feito com no mínimo ${bookingHours} hora${bookingHours !== "1" ? "s" : ""} de antecedência.`,
    },
    {
      title: "Cancelamento de aulas",
      content: `O cancelamento deve ser feito com no mínimo ${cancelHours} hora${cancelHours !== "1" ? "s" : ""} de antecedência. Após esse prazo, o crédito não será devolvido.`,
    },
    {
      title: "Créditos e validade",
      content: settings.rule_credits,
    },
    {
      title: "Pontualidade",
      content: `Alunas com atraso superior a ${lateMins} minutos poderão não ser admitidas na aula.`,
    },
    {
      title: "Fila de espera",
      content: settings.rule_waitlist,
    },
    {
      title: "Feriados",
      content: settings.rule_holidays,
    },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-lg font-semibold">Regras do Estúdio</h2>
      </div>
      <div className="space-y-2">
        {rules.map((rule, i) => (
          <div key={i} className="border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm font-medium">{rule.title}</span>
              {open === i ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </button>
            {open === i && (
              <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed">
                {rule.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}