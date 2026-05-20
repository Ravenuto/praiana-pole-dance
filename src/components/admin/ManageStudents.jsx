import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Mail, Loader2, Plus, Minus, Pencil, Search, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const planInfo = {
  "4_aulas": { label: "4 aulas/mês", color: "bg-blue-100 text-blue-700" },
  "8_aulas": { label: "8 aulas/mês", color: "bg-purple-100 text-purple-700" },
  "12_aulas": { label: "12 aulas/mês", color: "bg-pink-100 text-pink-700" },
  "avulsa": { label: "Aula avulsa", color: "bg-amber-100 text-amber-700" },
};

const planCredits = { "4_aulas": 4, "8_aulas": 8, "12_aulas": 12, "avulsa": 1 };

export default function ManageStudents() {
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [creditDialog, setCreditDialog] = useState(null);
  const [creditValue, setCreditValue] = useState(0);
  const [savingCredit, setSavingCredit] = useState(false);
  const [editDialog, setEditDialog] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todas");
  const [expandedId, setExpandedId] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  const students = users.filter((u) => u.role !== "admin");

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (s.full_name || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q);
    const matchStatus =
      filterStatus === "todas" ||
      (filterStatus === "ativas" && s.is_active !== false) ||
      (filterStatus === "inativas" && s.is_active === false);
    return matchSearch && matchStatus;
  });

  const handleInvite = async () => {
    if (!inviteEmail.includes("@")) return toast.error("Email inválido");
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail, "user");
      setInviteEmail("");
      toast.success("Convite enviado para " + inviteEmail);
    } catch {
      toast.error("Erro ao enviar convite");
    }
    setInviting(false);
  };

  const handlePlanChange = async (userId, plan) => {
    await base44.entities.User.update(userId, {
      plan,
      credits: planCredits[plan] || 4,
      plan_start_date: format(new Date(), "yyyy-MM-dd"),
    });
    queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    toast.success("Plano atualizado! Créditos resetados para " + planCredits[plan]);
  };

  const handleSaveCredits = async () => {
    if (!creditDialog) return;
    setSavingCredit(true);
    const newCredits = Math.max(0, (creditDialog.student.credits || 0) + creditValue);
    await base44.entities.User.update(creditDialog.student.id, { credits: newCredits });
    queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    toast.success("Créditos atualizados!");
    setSavingCredit(false);
    setCreditDialog(null);
    setCreditValue(0);
  };

  const handleToggleActive = async (student) => {
    await base44.entities.User.update(student.id, { is_active: student.is_active === false ? true : false });
    queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    toast.success(student.is_active === false ? "Aluna reativada" : "Aluna desativada");
  };

  const handleSaveEdit = async () => {
    if (!editDialog) return;
    setSavingEdit(true);
    await base44.entities.User.update(editDialog.student.id, {
      phone: editDialog.phone,
      birth_date: editDialog.birth_date,
      notes: editDialog.notes,
      plan_start_date: editDialog.plan_start_date,
    });
    queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    toast.success("Dados salvos!");
    setSavingEdit(false);
    setEditDialog(null);
  };

  return (
    <div>
      {/* Convidar */}
      <div className="mb-6 p-4 rounded-xl border border-border bg-card">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" /> Cadastrar nova aluna
        </h3>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="email@exemplo.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            className="flex-1"
          />
          <Button onClick={handleInvite} disabled={inviting} className="gap-2 shrink-0">
            {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4" /> Convidar</>}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          A aluna receberá um email de convite para criar a conta.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <h3 className="font-heading text-lg font-semibold whitespace-nowrap">Alunas cadastradas</h3>
          <Badge variant="secondary">{filtered.length}</Badge>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-28 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="ativas">Ativas</SelectItem>
              <SelectItem value="inativas">Inativas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl mb-3" />)
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">Nenhuma aluna encontrada</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((student) => {
            const plan = student.plan || "4_aulas";
            const info = planInfo[plan] || planInfo["4_aulas"];
            const isActive = student.is_active !== false;
            const isExpanded = expandedId === student.id;

            return (
              <div key={student.id} className={`rounded-xl border border-border bg-card overflow-hidden transition-opacity ${!isActive ? "opacity-60" : ""}`}>
                {/* Linha principal */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-primary font-bold shrink-0 ${isActive ? "bg-primary/10" : "bg-muted"}`}>
                      {(student.full_name || student.email || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{student.full_name || "—"}</p>
                        {!isActive && <Badge className="bg-muted text-muted-foreground border-0 text-xs">Inativa</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                      {student.plan_start_date && (
                        <p className="text-xs text-muted-foreground">
                          Plano desde{" "}
                          {format(new Date(student.plan_start_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={plan} onValueChange={(v) => handlePlanChange(student.id, v)}>
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4_aulas">4 aulas/mês</SelectItem>
                        <SelectItem value="8_aulas">8 aulas/mês</SelectItem>
                        <SelectItem value="12_aulas">12 aulas/mês</SelectItem>
                        <SelectItem value="avulsa">Avulsa</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1"
                      onClick={() => { setCreditDialog({ student }); setCreditValue(0); }}
                    >
                      <Plus className="h-3 w-3" />
                      {student.credits || 0} créditos
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Editar detalhes"
                      onClick={() => setEditDialog({ student, phone: student.phone || "", birth_date: student.birth_date || "", notes: student.notes || "", plan_start_date: student.plan_start_date || "" })}
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : student.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Detalhes expandidos */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Telefone</p>
                      <p className="font-medium">{student.phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Data de nascimento</p>
                      <p className="font-medium">
                        {student.birth_date
                          ? format(new Date(student.birth_date + "T12:00:00"), "dd/MM/yyyy")
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Plano atual</p>
                      <Badge className={`${info.color} border-0 text-xs`}>{info.label}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Créditos restantes</p>
                      <p className="font-medium">{student.credits || 0} aulas</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Início do plano</p>
                      <p className="font-medium">
                        {student.plan_start_date
                          ? format(new Date(student.plan_start_date + "T12:00:00"), "dd/MM/yyyy")
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => handleToggleActive(student)}
                        />
                        <span className="text-xs">{isActive ? "Ativa" : "Inativa"}</span>
                      </div>
                    </div>
                    {student.notes && (
                      <div className="sm:col-span-3">
                        <p className="text-xs text-muted-foreground mb-0.5">Observações</p>
                        <p className="text-sm">{student.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog créditos */}
      {creditDialog && (
        <Dialog open={!!creditDialog} onOpenChange={() => { setCreditDialog(null); setCreditValue(0); }}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle className="font-heading">Editar Créditos</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <p className="text-sm text-muted-foreground mb-4">
                {creditDialog.student.full_name || creditDialog.student.email}<br />
                <span className="font-semibold text-foreground">Atual: {creditDialog.student.credits || 0} créditos</span>
              </p>
              <Label className="text-xs mb-2 block">Ajuste (positivo = adicionar, negativo = remover)</Label>
              <div className="flex items-center gap-3 justify-center my-4">
                <Button variant="outline" size="icon" onClick={() => setCreditValue((v) => v - 1)}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-3xl font-bold font-heading w-12 text-center">
                  {creditValue > 0 ? `+${creditValue}` : creditValue}
                </span>
                <Button variant="outline" size="icon" onClick={() => setCreditValue((v) => v + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-center text-sm text-muted-foreground mb-4">
                Novo total: <strong>{Math.max(0, (creditDialog.student.credits || 0) + creditValue)}</strong> créditos
              </p>
              <Button onClick={handleSaveCredits} disabled={savingCredit || creditValue === 0} className="w-full rounded-full">
                {savingCredit ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog editar detalhes */}
      {editDialog && (
        <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-heading">Detalhes da Aluna</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-sm font-medium">{editDialog.student.full_name || editDialog.student.email}</p>
              <div>
                <Label className="text-xs mb-1 block">Telefone / WhatsApp</Label>
                <Input value={editDialog.phone} onChange={(e) => setEditDialog((d) => ({ ...d, phone: e.target.value }))} className="h-8 text-sm" placeholder="(11) 99999-9999" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Data de nascimento</Label>
                <Input type="date" value={editDialog.birth_date} onChange={(e) => setEditDialog((d) => ({ ...d, birth_date: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Início do plano atual</Label>
                <Input type="date" value={editDialog.plan_start_date} onChange={(e) => setEditDialog((d) => ({ ...d, plan_start_date: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Observações</Label>
                <Input value={editDialog.notes} onChange={(e) => setEditDialog((d) => ({ ...d, notes: e.target.value }))} className="h-8 text-sm" placeholder="Ex: lesão no joelho..." />
              </div>
              <Button onClick={handleSaveEdit} disabled={savingEdit} className="w-full rounded-full">
                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}