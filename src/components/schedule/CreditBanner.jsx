import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Zap } from "lucide-react";

export default function CreditBanner() {
  const { user } = useAuth();

  // Busca reservas confirmadas do mês atual
  const today = new Date();
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(today), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const { data: monthBookings = [] } = useQuery({
    queryKey: ["creditBookings", user?.email, monthStart],
    queryFn: () => base44.entities.Booking.filter({ student_email: user?.email }, "-session_date", 100),
    enabled: !!user?.email,
    select: (data) =>
      data.filter(
        (b) =>
          b.status !== "cancelada" &&
          b.session_date >= monthStart &&
          b.session_date <= monthEnd
      ),
  });

  if (!user || user.role === "admin") return null;

  const plan = user.plan || "1x_semana";
  const classesPerWeek = plan === "2x_semana" ? 2 : 1;
  const classesPerMonth = classesPerWeek * 4;

  // Aulas na semana atual
  const weekBookings = monthBookings.filter(
    (b) => b.session_date >= weekStart && b.session_date <= weekEnd
  );

  const usedMonth = monthBookings.length;
  const usedWeek = weekBookings.length;
  const remainingMonth = Math.max(0, classesPerMonth - usedMonth);
  const remainingWeek = Math.max(0, classesPerWeek - usedWeek);

  const weekFull = usedWeek >= classesPerWeek;
  const monthFull = usedMonth >= classesPerMonth;

  return (
    <div className={`rounded-2xl border-2 p-4 mb-6 ${monthFull ? "bg-red-50 border-red-200" : weekFull ? "bg-amber-50 border-amber-200" : "bg-primary/5 border-primary/20"}`}>
      <div className="flex items-center gap-2 mb-3">
        <Zap className={`h-4 w-4 ${monthFull ? "text-red-500" : weekFull ? "text-amber-500" : "text-primary"}`} />
        <span className="text-sm font-semibold">
          Meu Plano — {plan === "2x_semana" ? "2× por semana" : "1× por semana"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* Semana */}
        <div className="bg-white/70 rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Esta semana</p>
          <p className={`text-2xl font-bold font-heading ${weekFull ? "text-red-500" : "text-foreground"}`}>
            {remainingWeek}
            <span className="text-sm font-normal text-muted-foreground">/{classesPerWeek}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {weekFull ? "Limite atingido" : "aula(s) restante(s)"}
          </p>
        </div>
        {/* Mês */}
        <div className="bg-white/70 rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Este mês</p>
          <p className={`text-2xl font-bold font-heading ${monthFull ? "text-red-500" : "text-foreground"}`}>
            {remainingMonth}
            <span className="text-sm font-normal text-muted-foreground">/{classesPerMonth}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {monthFull ? "Limite atingido" : "aula(s) restante(s)"}
          </p>
        </div>
      </div>
      {weekFull && !monthFull && (
        <p className="mt-3 text-xs text-amber-700 text-center">
          Você já atingiu o limite semanal. Volte na semana que vem! 🗓️
        </p>
      )}
      {monthFull && (
        <p className="mt-3 text-xs text-red-600 text-center">
          Você usou todas as aulas do mês. Renova no mês seguinte! 🎉
        </p>
      )}
    </div>
  );
}