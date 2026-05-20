import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Mail, Loader2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

const planInfo = {
  "4_aulas": { label: "4 aulas/mês", color: "bg-blue-100 text-blue-700" },
  "8_aulas": { label: "8 aulas/mês", color: "bg-purple-100 text-purple-700" },
  "12_aulas": { label: "12 aulas/mês", color: "bg-pink-100 text-pink-700" },
  "avulsa": { label: "Aula avulsa", color: "bg-amber-100 text-amber-700" },
};

export default function ManageStudents() {
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [creditDialog, setCreditDialog] = useState(null); // { student, value }
  const [creditValue, setCreditValue] = useState(0);
  const [savingCredit, setSavingCredit] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  const students = users.filter((u) => u.role !== "admin");

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

  const planCredits = { "4_aulas": 4, "8_aulas": 8, "12_aulas": 12, "avulsa": 1 };

  const handlePlanChange = async (userId, plan) => {
    await base44.entities.User.update(userId, { plan, credits: planCredits[plan] || 4 });
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
        <p className="text-xs text-muted-foreground mt-2">A aluna receberá um email de convite para criar a conta.</p>
      </div>

      {/* Lista */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-heading text-lg font-semibold">Alunas cadastradas</h3>
        <Badge variant="secondary">{students.length}</Badge>
      </div>

      {isLoading ? (
        Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl mb-3" />)
      ) : students.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">Nenhuma aluna cadastrada</p>
      ) : (
        <div className="space-y-3">
          {students.map((student) => {
            const plan = student.plan || "4_aulas";
            const info = planInfo[plan] || planInfo["4_aulas"];
            return (
              <div key={student.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                      {(student.full_name || student.email || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{student.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{student.email}</p>
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
                  </div>
                </div>
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
    </div>
  );
}