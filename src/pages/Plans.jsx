import React from "react";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const WHATSAPP_NUMBER = "5511999999999"; // substitua pelo número real

const plans = [
  {
    key: "4_aulas",
    label: "4 aulas / mês",
    price: "R$ 230",
    perClass: "R$ 57,50/aula",
    highlight: false,
    benefits: ["1x por semana", "Acesso às modalidades", "Suporte via WhatsApp"],
  },
  {
    key: "8_aulas",
    label: "8 aulas / mês",
    price: "R$ 370",
    perClass: "R$ 46,25/aula",
    highlight: true,
    benefits: ["2x por semana", "Acesso às modalidades", "Suporte via WhatsApp", "Melhor custo-benefício"],
  },
  {
    key: "12_aulas",
    label: "12 aulas / mês",
    price: "R$ 480",
    perClass: "R$ 40/aula",
    highlight: false,
    benefits: ["3x por semana", "Acesso às modalidades", "Suporte via WhatsApp", "Máximo aproveitamento"],
  },
  {
    key: "avulsa",
    label: "Aula avulsa",
    price: "R$ 70",
    perClass: "por aula",
    highlight: false,
    benefits: ["Sem compromisso", "Pague conforme usar", "Acesso às modalidades"],
  },
];

function getWhatsappLink(planLabel) {
  const msg = encodeURIComponent(`Oii, quero comprar o plano de ${planLabel} da Praiana 🏝️`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

export default function Plans() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 font-body">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl font-bold">Planos</h1>
        <p className="mt-2 text-muted-foreground">Escolha o plano ideal para você e entre em contato pelo WhatsApp</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={`rounded-2xl border-2 p-6 flex flex-col gap-4 relative ${
              plan.highlight
                ? "border-primary bg-primary/5 shadow-lg"
                : "border-border bg-card"
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Mais popular
                </span>
              </div>
            )}
            <div>
              <p className="font-heading text-xl font-bold">{plan.label}</p>
              <p className="text-3xl font-bold font-heading mt-1">{plan.price}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{plan.perClass}</p>
            </div>
            <ul className="space-y-2 flex-1">
              {plan.benefits.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
            <a href={getWhatsappLink(plan.label)} target="_blank" rel="noopener noreferrer">
              <Button className="w-full rounded-full gap-2" variant={plan.highlight ? "default" : "outline"}>
                <MessageCircle className="h-4 w-4" /> Quero este plano
              </Button>
            </a>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-8">
        Para contratar ou renovar seu plano, entre em contato via WhatsApp. Será um prazer te atender! 💖
      </p>
    </div>
  );
}