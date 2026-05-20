import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { toast } from "sonner";

const planInfo = {
  "4_aulas": { label: "4 aulas/mês — R$230", color: "bg-blue-100 text-blue-700" },
  "8_aulas": { label: "8 aulas/mês — R$370", color: "bg-purple-100 text-purple-700" },
  "12_aulas": { label: "12 aulas/mês — R$480", color: "bg-pink-100 text-pink-700" },
  "avulsa": { label: "Avulsa — R$70/aula", color: "bg-amber-100 text-amber-700" },
};

export default function ManagePlans() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  const handlePlanChange = async (userId, plan) => {
    await base44.entities.User.update(userId, { plan });
    queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    toast.success("Plano atualizado!");
  };

  const students = users.filter((u) => u.role !== "admin");

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-xl font-semibold">Planos das Alunas</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Defina o plano de cada aluna. Os créditos são gerenciados na aba Alunas.
      </p>

      {isLoading ? (
        Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl mb-3" />)
      ) : students.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Nenhuma aluna cadastrada</p>
      ) : (
        <div className="space-y-3">
          {students.map((student) => {
            const plan = student.plan || "4_aulas";
            const info = planInfo[plan] || planInfo["4_aulas"];
            return (
              <div key={student.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{student.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                  <Badge className={`mt-1 border-0 text-xs ${info.color}`}>{info.label}</Badge>
                </div>
                <Select value={plan} onValueChange={(val) => handlePlanChange(student.id, val)}>
                  <SelectTrigger className="w-44 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4_aulas">4 aulas/mês</SelectItem>
                    <SelectItem value="8_aulas">8 aulas/mês</SelectItem>
                    <SelectItem value="12_aulas">12 aulas/mês</SelectItem>
                    <SelectItem value="avulsa">Avulsa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}