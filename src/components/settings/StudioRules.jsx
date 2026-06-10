import React, { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";

const rules = [
  {
    title: "Cancelamento de aulas",
    content: "O cancelamento deve ser feito com no mínimo 4 horas de antecedência. Após esse prazo, o crédito não será devolvido.",
  },
  {
    title: "Créditos e validade",
    content: "Os créditos têm validade de 1 mês a partir da data de início do plano. Créditos não utilizados dentro do período não são transferidos.",
  },
  {
    title: "Pontualidade",
    content: "Pedimos que chegue com pelo menos 5 minutos de antecedência. Alunas com atraso superior a 10 minutos poderão não ser admitidas na aula.",
  },
  {
    title: "Fila de espera",
    content: "Quando a aula estiver lotada, você pode entrar na fila de espera. Ao surgir uma vaga, você será notificada automaticamente.",
  },
  {
    title: "Feriados",
    content: "Nos feriados marcados no sistema não haverá aulas. Verifique o calendário antes de reservar.",
  },
];

export default function StudioRules() {
  const [open, setOpen] = useState(null);

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