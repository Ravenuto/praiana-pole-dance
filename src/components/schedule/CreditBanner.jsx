import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { Zap } from "lucide-react";

export default function CreditBanner() {
  const { user } = useAuth();

  // Busca o registro do usuário para pegar créditos atualizados
  // Usa a mesma query key que Schedule e Profile para compartilhar o cache
  const { data: userData } = useQuery({
    queryKey: ["userCredits", user?.email],
    queryFn: async () => {
      const [u] = await base44.entities.User.filter({ email: user?.email }, "-created_date", 1);
      return u || null;
    },
    enabled: !!user?.email,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  if (!user || user.role === "admin") return null;

  // Usar APENAS userData do banco, nunca user do AuthContext (que pode estar desatualizado)
  const credits = userData?.credits ?? 0;
  const planLabel = userData?.plan_label || userData?.plan || "Plano de aulas";
  const noCredits = credits <= 0;

  return (
    <div className="rounded-2xl border-2 p-4 mb-6 bg-primary/5 border-primary/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{planLabel}</span>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-heading leading-none text-primary">
            {credits}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {credits === 1 ? "crédito restante" : "créditos restantes"}
          </p>
        </div>
      </div>
    </div>
  );
}