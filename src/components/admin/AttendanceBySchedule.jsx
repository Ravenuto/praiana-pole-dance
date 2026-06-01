import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, X, Clock, Users, ChevronDown, ChevronUp, UserPlus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const DAYS = [
  { key: "segunda", label: "Seg" }, { key: "terca", label: "Ter" },
  { key: "quarta", label: "Qua" }, { key: "quinta", label: "Qui" },
  { key: "sexta", label: "Sex" }, { key: "sabado", label: "Sáb" },
  { key: "domingo", label: "Dom" },
];

function getDateForDay(dayKey) {
  const dayMap = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
  const today = new Date();
  const todayDay = today.getDay();
  const targetDay = dayMap[dayKey];
  let diff = targetDay - todayDay;
  if (diff < 0) diff += 7;
  return format(addDays(today, diff), "yyyy-MM-dd");
}

function getTodayKey() {
  const days = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  return days[new Date().getDay()];
}

const statusOptions = [
  { value: "confirmada", label: "Confirmada", cls: "bg-primary/10 text-primary" },
  { value: "presente", label: "Presente", cls: "bg-green-100 text-green-700" },
  { value: "faltou", label: "Faltou", cls: "bg-destructive/10 text-destructive" },
  { value: "cancelada", label: "Cancelada", cls: "bg-muted text-muted-foreground" },
];

export default function AttendanceBySchedule({ initialDate = "" }) {
   const queryClient = useQueryClient();
   const [expandedSession, setExpandedSession] = useState(null);
   const [weekAnchor, setWeekAnchor] = useState(() => {
     if (initialDate) return new Date(initialDate + "T12:00:00");
     return new Date();
   });
   const [selectedDate, setSelectedDate] = useState(initialDate || format(new Date(), "yyyy-MM-dd"));
   const [addStudentDialog, setAddStudentDialog] = useState(null);
   const [addStudentForm, setAddStudentForm] = useState({ name: "", isAvulsa: false });
   const [addingStudent, setAddingStudent] = useState(false);

   const selectedDayKey = useMemo(() => {
     const days = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
     return days[new Date(selectedDate + "T12:00:00").getDay()];
   }, [selectedDate]);

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ["adminSessions", selectedDayKey],
    queryFn: async () => {
      const all = await base44.entities.ClassSession.filter({ day_of_week: selectedDayKey, is_active: true });
      return all.filter(s => {
        if (s.cancelled_dates && s.cancelled_dates.includes(selectedDate)) return false;
        return true;
      });
    },
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["adminBookingsAtt", selectedDate],
    queryFn: () => base44.entities.Booking.filter({ session_date: selectedDate }, "-created_date", 200),
    enabled: !!selectedDate,
  });

  const sortedSessions = useMemo(() => [...sessions].sort((a, b) => (a.time || "").localeCompare(b.time || "")), [sessions]);

  const bookingsBySession = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      if (!map[b.session_id]) map[b.session_id] = [];
      map[b.session_id].push(b);
    });
    return map;
  }, [bookings]);

  const handleStatus = async (bookingId, status) => {
    await base44.entities.Booking.update(bookingId, { status });
    queryClient.invalidateQueries({ queryKey: ["adminBookingsAtt"] });
    toast.success("Status atualizado");
  };

  const handleMarkAll = async (sessionId, status) => {
    const list = (bookingsBySession[sessionId] || []).filter((b) => b.status === "confirmada");
    await Promise.all(list.map((b) => base44.entities.Booking.update(b.id, { status })));
    queryClient.invalidateQueries({ queryKey: ["adminBookingsAtt"] });
    toast.success(`${list.length} alunas marcadas como ${status}`);
  };

  const handleAddStudent = async () => {
    if (!addStudentForm.name && !addStudentForm.isAvulsa) return toast.error("Nome obrigatório");
    setAddingStudent(true);
    try {
      const session = addStudentDialog.session;
      const studentName = addStudentForm.isAvulsa ? "Avulsa" : addStudentForm.name;
      const studentEmail = addStudentForm.isAvulsa ? `avulsa-${Date.now()}@praiana.app` : `manual-${addStudentForm.name.replace(/\s+/g, "").toLowerCase()}@praiana.app`;
      await base44.entities.Booking.create({
        session_id: session.id,
        session_date: selectedDate,
        session_time: session.time,
        class_type_name: session.class_type_name,
        student_name: studentName,
        student_email: studentEmail,
        status: "confirmada",
      });
      queryClient.invalidateQueries({ queryKey: ["adminBookingsAtt"] });
      toast.success(addStudentForm.isAvulsa ? "Vaga avulsa adicionada!" : "Aluna adicionada à aula!");
      setAddStudentDialog(null);
      setAddStudentForm({ name: "", isAvulsa: false });
    } catch {
      toast.error("Erro ao adicionar");
    }
    setAddingStudent(false);
  };

  const formattedDate = format(new Date(selectedDate + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: ptBR });

  // Renderizar semana (igual ao Schedule)
  const weekStart = startOfWeek(weekAnchor, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div>
      {/* Navegação da semana */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <button onClick={() => setWeekAnchor(addDays(weekAnchor, -7))} className="p-1 hover:bg-muted rounded transition-colors">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex gap-1">
          {weekDays.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isSelected = dateStr === selectedDate;
            const dayLabel = format(day, "EEE", { locale: ptBR });
            const dayNum = format(day, "d");
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`flex flex-col items-center gap-0 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <span className="capitalize leading-tight">{dayLabel}</span>
                <span className="font-semibold text-[11px] leading-tight">{dayNum}</span>
              </button>
            );
          })}
        </div>
        <button onClick={() => setWeekAnchor(addDays(weekAnchor, 7))} className="p-1 hover:bg-muted rounded transition-colors">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <div className="flex items-center justify-center gap-6 mb-3">
        <p className="text-xs text-muted-foreground capitalize flex-1 text-left">{format(new Date(selectedDate + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-7 text-xs w-32" />
      </div>

      {loadingSessions ? (
        Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg mb-1.5" />)
      ) : sortedSessions.length === 0 ? (
        <p className="text-center text-muted-foreground py-4 text-xs">Nenhuma aula neste dia</p>
      ) : (
        <div className="space-y-1.5">
          {sortedSessions.map((session) => {
            const sessionBookings = bookingsBySession[session.id] || [];
            const present = sessionBookings.filter((b) => b.status === "presente").length;
            const activeCount = sessionBookings.filter((b) => b.status !== "cancelada").length;
            const isExpanded = expandedSession === session.id;

            return (
              <div key={session.id} className="rounded-lg border border-border bg-card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between gap-2 p-2 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                       <p className="font-semibold text-[10px] truncate">{session.class_type_name} — {session.time}</p>
                       <p className="text-[9px] text-muted-foreground truncate">{session.instructor || ""}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Badge className="bg-green-100 text-green-700 border-0 text-[9px] h-5 px-1.5 gap-0.5">
                      <Check className="h-3 w-3" />{present}
                    </Badge>
                    <Badge className="bg-primary/10 text-primary border-0 text-[9px] h-5 px-1.5 gap-0.5">
                      <Users className="h-3 w-3" />{activeCount}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Botões de chamada em lote — sempre visíveis */}
                    <div className="flex gap-1 px-2 py-1 bg-muted/20 border-b border-border">
                      <Button size="sm" variant="outline" className="text-[9px] h-6 gap-0.5 flex-1 text-green-700 border-green-300"
                        onClick={() => handleMarkAll(session.id, "presente")}>
                        <Check className="h-2.5 w-2.5" /> Presentes
                      </Button>
                      <Button size="sm" variant="outline" className="text-[9px] h-6 gap-0.5 flex-1 text-destructive border-destructive/30"
                        onClick={() => handleMarkAll(session.id, "faltou")}>
                        <X className="h-2.5 w-2.5" /> Faltaram
                      </Button>
                      <Button size="sm" variant="outline" className="text-[9px] h-6 gap-0.5 flex-1 text-primary border-primary/30"
                        onClick={() => { setAddStudentDialog({ session }); setAddStudentForm({ name: "", isAvulsa: false }); }}>
                        <UserPlus className="h-2.5 w-2.5" /> Adicionar
                      </Button>
                    </div>
                    {sessionBookings.length === 0 ? (
                      <p className="text-center text-muted-foreground text-[9px] py-2">Nenhuma reserva</p>
                    ) : (
                      <div className="divide-y divide-border">
                        {(() => {
                          const seen = new Set();
                          const unique = sessionBookings.filter((b) => {
                            if (seen.has(b.student_email)) return false;
                            seen.add(b.student_email);
                            return true;
                          });
                          return unique.map((booking) => {
                            const statusOpt = statusOptions.find((s) => s.value === booking.status) || statusOptions[0];
                            return (
                              <div key={booking.id} className="flex items-center justify-between gap-1 px-2 py-1.5">
                                <div className="min-w-0">
                                   <p className="font-medium text-[10px] truncate">{booking.student_name || "—"}</p>
                                   <p className="text-[8px] text-muted-foreground truncate">{booking.student_email}</p>
                                 </div>
                                 <Select value={booking.status} onValueChange={(v) => handleStatus(booking.id, v)}>
                                   <SelectTrigger className="w-24 h-6 text-[9px]">
                                    <Badge className={`${statusOpt.cls} border-0 text-[8px]`}>{statusOpt.label}</Badge>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {statusOptions.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Dialog adicionar aluna na aula */}
      {addStudentDialog && (
        <Dialog open={!!addStudentDialog} onOpenChange={() => setAddStudentDialog(null)}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle className="font-heading text-base">Adicionar Aluna na Aula</DialogTitle>
            </DialogHeader>
            <div className="py-1 text-xs text-muted-foreground mb-2">
              {addStudentDialog.session.class_type_name} — {addStudentDialog.session.time} — {selectedDate}
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setAddStudentForm(f => ({ ...f, isAvulsa: false }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${!addStudentForm.isAvulsa ? "bg-primary text-white border-primary" : "bg-muted text-muted-foreground border-border"}`}
                >
                  Nome da aluna
                </button>
                <button
                  onClick={() => setAddStudentForm(f => ({ ...f, isAvulsa: true, name: "" }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${addStudentForm.isAvulsa ? "bg-primary text-white border-primary" : "bg-muted text-muted-foreground border-border"}`}
                >
                  Avulsa
                </button>
              </div>
              {!addStudentForm.isAvulsa && (
                <div>
                  <Label className="text-xs mb-1 block">Nome</Label>
                  <Input value={addStudentForm.name} onChange={(e) => setAddStudentForm((f) => ({ ...f, name: e.target.value }))} className="h-8 text-sm" placeholder="Nome da aluna" />
                </div>
              )}
              {addStudentForm.isAvulsa && (
                <p className="text-sm text-muted-foreground text-center py-2">Uma vaga "Avulsa" será reservada nesta aula.</p>
              )}
              <Button onClick={handleAddStudent} disabled={addingStudent} className="w-full rounded-full">
                {addingStudent ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}