import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const emptyForm = { name: "", description: "", duration_minutes: 60, max_students: 8, image_url: "", color: "#c2185b" };

export default function ManageClassTypes() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: classTypes = [], isLoading } = useQuery({
    queryKey: ["classTypes"],
    queryFn: () => base44.entities.ClassType.list(),
  });

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Nome é obrigatório");
    setSaving(true);
    try {
      if (editingId) {
        await base44.entities.ClassType.update(editingId, form);
        toast.success("Modalidade atualizada");
      } else {
        await base44.entities.ClassType.create({ ...form, is_active: true });
        toast.success("Modalidade criada");
      }
      queryClient.invalidateQueries({ queryKey: ["classTypes"] });
      setOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch {
      toast.error("Erro ao salvar");
    }
    setSaving(false);
  };

  const handleEdit = (ct) => {
    setForm({
      name: ct.name || "",
      description: ct.description || "",
      duration_minutes: ct.duration_minutes || 60,
      max_students: ct.max_students || 8,
      image_url: ct.image_url || "",
      color: ct.color || "#c2185b",
    });
    setEditingId(ct.id);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    await base44.entities.ClassType.delete(id);
    queryClient.invalidateQueries({ queryKey: ["classTypes"] });
    toast.success("Modalidade excluída");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-semibold">Modalidades</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full gap-2">
              <Plus className="h-4 w-4" /> Nova Modalidade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">{editingId ? "Editar" : "Nova"} Modalidade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Pole Dance" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição da modalidade" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duração (min)</Label>
                  <Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })} />
                </div>
                <div>
                  <Label>Máx. Alunas</Label>
                  <Input type="number" value={form.max_students} onChange={(e) => setForm({ ...form, max_students: parseInt(e.target.value) || 8 })} />
                </div>
              </div>
              <div>
                <Label>URL da Imagem</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <Label>Cor</Label>
                <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 w-20" />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full rounded-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Salvar Alterações" : "Criar Modalidade"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {classTypes.map((ct) => (
          <Card key={ct.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ct.color || "#c2185b" }} />
                <div>
                  <p className="font-medium">{ct.name}</p>
                  <p className="text-sm text-muted-foreground">{ct.duration_minutes || 60}min · Até {ct.max_students || 8} alunas</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(ct)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(ct.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}