import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import CreditBanner from "@/components/schedule/CreditBanner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Clock, X, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const STATUS_FILTERS = [
  { key: "all", label: "Todas" },
  { key: "confirmada", label: "Confirmadas", icon: Check, class: "bg-primary/10 text-primary border-primary/30" },
  { key: "presente", label: "Presentes", icon: Check, class: "bg-green-100 text-green-700 border-green-300" },
  { key: "faltou", label: "Faltei", icon: AlertCircle, class: "bg-destructive/10 text-destructive border-destructive/30" },
  { key: "cancelada", label: "Canceladas", icon: X, class: "bg-muted text-muted-foreground border-border" },
];

const statusConfig = {
  confirmada: { label: "Confirmada", icon: Check, class: "bg-primary/10 text-primary" },
  cancelada: { label: "Cancelada", icon: X, class: "bg-muted text-muted-foreground" },
  presente: { label: "Presente", icon: Check, class: "bg-green-100 text-green-700" },
  faltou: { label: "Faltou", icon: AlertCircle, class: "bg-destructive/10 text-destructive" },
};

export default function MyBookings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["myAllBookings", user?.email],
    queryFn: () => base44.entities.Booking.filter({ student_email: user?.email }, "-session_date", 100),
    enabled: !!user?.email,
  });

  const handleCancel = async (booking) => {
    try {
      await base44.entities.Booking.update(booking.id, { status: "cancelada" });
      queryClient.invalidateQueries({ queryKey: ["myAllBookings"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      toast.success("Reserva cancelada");
    } catch {
      toast.error("Erro ao cancelar");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return format(new Date(dateStr + "T12:00:00"), "EEE, d 'de' MMM", { locale: ptBR });
  };

  const filtered = filterStatus === "all" ? bookings : bookings.filter((b) => b.status === filterStatus);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 font-body">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold">Minhas Reservas</h1>
        <p className="mt-1 text-muted-foreground text-sm">Acompanhe suas aulas agendadas</p>
      </div>

      <CreditBanner />

      {/* Filtros de status */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all font-medium ${
              filterStatus === f.key
                ? (f.class || "bg-foreground text-background border-foreground")
                : "bg-card text-muted-foreground border-border hover:border-primary/50"
            }`}
          >
            {f.label}
            {f.key !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({bookings.filter((b) => b.status === f.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhuma reserva encontrada</p>
            <p className="text-sm mt-1">
              {filterStatus === "all" ? "Agende sua primeira aula!" : "Nenhuma reserva com esse status."}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((booking) => {
              const status = statusConfig[booking.status] || statusConfig.confirmada;
              const StatusIcon = status.icon;
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-base font-semibold truncate">{booking.class_type_name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span className="flex items-center gap-1 capitalize">
                          <CalendarDays className="h-3 w-3 shrink-0" />
                          {formatDate(booking.session_date)}
                        </span>
                        {booking.session_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0" />
                            {booking.session_time}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`${status.class} border-0 gap-1 text-xs`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                      {booking.status === "confirmada" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(booking)}
                          className="rounded-full text-xs h-7 px-3"
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}