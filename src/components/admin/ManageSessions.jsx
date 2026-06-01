import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Clock, User, Users, ChevronLeft, ChevronRight, CalendarDays, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, startOfWeek, addMonths, subMonths, startOfMonth, endOfMonth, isSameMonth, isSameDay, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import DaySelector, { DAYS } from "@/components/schedule/DaySelector";

const DAY_NAMES = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

// Dialog de confirmação de exclusão para aulas recorrentes
function DeleteRecurringDialog({ session, date, onCancel, onDeleteOne, onDeleteAll }) {
  const [loading, setLoading] = useState(false);
  const doDelete = async (fn) => { setLoading(true); await fn(); setLoading(false); };
  return (
    <Dialog open onOpenChange={() => onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Excluir aula recorrente</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mt-2">
          Esta é uma aula da grade semanal. O que você deseja fazer?
        </p>
        <div className="mt-4 space-y-2">
          <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" disabled={loading}
            onClick={() => doDelete(onDeleteOne)}>
            <div>
              <p className="font-medium text-sm">Somente este dia</p>
              <p className="text-xs text-muted-foreground">Cancela apenas {date}</p>
            </div>
          </Button>
          <Button variant="destructive" className="w-full justify-start gap-2 h-auto py-3" disabled={loading}
            onClick={() => doDelete(onDeleteAll)}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            <div>
              <p className="font-medium text-sm">Excluir este e todos os próximos</p>
              <p className="text-xs opacity-80">Remove o horário da grade permanentemente</p>
            </div>
          </Button>
        </div>
        <Button variant="ghost" className="w-full mt-1" onClick={onCancel} disabled={loading}>Cancelar</Button>
      </DialogContent>
    </Dialog>
  );
}

const emptyForm = {
  class_type_id: "", class_type_name: "", day_of_week: "segunda",
  time: "09:00", instructor: "", max_students: 8, notes: "",
  session_type: "weekly", specific_date: "", override_notes: "",
};

export default function ManageSessions() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // session a ser deletada

  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const { data: classTypes = [] } = useQuery({
    queryKey: ["classTypes"],
    queryFn: () => base44.entities.ClassType.filter({ is_active: true }),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["allSessions"],
    queryFn: () => base44.entities.ClassSession.list(),
  });

  const { data: holidays = [] } = useQuery({
    queryKey: ["holidays", selectedDate],
    queryFn: () => base44.entities.Holiday.filter({ date: selectedDate }),
  });

  const isHoliday = holidays.length > 0;
  const holidayRecord = holidays[0] || null;

  const toggleHoliday = async () => {
    if (isHoliday) {
      await base44.entities.Holiday.delete(holidayRecord.id);
    } else {
      await base44.entities.Holiday.create({ date: selectedDate, label: "Feriado" });
    }
    queryClient.invalidateQueries({ queryKey: ["holidays"] });
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
    toast.success(isHoliday ? "Feriado removido — aulas liberadas!" : "Feriado ativado para este dia!");
  };

  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings", selectedDate],
    queryFn: () => base44.entities.Booking.filter({ session_date: selectedDate, status: "confirmada" }, "-created_date", 100),
  });

  const selectedDayKey = useMemo(() => DAY_NAMES[new Date(selectedDate + "T12:00:00").getDay()], [selectedDate]);

  const filteredSessions = useMemo(() => {
    return sessions
      .filter((s) => {
        if (s.is_recurring) {
          if (s.day_of_week !== selectedDayKey || s.is_active === false) return false;
          if (s.cancelled_dates && s.cancelled_dates.includes(selectedDate)) return false;
          return true;
        }
        return s.date === selectedDate && s.is_active !== false;
      })
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [sessions, selectedDate, selectedDayKey]);

  const bookingCountMap = useMemo(() => {
    const map = {};
    bookings.forEach((b) => { map[b.session_id] = (map[b.session_id] || 0) + 1; });
    return map;
  }, [bookings]);

  const handleClassTypeChange = (ctId) => {
    const ct = classTypes.find((c) => c.id === ctId);
    setForm({ ...form, class_type_id: ctId, class_type_name: ct?.name || "", max_students: ct?.max_students || 8 });
  };

  const handleSave = async () => {
    if (!form.class_type_id || !form.time) return toast.error("Preencha modalidade e horário");
    if (form.session_type === "once" && !form.specific_date) return toast.error("Informe a data da aula única");
    setSaving(true);
    try {
      const isRecurring = form.session_type !== "once";
      const data = { ...form, is_active: true, is_recurring: isRecurring };
      if (!isRecurring) {
        data.day_of_week = DAY_NAMES[new Date(form.specific_date + "T12:00:00").getDay()];
        data.date = form.specific_date;
      }
      
      // Se for recorrente e tiver override_notes, cria um registro de override
      if (isRecurring && form.override_notes) {
        const overrideKey = `${editingId || "new"}_${selectedDate}`;
        data.session_overrides = data.session_overrides || {};
        data.session_overrides[selectedDate] = { notes: form.override_notes };
      }
      
      if (editingId) {
        await base44.entities.ClassSession.update(editingId, data);
        toast.success("Horário atualizado");
      } else {
        await base44.entities.ClassSession.create(data);
        toast.success("Horário criado");
      }
      queryClient.invalidateQueries({ queryKey: ["allSessions"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch {
      toast.error("Erro ao salvar");
    }
    setSaving(false);
  };

  const handleEdit = (s) => {
    setForm({
      class_type_id: s.class_type_id || "",
      class_type_name: s.class_type_name || "",
      day_of_week: s.day_of_week || "segunda",
      time: s.time || "09:00",
      instructor: s.instructor || "",
      max_students: s.max_students || 8,
      notes: s.notes || "",
      session_type: s.is_recurring === false ? "once" : "weekly",
      specific_date: s.date || "",
      override_notes: s.override_notes || "",
    });
    setEditingId(s.id);
    setOpen(true);
  };

  const handleDelete = (session) => {
    if (session.is_recurring) {
      setDeleteTarget(session);
    } else {
      if (!confirm("Excluir esta aula única?")) return;
      base44.entities.ClassSession.delete(session.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ["allSessions"] });
        queryClient.invalidateQueries({ queryKey: ["sessions"] });
        toast.success("Aula excluída");
      });
    }
  };

  // Cancela apenas o dia: cria uma aula única "cancelada" como exceção
  const handleDeleteOneDay = async () => {
    // Marca a sessão recorrente com uma data cancelada (cancelled_dates array)
    const s = deleteTarget;
    const cancelled = s.cancelled_dates ? [...s.cancelled_dates, selectedDate] : [selectedDate];
    await base44.entities.ClassSession.update(s.id, { cancelled_dates: cancelled });
    queryClient.invalidateQueries({ queryKey: ["allSessions"] });
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
    setDeleteTarget(null);
    toast.success("Aula cancelada para este dia");
  };

  // Exclui o horário permanentemente
  const handleDeleteAll = async () => {
    await base44.entities.ClassSession.delete(deleteTarget.id);
    queryClient.invalidateQueries({ queryKey: ["allSessions"] });
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
    setDeleteTarget(null);
    toast.success("Horário excluído da grade");
  };

  // Mini calendário (igual ao Schedule)
  const renderCalendar = () => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = [];
    let cur = calStart;
    while (cur <= calEnd) { days.push(cur); cur = addDays(cur, 1); }
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
          {dayNames.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isCurrentMonth = isSameMonth(day, calendarMonth);
            const isSelected = dateStr === selectedDate;
            const isToday = isSameDay(day, today);
            return (
              <button
                key={dateStr}
                onClick={() => {
                  if (!isCurrentMonth) return;
                  setSelectedDate(dateStr);
                  setWeekAnchor(day);
                  setCalendarOpen(false);
                }}
                disabled={!isCurrentMonth}
                className={`aspect-square rounded-lg text-xs font-medium transition-colors flex items-center justify-center
                  ${!isCurrentMonth ? "opacity-0 pointer-events-none" : ""}
                  ${isSelected ? "bg-primary text-primary-foreground" : ""}
                  ${!isSelected && isToday ? "bg-primary/10 text-primary font-bold" : ""}
                  ${!isSelected && !isToday && isCurrentMonth ? "hover:bg-muted" : ""}
                `}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const formattedDate = format(new Date(selectedDate + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
         <h2 className="font-heading text-base font-semibold">Horários de Aula</h2>
         <Button size="sm" className="rounded-full gap-2 text-xs" onClick={() => { setForm(emptyForm); setEditingId(null); setOpen(true); }}>
           <Plus className="h-4 w-4" /> Novo Horário
         </Button>
       </div>

      {/* Seletor de data com calendário — igual ao das alunas */}
      <div className="relative mb-3">
        <button
          onClick={() => setCalendarOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-muted/40 border border-border hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium capitalize">{formattedDate}</span>
          </div>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${calendarOpen ? "rotate-90" : ""}`} />
        </button>
        {calendarOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setCalendarOpen(false)} />
            {renderCalendar()}
          </>
        )}
      </div>

      <DaySelector
        selectedDate={selectedDate}
        onSelectDate={(dateStr) => setSelectedDate(dateStr)}
        weekAnchor={weekAnchor}
        onWeekChange={(newAnchor) => setWeekAnchor(newAnchor)}
      />

      {/* Botão feriado */}
      <div className="mt-3">
        <button
          onClick={toggleHoliday}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
            isHoliday
              ? "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/20 dark:border-amber-600 dark:text-amber-400"
              : "bg-muted/30 border-border text-muted-foreground hover:border-amber-300 hover:text-amber-600"
          }`}
        >
          <div className="flex items-center gap-2">
            <PartyPopper className="h-4 w-4" />
            <span className="text-sm font-medium">{isHoliday ? "🎉 Feriado ativo — clique para desativar" : "Marcar como feriado"}</span>
          </div>
          <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${isHoliday ? "bg-amber-400" : "bg-muted"}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${isHoliday ? "translate-x-4" : "translate-x-0"}`} />
          </div>
        </button>
      </div>

      {/* Lista de aulas do dia */}
      <div className="mt-4 space-y-3">
        {isHoliday ? (
          <div className="text-center py-12 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-800">
            <span className="text-4xl">🎉</span>
            <p className="font-semibold text-amber-700 dark:text-amber-400 mt-3">Feriado</p>
            <p className="text-xs text-amber-600/80 mt-1">As aulas deste dia estão ocultas para as alunas</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarDays className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma aula neste dia</p>
            <p className="text-xs mt-1">Clique em "Novo Horário" para adicionar</p>
          </div>
        ) : (
          filteredSessions.map((s) => {
            const booked = bookingCountMap[s.id] || 0;
            const max = s.max_students || 8;
            const isFull = booked >= max;
            return (
              <div key={s.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs">{s.class_type_name} · {s.time}</p>
                       {s.instructor && (
                         <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                           <User className="h-3 w-3" /> {s.instructor}
                         </p>
                       )}
                       <div className="flex items-center gap-2 mt-1 flex-wrap">
                         <span className={`text-[10px] flex items-center gap-1 ${isFull ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                          <Users className="h-3 w-3" /> {booked}/{max} {isFull ? "Lotada" : ""}
                        </span>
                        {!s.is_recurring && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Única</span>
                        )}
                        {s.notes && (
                            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{s.notes}</span>
                          )}
                          {s.session_overrides && s.session_overrides[selectedDate] && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">📝 {s.session_overrides[selectedDate].notes}</span>
                          )}
                       </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dialog confirmar exclusão de recorrente */}
      {deleteTarget && (
        <DeleteRecurringDialog
          session={deleteTarget}
          date={format(new Date(selectedDate + "T12:00:00"), "dd/MM/yyyy")}
          onCancel={() => setDeleteTarget(null)}
          onDeleteOne={handleDeleteOneDay}
          onDeleteAll={handleDeleteAll}
        />
      )}

      {/* Dialog criar/editar */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditingId(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? "Editar" : "Novo"} Horário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Tipo de Aula *</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {[{ v: "weekly", label: "Semanal (grade fixa)" }, { v: "once", label: "Aula única" }].map(({ v, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm({ ...form, session_type: v })}
                    className={`rounded-lg border px-3 py-2 text-sm text-left transition-colors ${form.session_type === v ? "border-primary bg-primary/10 text-primary font-medium" : "border-border text-muted-foreground hover:border-primary/50"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Modalidade *</Label>
              <Select value={form.class_type_id} onValueChange={handleClassTypeChange}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {classTypes.map((ct) => (
                    <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.session_type === "weekly" ? (
              <div>
                <Label>Dia da Semana *</Label>
                <Select value={form.day_of_week} onValueChange={(v) => setForm({ ...form, day_of_week: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d.key} value={d.key}>{d.full}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label>Data da Aula *</Label>
                <Input type="date" value={form.specific_date} onChange={(e) => setForm({ ...form, specific_date: e.target.value })} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Horário *</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
              <div>
                <Label>Máx. Alunas</Label>
                <Input type="number" value={form.max_students} onChange={(e) => setForm({ ...form, max_students: parseInt(e.target.value) || 8 })} />
              </div>
            </div>

            <div>
              <Label>Instrutora</Label>
              <Input value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} placeholder="Nome da instrutora" />
            </div>

            <div>
              <Label>Observações gerais</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ex: Nível intermediário" />
            </div>

            {form.session_type === "weekly" && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">📝 Observação específica (apenas para {formattedDate})</p>
                <Input 
                  value={form.override_notes} 
                  onChange={(e) => setForm({ ...form, override_notes: e.target.value })} 
                  placeholder="Ex: Com salto, Sem salto..." 
                  className="h-8 text-sm"
                />
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full rounded-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Salvar alterações" : "Criar Horário"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}