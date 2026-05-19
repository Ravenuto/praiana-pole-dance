import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import DaySelector from "@/components/schedule/DaySelector";
import SessionCard from "@/components/schedule/SessionCard";
import CreditBanner from "@/components/schedule/CreditBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";

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
  const date = addDays(today, diff);
  return format(date, "yyyy-MM-dd");
}

export default function Schedule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState(getTodayDayKey());
  const [loadingSession, setLoadingSession] = useState(null);

  const selectedDate = useMemo(() => getDateForDay(selectedDay), [selectedDay]);

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ["sessions", selectedDay],
    queryFn: () => base44.entities.ClassSession.filter({ day_of_week: selectedDay, is_active: true }),
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["bookings", selectedDate],
    queryFn: () => base44.entities.Booking.filter({ session_date: selectedDate, status: "confirmada" }),
  });

  const { data: myBookings = [] } = useQuery({
    queryKey: ["myBookings", selectedDate, user?.email],
    queryFn: () =>
      base44.entities.Booking.filter({
        session_date: selectedDate,
        student_email: user?.email,
        status: "confirmada",
      }),
    enabled: !!user?.email,
  });

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [sessions]);

  const bookingCountMap = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      map[b.session_id] = (map[b.session_id] || 0) + 1;
    });
    return map;
  }, [bookings]);

  const myBookingMap = useMemo(() => {
    const map = {};
    myBookings.forEach((b) => {
      map[b.session_id] = b;
    });
    return map;
  }, [myBookings]);

  const handleBook = async (session) => {
    setLoadingSession(session.id);
    try {
      await base44.entities.Booking.create({
        session_id: session.id,
        session_date: selectedDate,
        session_time: session.time,
        class_type_name: session.class_type_name,
        student_name: user?.full_name || "",
        student_email: user?.email,
        status: "confirmada",
      });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      toast.success("Aula reservada com sucesso!");
    } catch (e) {
      toast.error("Erro ao reservar aula");
    }
    setLoadingSession(null);
  };

  const handleCancel = async (session) => {
    const booking = myBookingMap[session.id];
    if (!booking) return;
    setLoadingSession(session.id);
    try {
      await base44.entities.Booking.update(booking.id, { status: "cancelada" });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      toast.success("Reserva cancelada");
    } catch (e) {
      toast.error("Erro ao cancelar reserva");
    }
    setLoadingSession(null);
  };

  const formattedDate = format(new Date(selectedDate + "T12:00:00"), "d 'de' MMMM", { locale: ptBR });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 font-body">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Agendar Aula</h1>
        <p className="mt-2 text-muted-foreground">Selecione o dia e reserve sua vaga</p>
      </div>

      <CreditBanner />
      <DaySelector selected={selectedDay} onChange={setSelectedDay} />

      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="h-4 w-4" />
        <span className="capitalize">{formattedDate}</span>
      </div>

      <div className="mt-6 space-y-3">
        {loadingSessions || loadingBookings ? (
          Array(3)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
        ) : sortedSessions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhuma aula neste dia</p>
            <p className="text-sm mt-1">Selecione outro dia para ver as aulas disponíveis</p>
          </div>
        ) : (
          sortedSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              bookingCount={bookingCountMap[session.id] || 0}
              isBooked={!!myBookingMap[session.id]}
              onBook={() => handleBook(session)}
              onCancel={() => handleCancel(session)}
              isLoading={loadingSession === session.id}
            />
          ))
        )}
      </div>
    </div>
  );
}