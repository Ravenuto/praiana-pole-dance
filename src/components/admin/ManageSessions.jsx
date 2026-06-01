import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Clock, User } from "lucide-react";
import { toast } from "sonner";
import DaySelector, { DAYS } from "@/components/schedule/DaySelector";

const emptyForm = { class_type_id: "", class_type_name: "", day_of_week: "segunda", time: "09:00", instructor: "", max_students: 8, notes: "", session_type: "weekly", specific_date: "" };

export default function ManageSessions() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterDay, setFilterDay] = useState("segunda");
  const [editInstructorId, setEditInstructorId] = useState(null);
  const [tempInstructor, setTempInstructor] = useState("");

  const { data: classTypes = [] } = useQuery({
    queryKey: ["classTypes"],
    queryFn: () => base44.entities.ClassType.filter({ is_active: true }),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["allSessions"],
    queryFn: () => base44.entities.ClassSession.list(),
  });

  const filteredSessions = sessions
    .filter((s) => s.day_of_week === filterDay || (!s.is_recurring && s.day_of_week === filterDay))
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

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
        // Para aula única, calculamos o day_of_week a partir da data
        const dayNames = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
        data.day_of_week = dayNames[new Date(form.specific_date + "T12:00:00").getDay()];
        data.date = form.specific_date;
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
    });
    setEditingId(s.id);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este horário?")) return;
    await base44.entities.ClassSession.delete(id);
    queryClient.invalidateQueries({ queryKey: ["allSessions"] });
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
    toast.success("Horário excluído");
  };

  const handleSaveInstructor = async (sessionId) => {
    await base44.entities.ClassSession.update(sessionId, { instructor: tempInstructor });
    queryClient.invalidateQueries({ queryKey: ["allSessions"] });
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
    setEditInstructorId(null);
    toast.success("Instrutora atualizada");
  };

  const dayLabel = DAYS.find((d) => d.key === filterDay)?.full || filterDay;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-semibold">Horários de Aula</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full gap-2">
              <Plus className="h-4 w-4" /> Novo Horário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">{editingId ? "Editar" : "Novo"} Horário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* Tipo: semanal ou única */}
              <div>
                <Label>Tipo de Aula *</Label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {[{ v: "weekly", label: "Semanal (grade fixa)" }, { v: "once", label: "Aula única (reposição)" }].map(({ v, label }) => (
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
                <Label>Observações</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ex: Nível intermediário" />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full rounded-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Salvar" : "Criar Horário"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DaySelector selected={filterDay} onChange={setFilterDay} />

      <div className="mt-4 grid gap-3">
        {filteredSessions.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Nenhum horário para {dayLabel}</p>
        ) : (
          filteredSessions.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{s.class_type_name} — {s.time}</p>
                        {!s.is_recurring && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Aula única{s.date ? ` · ${s.date}` : ""}</span>
                        )}
                      </div>
                      {/* Instrutora com edição inline */}
                      {editInstructorId === s.id ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Input
                            autoFocus
                            value={tempInstructor}
                            onChange={(e) => setTempInstructor(e.target.value)}
                            className="h-7 text-xs w-36"
                            placeholder="Nome da instrutora"
                            onKeyDown={(e) => { if (e.key === "Enter") handleSaveInstructor(s.id); if (e.key === "Escape") setEditInstructorId(null); }}
                          />
                          <Button size="sm" className="h-7 text-xs px-2" onClick={() => handleSaveInstructor(s.id)}>Ok</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setEditInstructorId(null)}>✕</Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditInstructorId(s.id); setTempInstructor(s.instructor || ""); }}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-0.5"
                          title="Clique para alterar instrutora"
                        >
                          <User className="h-3 w-3" />
                          {s.instructor || <span className="italic">Sem instrutora</span>}
                          <Pencil className="h-2.5 w-2.5 opacity-50" />
                        </button>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Até {s.max_students || 8} alunas{s.notes && ` · ${s.notes}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}