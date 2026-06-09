import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addDays, startOfMonth, endOfMonth, isSameMonth, startOfWeek, endOfWeek, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import DaySelector from "@/components/schedule/DaySelector";
import SessionCard from "@/components/schedule/SessionCard";
import CreditBanner from "@/components/schedule/CreditBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, ChevronLeft, ChevronRight, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createNotification } from "@/hooks/useNotifications";
import { getCredits } from "@/utils";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

function getTodayDayKey() {
  const days = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  return days[new Date().getDay()];
}

function getDayKey(date) {
  const days = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  return days[date.getDay()];
}

export default function Schedule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [weekAnchor, setWeekAnchor] = useState(new Date()); // início da semana exibida no DaySelector
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [loadingSession, setLoadingSession] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedDay = useMemo(() => getDayKey(new Date(selectedDate + "T12:00:00")), [selectedDate]);

  // Lógica de datas permitidas para a aluna (dentro do período do plano)
  // Mesma query key que CreditBanner para sincronizar créditos em tempo real
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

  // Data mínima e máxima baseadas no plano
  const planDates = useMemo(() => {
    const isAdmin = user?.role === "admin";
    if (isAdmin) return { min: null, max: null }; // admin sem restrição
    const startStr = userData?.data?.plan_start_date || userData?.plan_start_date;
    if (!startStr) return { min: null, max: null };
    const start = new Date(startStr + "T12:00:00");
    const end = addDays(start, 31); // 1 mês a partir do início do plano
    return { min: format(start, "yyyy-MM-dd"), max: format(end, "yyyy-MM-dd") };
  }, [userData, user]);

  const isDateAllowed = (dateStr) => {
    if (!planDates.min && !planDates.max) return true;
    if (planDates.min && dateStr < planDates.min) return false;
    if (planDates.max && dateStr > planDates.max) return false;
    return true;
  };

  const userCredits = getCredits(userData);
  const hasCredits = user?.role === "admin" || userCredits > 0;

  const { data: holidayData = [] } = useQuery({
    queryKey: ["holidays", selectedDate],
    queryFn: () => base44.entities.Holiday.filter({ date: selectedDate }),
    staleTime: 0
  });
  const isHoliday = holidayData.length > 0;

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ["sessions", selectedDay, selectedDate],
    queryFn: async () => {
      const [recurring, oneOff] = await Promise.all([
      base44.entities.ClassSession.filter({ day_of_week: selectedDay, is_active: true, is_recurring: true }),
      base44.entities.ClassSession.filter({ date: selectedDate, is_active: true, is_recurring: false })]
      );
      // Filtrar cancelled_dates
      return [...recurring.filter((s) => !s.cancelled_dates?.includes(selectedDate)), ...oneOff];
    },
    enabled: !isHoliday
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["bookings", selectedDate],
    queryFn: async () => {
      const all = await base44.entities.Booking.filter({ session_date: selectedDate }, "-created_date", 100);
      return all.filter(b => b.status !== 'cancelada'); // Não contar canceladas
    }
  });

  const { data: allWaitlist = [] } = useQuery({
    queryKey: ["allWaitlist", selectedDate],
    queryFn: () => base44.entities.WaitlistEntry.filter({ session_date: selectedDate }, "position", 100)
  });

  const { data: myBookings = [] } = useQuery({
    queryKey: ["myBookings", selectedDate, user?.email],
    queryFn: () => base44.entities.Booking.filter({ session_date: selectedDate, student_email: user?.email, status: "confirmada" }),
    enabled: !!user?.email
  });

  const { data: myWaitlist = [] } = useQuery({
    queryKey: ["myWaitlist", selectedDate, user?.email],
    queryFn: () => base44.entities.WaitlistEntry.filter({ session_date: selectedDate, student_email: user?.email }),
    enabled: !!user?.email
  });

  const sortedSessions = useMemo(() => [...sessions].sort((a, b) => (a.time || "").localeCompare(b.time || "")), [sessions]);
  const bookingCountMap = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {map[b.session_id] = (map[b.session_id] || 0) + 1;});
    return map;
  }, [bookings]);
  const bookingsBySession = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      if (!map[b.session_id]) map[b.session_id] = [];
      map[b.session_id].push(b);
    });
    return map;
  }, [bookings]);
  const waitlistBySession = useMemo(() => {
    const map = {};
    allWaitlist.forEach((w) => {
      if (!map[w.session_id]) map[w.session_id] = [];
      map[w.session_id].push(w);
    });
    return map;
  }, [allWaitlist]);
  const myBookingMap = useMemo(() => {
    const map = {};
    myBookings.forEach((b) => {map[b.session_id] = b;});
    return map;
  }, [myBookings]);
  const myWaitlistMap = useMemo(() => {
    const map = {};
    myWaitlist.forEach((w) => {map[w.session_id] = w;});
    return map;
  }, [myWaitlist]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
    queryClient.invalidateQueries({ queryKey: ["myBookings"] });
    queryClient.invalidateQueries({ queryKey: ["myWaitlist"] });
    queryClient.invalidateQueries({ queryKey: ["allWaitlist"] });
    queryClient.invalidateQueries({ queryKey: ["userCredits"] }); // sincroniza CreditBanner e Profile
    queryClient.invalidateQueries({ queryKey: ["myProfile"] });
  };

  const handleBook = async (session) => {
    setLoadingSession(session.id);
    try {
      // Buscar créditos FRESCOS do banco antes de qualquer operação
      const [latestUser] = await base44.entities.User.filter({ email: user?.email }, "-created_date", 1);
      const currentCredits = getCredits(latestUser);

      if (user?.role !== "admin") {
        if (currentCredits <= 0) {
          toast.error("Você não tem créditos disponíveis. Entre em contato para renovar seu plano.", { duration: 5000 });
          setLoadingSession(null);
          return;
        }
        if (!isDateAllowed(selectedDate)) {
          toast.error("Esta data está fora do período do seu plano. Renove seu plano para continuar reservando!", { duration: 5000 });
          setLoadingSession(null);
          return;
        }
      }

      await base44.entities.Booking.create({
        session_id: session.id,
        session_date: selectedDate,
        session_time: session.time,
        class_type_name: session.class_type_name,
        student_name: user?.full_name || "",
        student_email: user?.email,
        status: "confirmada"
      });

      // Debitar crédito IMEDIATAMENTE após criar o booking (limpar data.data corrompido ao salvar)
      if (latestUser?.id && user?.role !== "admin") {
        const cleanData = Object.fromEntries(Object.entries(latestUser.data || {}).filter(([k]) => k !== 'data'));
        await base44.entities.User.update(latestUser.id, { data: { ...cleanData, credits: currentCredits - 1 } });
      }

      invalidate();
      toast.success(`Aula reservada! Créditos restantes: ${user?.role !== "admin" ? currentCredits - 1 : "∞"}`);
      // Notificar admins com data em formato brasileiro
      const dataBR = format(new Date(selectedDate + "T12:00:00"), "dd/MM/yyyy");
      const admins = await base44.entities.User.filter({ role: "admin" });
      for (const admin of admins) {
        createNotification({
          user_email: admin.email,
          type: "booking_made",
          title: `${user?.full_name || user?.email} reservou uma aula`,
          message: `${session.class_type_name} — ${dataBR} às ${session.time}`,
          link: `/admin?aba=presencas&data=${selectedDate}`,
          actor_name: user?.full_name || user?.email
        });
      }
    } catch (err) {
      toast.error("Erro ao reservar aula: " + (err?.message || ""));
    }
    setLoadingSession(null);
  };

  const handleCancel = async (session) => {
    const booking = myBookingMap[session.id];
    if (!booking) return;

    // Verificar janela de cancelamento
    const [h, m] = (session.time || "00:00").split(":").map(Number);
    const classDateTime = new Date(`${selectedDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
    const diffMs = classDateTime - new Date();
    if (diffMs <= 4 * 60 * 60 * 1000 && diffMs > 0) {
      toast.error("Cancelamento não permitido: faltam menos de 4 horas para a aula.", { duration: 5000 });
      return;
    }
    if (diffMs <= 0) {
      toast.error("Esta aula já passou, não é possível cancelar.", { duration: 5000 });
      return;
    }

    setLoadingSession(session.id);
    try {
      // Buscar créditos frescos do banco
      const [latestUser] = await base44.entities.User.filter({ email: user?.email }, "-created_date", 1);
      const currentCredits = getCredits(latestUser);
      await base44.entities.Booking.update(booking.id, { status: "cancelada" });
      // Devolver crédito IMEDIATAMENTE após cancelar (limpar data.data corrompido ao salvar)
      if (latestUser?.id && user?.role !== "admin") {
        const cleanData = Object.fromEntries(Object.entries(latestUser.data || {}).filter(([k]) => k !== 'data'));
        await base44.entities.User.update(latestUser.id, { data: { ...cleanData, credits: currentCredits + 1 } });
      }
      invalidate();
      toast.success("Reserva cancelada! Crédito devolvido.");
      // Notificar admins com data em formato brasileiro
      const dataBR = format(new Date(selectedDate + "T12:00:00"), "dd/MM/yyyy");
      const admins = await base44.entities.User.filter({ role: "admin" });
      for (const admin of admins) {
        createNotification({
          user_email: admin.email,
          type: "booking_cancelled",
          title: `${user?.full_name || user?.email} cancelou uma aula`,
          message: `${session.class_type_name} — ${dataBR} às ${session.time}`,
          link: `/admin?aba=presencas&data=${selectedDate}`,
          actor_name: user?.full_name || user?.email
        });
      }
    } catch (err) {
      toast.error("Erro ao cancelar: " + (err?.message || ""));
    }
    setLoadingSession(null);
  };

  const handleJoinWaitlist = async (session) => {
    setLoadingSession(session.id);
    try {
      const allWaiting = await base44.entities.WaitlistEntry.filter({ session_id: session.id, session_date: selectedDate });
      await base44.entities.WaitlistEntry.create({
        session_id: session.id,
        session_date: selectedDate,
        session_time: session.time,
        class_type_name: session.class_type_name,
        student_name: user?.full_name || "",
        student_email: user?.email,
        position: allWaiting.length + 1
      });
      invalidate();
      toast.success("Você entrou na fila de espera!");
    } catch {
      toast.error("Erro ao entrar na fila");
    }
    setLoadingSession(null);
  };

  const handleLeaveWaitlist = async (session) => {
    const entry = myWaitlistMap[session.id];
    if (!entry) return;
    setLoadingSession(session.id);
    try {
      await base44.entities.WaitlistEntry.delete(entry.id);
      invalidate();
      toast.success("Você saiu da fila de espera");
    } catch {
      toast.error("Erro ao sair da fila");
    }
    setLoadingSession(null);
  };

  // Calendário mini
  const renderCalendar = () => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = [];
    let cur = calStart;
    while (cur <= calEnd) {
      days.push(cur);
      cur = addDays(cur, 1);
    }
    const today = new Date();
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    return (
      <div className="absolute top-full left-0 mt-2 z-50 bg-card border border-border rounded-2xl shadow-xl p-4 w-72">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))} className="p-1 hover:bg-muted rounded-lg">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold capitalize">
            {format(calendarMonth, "MMMM yyyy", { locale: ptBR })}
          </p>
          <button onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))} className="p-1 hover:bg-muted rounded-lg">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {dayNames.map((d) =>
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
          )}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isCurrentMonth = isSameMonth(day, calendarMonth);
            const isSelected = dateStr === selectedDate;
            const isToday = isSameDay(day, today);
            const allowed = isDateAllowed(dateStr);
            const isPast = day < today && !isToday;

            return (
              <button
                key={dateStr}
                onClick={() => {
                  if (!allowed || !isCurrentMonth) return;
                  setSelectedDate(dateStr);
                  setWeekAnchor(day); // ancora a semana no dia clicado
                  setCalendarOpen(false);
                }}
                disabled={!allowed || !isCurrentMonth}
                className={`aspect-square rounded-lg text-xs font-medium transition-colors flex items-center justify-center
                  ${!isCurrentMonth ? "opacity-0 pointer-events-none" : ""}
                  ${isSelected ? "bg-primary text-primary-foreground" : ""}
                  ${!isSelected && isToday ? "bg-primary/10 text-primary font-bold" : ""}
                  ${!isSelected && !isToday && allowed && isCurrentMonth ? "hover:bg-muted" : ""}
                  ${(!allowed || isPast) && !isSelected && isCurrentMonth ? "opacity-30 cursor-not-allowed" : ""}
                `}>
                
                {format(day, "d")}
              </button>);

          })}
        </div>
        {planDates.min &&
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Plano válido: {format(new Date(planDates.min + "T12:00:00"), "dd/MM")} até {format(new Date(planDates.max + "T12:00:00"), "dd/MM")}
          </p>
        }
      </div>);

  };

  const formattedDate = format(new Date(selectedDate + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: ptBR });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["sessions"] }),
      queryClient.invalidateQueries({ queryKey: ["bookings"] }),
      queryClient.invalidateQueries({ queryKey: ["myBookings"] }),
      queryClient.invalidateQueries({ queryKey: ["userCredits"] }),
    ]);
    setIsRefreshing(false);
  };

  const { containerRef, isPulling } = usePullToRefresh(handleRefresh);

  return (
    <div
      ref={containerRef}
      className="max-w-4xl mx-auto px-4 sm:px-6 py-6 font-body overflow-y-auto transition-transform"
      style={{
        transform: isPulling ? "translateY(20px)" : "translateY(0)",
      }}
    >
      {isPulling && (
        <div className="flex justify-center mb-4">
          <RefreshCw className={`h-5 w-5 text-primary transition-transform ${isRefreshing ? "animate-spin" : ""}`} />
        </div>
      )}

      <div className="mb-6">
         <h1 className="font-heading text-2xl sm:text-3xl font-bold">Agendar Aula</h1>
         <p className="mt-1 text-muted-foreground text-sm">Selecione o dia e reserve sua vaga</p>
       </div>

      <CreditBanner />

      {/* Seletor de data com calendário */}
      <div className="relative mb-4">
        <button
          onClick={() => setCalendarOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-muted/40 border border-border hover:border-primary/50 transition-colors">
          
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium capitalize">{formattedDate}</span>
          </div>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${calendarOpen ? "rotate-90" : ""}`} />
        </button>

        {calendarOpen &&
        <>
            <div className="fixed inset-0 z-40" onClick={() => setCalendarOpen(false)} />
            {renderCalendar()}
          </>
        }
      </div>

      <DaySelector
        selectedDate={selectedDate}
        onSelectDate={(dateStr) => setSelectedDate(dateStr)}
        weekAnchor={weekAnchor}
        onWeekChange={(newAnchor) => setWeekAnchor(newAnchor)} />
      

      <div className="space-y-3 mt-4">
        {loadingSessions || loadingBookings ?
        Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) :
        isHoliday ?
        <div className="text-center py-16 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-800">
            <div className="flex justify-center mb-3">
              <span className="text-6xl inline-block pr-5 pl-10">🎉</span>
            </div>
            <p className="font-heading font-bold text-amber-700 dark:text-amber-400 text-lg">Feriado!</p>
            <p className="text-sm text-amber-600/80 mt-2">Não teremos aula hoje. Bom descanso 💙</p>
          </div> :
        sortedSessions.length === 0 ?
        <div className="text-center py-16 text-muted-foreground">
            <CalendarDays className="h-10 w-10 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Nenhuma aula neste dia</p>
          </div> :

        sortedSessions.map((session) =>
        <SessionCard
          key={session.id}
          session={session}
          sessionDate={selectedDate}
          bookingCount={bookingCountMap[session.id] || 0}
          sessionBookings={bookingsBySession[session.id] || []}
          sessionWaitlist={waitlistBySession[session.id] || []}
          isBooked={!!myBookingMap[session.id]}
          waitlistPosition={myWaitlistMap[session.id]?.position ?? null}
          onBook={() => handleBook(session)}
          onCancel={() => handleCancel(session)}
          onJoinWaitlist={() => handleJoinWaitlist(session)}
          onLeaveWaitlist={() => handleLeaveWaitlist(session)}
          isLoading={loadingSession === session.id}
          hasCredits={hasCredits} />

        )
        }
      </div>
    </div>);

}