import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import DaySelector, { DAYS } from "@/components/schedule/DaySelector";

const emptyForm = { class_type_id: "", class_type_name: "", day_of_week: "segunda", time: "09:00", instructor: "", max_students: 8, notes: "" };

export default function ManageSessions() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterDay, setFilterDay] = useState("segunda");

  const { data: classTypes = [] } = useQuery({
    queryKey: ["classTypes"],
    queryFn: () => base44.entities.ClassType.filter({ is_active: true }),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["allSessions"],
    queryFn: () => base44.entities.ClassSession.list(),
  });

  const filteredSessions = sessions
    .filter((s) => s.day_of_week === filterDay)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  const handleClassTypeChange = (ctId) => {
    const ct = classTypes.find((c) => c.id === ctId);
    setForm({ ...form, class_type_id: ctId, class_type_name: ct?.name || "", max_students: ct?.max_students || 8 });
  };

  const handleSave = async () => {
    if (!form.class_type_id || !form.time) return toast.error("Preencha modalidade e horário");
    setSaving(true);
    try {
      const data = { ...form, is_active: true, is_recurring: true };
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
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{s.class_type_name} — {s.time}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.instructor && `${s.instructor} · `}Até {s.max_students || 8} alunas
                      {s.notes && ` · ${s.notes}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}