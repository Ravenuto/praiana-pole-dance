import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

export default function StudentRequests() {
  const queryClient = useQueryClient();
  const [loadingId, setLoadingId] = useState(null);

  // Busca usuários registrados que ainda não foram ativados (is_active não true e sem créditos/plano)
  const { data: pendingUsers = [], isLoading } = useQuery({
    queryKey: ["pendingStudents"],
    queryFn: async () => {
      const all = await base44.entities.User.filter({ role: "user" }, "-created_date", 100);
      // Considera pendente quem não tem is_active = true e não tem créditos/plano
      return all.filter(u => !u.is_active && !u.credits && !u.plan);
    },
  });

  const handleApprove = async (u) => {
    setLoadingId(u.id);
    try {
      await base44.entities.User.update(u.id, { is_active: true });
      // Notificar a aluna
      await base44.entities.Notification.create({
        user_email: u.email,
        type: "credits_added",
        title: "Cadastro aprovado! 🎉",
        message: "Seu cadastro foi aprovado pelo estúdio. Bem-vinda à família Praiana! Entre em contato para escolher seu plano.",
        link: "/planos",
        read: false,
        actor_name: "Praiana Pole Dance"
      });
      queryClient.invalidateQueries({ queryKey: ["pendingStudents"] });
      toast.success(`${u.full_name || u.email} aprovada!`);
    } catch {
      toast.error("Erro ao aprovar");
    }
    setLoadingId(null);
  };

  const handleReject = async (u) => {
    setLoadingId(u.id + "_reject");
    try {
      // Marca com status de recusado para não aparecer mais
      await base44.entities.User.update(u.id, { is_active: false, plan: "rejected" });
      queryClient.invalidateQueries({ queryKey: ["pendingStudents"] });
      toast.success("Solicitação recusada.");
    } catch {
      toast.error("Erro ao recusar");
    }
    setLoadingId(null);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  if (pendingUsers.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="font-medium">Nenhuma solicitação pendente</p>
        <p className="text-sm mt-1">Novas alunas aparecerão aqui após o cadastro</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="font-heading text-base font-semibold">Solicitações de Acesso</h2>
        <Badge className="bg-primary/10 text-primary border-0">{pendingUsers.length}</Badge>
      </div>
      {pendingUsers.map((u) => (
        <div key={u.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{u.full_name || "—"}</p>
              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              {u.phone && <p className="text-xs text-muted-foreground mt-0.5">📱 {u.phone}</p>}
              {u.birth_date && (
                <p className="text-xs text-muted-foreground">
                  🎂 {u.birth_date}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Cadastrou-se em {u.created_date ? format(new Date(u.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—"}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(u)}
                disabled={loadingId === u.id + "_reject"}
                className="rounded-full h-8 px-3 text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                {loadingId === u.id + "_reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              </Button>
              <Button
                size="sm"
                onClick={() => handleApprove(u)}
                disabled={loadingId === u.id}
                className="rounded-full h-8 px-3"
              >
                {loadingId === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5 mr-1" /> Aprovar</>}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}