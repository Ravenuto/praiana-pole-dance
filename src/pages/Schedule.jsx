import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addDays, addWeeks, startOfWeek, isSameWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import DaySelector from "@/components/schedule/DaySelector";
import SessionCard from "@/components/schedule/SessionCard";
import CreditBanner from "@/components/schedule/CreditBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createNotification } from "@/hooks/useNotifications";

function getTodayDayKey() {
  const days = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  return days[new Date().getDay()];
}

function getDateForDay(dayKey) {
  const dayMap = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
  const today = new Date();
  const todayDay = today.getDay();
  const targetDay = dayMap[dayKey];
  let diff = targetDay - todayDay;
  if (diff < 0) diff += 7;
  return format(addDays(today, diff), "yyyy-MM-dd");
}

// Retorna a data (yyyy-MM-dd) de um dia específico numa semana deslocada
function getDateForDayInWeek(dayKey, weekOffset) {
  const dayMap = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
  const base = addWeeks(new Date(), weekOffset);
  const weekStart = startOfWeek(base, { weekStartsOn: 1 }); // semana começa na segunda
  const dayIndex = dayMap[dayKey];
  // Ajustar: segunda = 0 offset na semana (weekStartsOn 1)
  const offsetFromMon = dayIndex === 0 ? 6 : dayIndex - 1;
  return format(addDays(weekStart, offsetFromMon), "yyyy-MM-dd");
}

export default function Schedule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState(getTodayDayKey());
  const [weekOffset, setWeekOffset] = useState(0);
  const [loadingSession, setLoadingSession] = useState(null);

  const selectedDate = useMemo(() => getDateForDayInWeek(selectedDay, weekOffset), [selectedDay, weekOffset]);

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ["sessions", selectedDay, selectedDate],
    queryFn: async () => {
      // Busca aulas recorrentes do dia da semana + aulas únicas da data específica
      const [recurring, oneOff] = await Promise.all([
        base44.entities.ClassSession.filter({ day_of_week: selectedDay, is_active: true, is_recurring: true }),
        base44.entities.ClassSession.filter({ date: selectedDate, is_active: true, is_recurring: false }),
      ]);
      return [...recurring, ...oneOff];
    },
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["bookings", selectedDate],
    queryFn: () => base44.entities.Booking.filter({ session_date: selectedDate, status: "confirmada" }, "-created_date", 100),
  });

  const { data: allWaitlist = [] } = useQuery({
    queryKey: ["allWaitlist", selectedDate],
    queryFn: () => base44.entities.WaitlistEntry.filter({ session_date: selectedDate }, "position", 100),
  });

  const { data: myBookings = [] } = useQuery({
    queryKey: ["myBookings", selectedDate, user?.email],
    queryFn: () => base44.entities.Booking.filter({ session_date: selectedDate, student_email: user?.email, status: "confirmada" }),
    enabled: !!user?.email,
  });

  const { data: myWaitlist = [] } = useQuery({
    queryKey: ["myWaitlist", selectedDate, user?.email],
    queryFn: () => base44.entities.WaitlistEntry.filter({ session_date: selectedDate, student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: userData } = useQuery({
    queryKey: ["myProfile", user?.email],
    queryFn: async () => {
      const [u] = await base44.entities.User.filter({ email: user?.email }, "-created_date", 1);
      return u || null;
    },
    enabled: !!user?.email,
  });
  const userCredits = userData?.credits ?? user?.credits ?? 0;
  // Conta quantas reservas ativas a aluna tem hoje (para limitar pelo plano)
  const { data: myActiveBookingsToday = [] } = useQuery({
    queryKey: ["myActiveBookingsToday", user?.email],
    queryFn: () => base44.entities.Booking.filter({ student_email: user?.email, status: "confirmada" }, "-session_date", 200),
    enabled: !!user?.email,
  });
  const hasCredits = user?.role === "admin" || userCredits > 0;

  const sortedSessions = useMemo(() => [...sessions].sort((a, b) => (a.time || "").localeCompare(b.time || "")), [sessions]);
  const bookingCountMap = useMemo(() => {
    const map = {};
    bookings.forEach((b) => { map[b.session_id] = (map[b.session_id] || 0) + 1; });
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
    myBookings.forEach((b) => { map[b.session_id] = b; });
    return map;
  }, [myBookings]);
  const myWaitlistMap = useMemo(() => {
    const map = {};
    myWaitlist.forEach((w) => { map[w.session_id] = w; });
    return map;
  }, [myWaitlist]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
    queryClient.invalidateQueries({ queryKey: ["myBookings"] });
    queryClient.invalidateQueries({ queryKey: ["myWaitlist"] });
    queryClient.invalidateQueries({ queryKey: ["allWaitlist"] });
    queryClient.invalidateQueries({ queryKey: ["creditBookings"] });
    queryClient.invalidateQueries({ queryKey: ["myProfile"] });
  };

  const handleBook = async (session) => {
    setLoadingSession(session.id);
    try {
      // Busca dados atuais do usuário para decrementar créditos
      const [userData] = await base44.entities.User.filter({ email: user?.email }, "-created_date", 1);
      const currentCredits = userData?.credits || 0;
      await base44.entities.Booking.create({
        session_id: session.id,
        session_date: selectedDate,
        session_time: session.time,
        class_type_name: session.class_type_name,
        student_name: user?.full_name || "",
        student_email: user?.email,
        status: "confirmada",
      });
      if (userData?.id) {
        if (currentCredits <= 0) {
          toast.error("Você não tem créditos disponíveis");
          setLoadingSession(null);
          return;
        }
        await base44.entities.User.update(userData.id, { credits: currentCredits - 1 });
      }
      invalidate();
      toast.success("Aula reservada!");
      // Notificar admins
      const admins = await base44.entities.User.filter({ role: "admin" });
      for (const admin of admins) {
        createNotification({
          user_email: admin.email,
          type: "booking_made",
          title: `${user?.full_name || user?.email} reservou uma aula`,
          message: `${session.class_type_name} — ${selectedDate} às ${session.time}`,
          link: "/admin",
          actor_name: user?.full_name || user?.email,
        });
      }
    } catch {
      toast.error("Erro ao reservar aula");
    }
    setLoadingSession(null);
  };

  const handleCancel = async (session) => {
    const booking = myBookingMap[session.id];
    if (!booking) return;
    setLoadingSession(session.id);
    try {
      const [userData] = await base44.entities.User.filter({ email: user?.email }, "-created_date", 1);
      const currentCredits = userData?.credits || 0;
      await base44.entities.Booking.update(booking.id, { status: "cancelada" });
      if (userData?.id) {
        await base44.entities.User.update(userData.id, { credits: currentCredits + 1 });
      }
      invalidate();
      toast.success("Reserva cancelada");
      // Notificar admins
      const admins = await base44.entities.User.filter({ role: "admin" });
      for (const admin of admins) {
        createNotification({
          user_email: admin.email,
          type: "booking_cancelled",
          title: `${user?.full_name || user?.email} cancelou uma aula`,
          message: `${session.class_type_name} — ${selectedDate} às ${session.time}`,
          link: "/admin",
          actor_name: user?.full_name || user?.email,
        });
      }
    } catch {
      toast.error("Erro ao cancelar");
    }
    setLoadingSession(null);
  };

  const handleJoinWaitlist = async (session) => {
    setLoadingSession(session.id);
    try {
      // conta quantas já estão na fila para essa sessão
      const allWaiting = await base44.entities.WaitlistEntry.filter({ session_id: session.id, session_date: selectedDate });
      await base44.entities.WaitlistEntry.create({
        session_id: session.id,
        session_date: selectedDate,
        session_time: session.time,
        class_type_name: session.class_type_name,
        student_name: user?.full_name || "",
        student_email: user?.email,
        position: allWaiting.length + 1,
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

  const formattedDate = format(new Date(selectedDate + "T12:00:00"), "d 'de' MMMM", { locale: ptBR });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 font-body">
      <div className="mb-6">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">Agendar Aula</h1>
        <p className="mt-1 text-muted-foreground text-sm">Selecione o dia e reserve sua vaga</p>
      </div>

      <CreditBanner />

      {/* Navegador de semana */}
      <div className="flex items-center justify-between mb-3 p-2 rounded-xl bg-muted/40 border border-border">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((o) => o - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-medium">
            {weekOffset === 0 ? "Esta semana" : weekOffset === 1 ? "Próxima semana" : weekOffset === -1 ? "Semana passada" : `Semana ${weekOffset > 0 ? "+" : ""}${weekOffset}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(getDateForDayInWeek("segunda", weekOffset) + "T12:00:00" > "2000" ? new Date(getDateForDayInWeek("segunda", weekOffset) + "T12:00:00") : new Date(), "d MMM", { locale: ptBR })}
            {" — "}
            {format(new Date(getDateForDayInWeek("domingo", weekOffset) + "T12:00:00"), "d MMM", { locale: ptBR })}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((o) => o + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <DaySelector selected={selectedDay} onChange={setSelectedDay} />

      <div className="mt-3 mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="h-4 w-4" />
        <span className="capitalize">{formattedDate}</span>
      </div>

      <div className="space-y-3">
        {loadingSessions || loadingBookings ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : sortedSessions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <CalendarDays className="h-10 w-10 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Nenhuma aula neste dia</p>
          </div>
        ) : (
          sortedSessions.map((session) => (
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
              hasCredits={hasCredits}
            />
          ))
        )}
      </div>
    </div>
  );
}