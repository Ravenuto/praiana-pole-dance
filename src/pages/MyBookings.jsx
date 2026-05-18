import React from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Clock, X, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const statusConfig = {
  confirmada: { label: "Confirmada", icon: Check, class: "bg-primary/10 text-primary" },
  cancelada: { label: "Cancelada", icon: X, class: "bg-muted text-muted-foreground" },
  presente: { label: "Presente", icon: Check, class: "bg-green-100 text-green-700" },
  faltou: { label: "Faltou", icon: AlertCircle, class: "bg-destructive/10 text-destructive" },
};

export default function MyBookings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["myAllBookings", user?.email],
    queryFn: () => base44.entities.Booking.filter({ student_email: user?.email }, "-session_date", 50),
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
    return format(new Date(dateStr + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: ptBR });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 font-body">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Minhas Reservas</h1>
        <p className="mt-2 text-muted-foreground">Acompanhe suas aulas agendadas</p>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array(4)
            .fill(0)
            .map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhuma reserva encontrada</p>
            <p className="text-sm mt-1">Agende sua primeira aula!</p>
          </div>
        ) : (
          <AnimatePresence>
            {bookings.map((booking) => {
              const status = statusConfig[booking.status] || statusConfig.confirmada;
              const StatusIcon = status.icon;
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl border border-border bg-card p-4 sm:p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-lg font-semibold">{booking.class_type_name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 capitalize">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(booking.session_date)}
                        </span>
                        {booking.session_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {booking.session_time}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${status.class} border-0 gap-1`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                      {booking.status === "confirmada" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(booking)}
                          className="rounded-full text-xs"
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