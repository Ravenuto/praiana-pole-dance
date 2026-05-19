import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { toast } from "sonner";

const planLabels = {
  "1x_semana": "1× por semana (4 aulas/mês)",
  "2x_semana": "2× por semana (8 aulas/mês)",
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
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-xl font-semibold">Planos das Alunas</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Defina quantas aulas por semana cada aluna tem no plano dela.
      </p>

      {isLoading ? (
        Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl mb-3" />)
      ) : students.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Nenhuma aluna cadastrada</p>
      ) : (
        <div className="space-y-3">
          {students.map((student) => (
            <div key={student.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
              <div>
                <p className="font-medium text-sm">{student.full_name || student.email}</p>
                <p className="text-xs text-muted-foreground">{student.email}</p>
              </div>
              <Select
                value={student.plan || "1x_semana"}
                onValueChange={(val) => handlePlanChange(student.id, val)}
              >
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1x_semana">1× por semana (4/mês)</SelectItem>
                  <SelectItem value="2x_semana">2× por semana (8/mês)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}