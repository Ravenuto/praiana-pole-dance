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
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, X, Clock, Users, ChevronDown, ChevronUp, UserPlus, Loader2 } from "lucide-react";
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
  const [selectedDay, setSelectedDay] = useState(getTodayKey());
  const [expandedSession, setExpandedSession] = useState(null);
  const [dateOverride, setDateOverride] = useState(initialDate);

  // Sincronizar dia da semana se vier uma data inicial
  useEffect(() => {
    if (initialDate) {
      const days = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
      const d = new Date(initialDate + "T12:00:00");
      setSelectedDay(days[d.getDay()]);
      setDateOverride(initialDate);
    }
  }, [initialDate]);
  const [addStudentDialog, setAddStudentDialog] = useState(null); // { session }
  const [addStudentForm, setAddStudentForm] = useState({ name: "", isAvulsa: false });
  const [addingStudent, setAddingStudent] = useState(false);

  const selectedDate = dateOverride || getDateForDay(selectedDay);

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ["adminSessions", selectedDay],
    queryFn: () => base44.entities.ClassSession.filter({ day_of_week: selectedDay, is_active: true }),
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

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-1 flex-wrap">
          {DAYS.map((d) => (
            <button
              key={d.key}
              onClick={() => { setSelectedDay(d.key); setDateOverride(""); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedDay === d.key && !dateOverride ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <Input
          type="date"
          value={dateOverride}
          onChange={(e) => { setDateOverride(e.target.value); }}
          className="w-40 h-8 text-sm"
        />
      </div>
      <p className="text-sm text-muted-foreground mb-4 capitalize">{formattedDate}</p>

      {loadingSessions ? (
        Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl mb-3" />)
      ) : sortedSessions.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">Nenhuma aula neste dia</p>
      ) : (
        <div className="space-y-3">
          {sortedSessions.map((session) => {
            const sessionBookings = bookingsBySession[session.id] || [];
            const confirmed = sessionBookings.filter((b) => b.status === "confirmada").length;
            const present = sessionBookings.filter((b) => b.status === "presente").length;
            const isExpanded = expandedSession === session.id;

            return (
              <div key={session.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{session.class_type_name} — {session.time}</p>
                      <p className="text-xs text-muted-foreground">{session.instructor || ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className="bg-green-100 text-green-700 border-0 text-xs gap-1">
                      <Check className="h-3 w-3" />{present}
                    </Badge>
                    <Badge className="bg-primary/10 text-primary border-0 text-xs gap-1">
                      <Users className="h-3 w-3" />{sessionBookings.length}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Botões de chamada em lote — sempre visíveis */}
                    <div className="flex flex-wrap gap-2 px-4 py-2 bg-muted/20 border-b border-border">
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-green-700 border-green-300"
                        onClick={() => handleMarkAll(session.id, "presente")}>
                        <Check className="h-3 w-3" /> Todas presentes
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-destructive border-destructive/30"
                        onClick={() => handleMarkAll(session.id, "faltou")}>
                        <X className="h-3 w-3" /> Todas faltaram
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-primary border-primary/30"
                        onClick={() => { setAddStudentDialog({ session }); setAddStudentForm({ name: "", isAvulsa: false }); }}>
                        <UserPlus className="h-3 w-3" /> Adicionar aluna
                      </Button>
                    </div>
                    {sessionBookings.length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm py-6">Nenhuma reserva</p>
                    ) : (
                      <div className="divide-y divide-border">
                        {(() => {
                          // Agrupar por email: mostrar apenas a reserva mais recente/ativa por aluna
                          const seen = new Set();
                          const unique = sessionBookings.filter((b) => {
                            if (seen.has(b.student_email)) return false;
                            seen.add(b.student_email);
                            return true;
                          });
                          return unique.map((booking) => {
                            const statusOpt = statusOptions.find((s) => s.value === booking.status) || statusOptions[0];
                            return (
                              <div key={booking.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{booking.student_name || "—"}</p>
                                  <p className="text-xs text-muted-foreground truncate">{booking.student_email}</p>
                                </div>
                                <Select value={booking.status} onValueChange={(v) => handleStatus(booking.id, v)}>
                                  <SelectTrigger className="w-32 h-7 text-xs">
                                    <Badge className={`${statusOpt.cls} border-0 text-xs`}>{statusOpt.label}</Badge>
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