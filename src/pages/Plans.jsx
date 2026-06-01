import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const WHATSAPP_NUMBER = "5521999999999";

function getWhatsappLink(planLabel) {
  const msg = encodeURIComponent(`Oii, quero comprar o plano de ${planLabel} da Praiana`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

export default function Plans() {
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["studioPlans"],
    queryFn: () => base44.entities.StudioPlan.filter({ is_active: true }),
  });

  const sorted = [...plans].sort((a, b) => (a.price_value || 0) - (b.price_value || 0));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 font-body">
      <div className="mb-8 text-center">
         <h1 className="font-heading text-xl font-semibold">Planos</h1>
         <p className="mt-2 text-muted-foreground text-xs">Escolha o plano ideal para você e entre em contato pelo WhatsApp</p>
       </div>

       {isLoading ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
           {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
         </div>
       ) : sorted.length === 0 ? (
         <div className="text-center py-16 text-muted-foreground">
           <p className="text-sm">Nenhum plano disponível no momento.</p>
         </div>
       ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
           {sorted.map((plan) => (
             <div
               key={plan.id}
               className={`rounded-xl border p-4 flex flex-col gap-3 relative ${
                 plan.highlight
                   ? "border-primary bg-primary/5 shadow-md"
                   : "border-border bg-card"
               }`}
             >
               {plan.highlight && (
                 <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                   <span className="bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
                     Mais popular
                   </span>
                 </div>
               )}
               <div>
                 <p className="font-heading text-sm font-semibold">{plan.label}</p>
                 <p className="text-xl font-bold font-heading mt-1">{plan.price}</p>
                 <p className="text-[11px] text-muted-foreground mt-0.5">{plan.per_class}</p>
               </div>
               {plan.benefits?.length > 0 && (
                 <ul className="space-y-1.5 flex-1">
                   {plan.benefits.map((b, i) => (
                     <li key={i} className="flex items-center gap-1.5 text-xs">
                       <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                       {b}
                     </li>
                   ))}
                 </ul>
               )}
               <a href={getWhatsappLink(plan.label)} target="_blank" rel="noopener noreferrer">
                 <Button className="w-full rounded-full gap-2 h-8 text-xs" variant={plan.highlight ? "default" : "outline"}>
                   <MessageCircle className="h-3.5 w-3.5" /> Quero este plano
                 </Button>
               </a>
             </div>
           ))}
         </div>
       )}

      <p className="text-center text-[11px] text-muted-foreground mt-6">
         Para contratar ou renovar seu plano, entre em contato via WhatsApp. Será um prazer te atender!
       </p>
    </div>
  );
}