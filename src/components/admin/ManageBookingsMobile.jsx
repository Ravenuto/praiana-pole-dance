import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, UserCheck, CalendarRange } from "lucide-react";
import { toast } from "sonner";

const statusOptions = [
  { value: "confirmada", label: "Confirmada", class: "bg-primary/10 text-primary" },
  { value: "presente", label: "Presente", class: "bg-green-100 text-green-700" },
  { value: "faltou", label: "Faltou", class: "bg-destructive/10 text-destructive" },
  { value: "cancelada", label: "Cancelada", class: "bg-muted text-muted-foreground" },
];

const today = new Date();
const presets = [
  { label: "Hoje", from: format(today, "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd") },
  { label: "Este mês", from: format(startOfMonth(today), "yyyy-MM-dd"), to: format(endOfMonth(today), "yyyy-MM-dd") },
];

export default function ManageBookings() {
  const queryClient = useQueryClient();
  const [dateFrom, setDateFrom] = useState(format(today, "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(today, "yyyy-MM-dd"));
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["adminBookingsPeriod", dateFrom, dateTo],
    queryFn: async () => {
      if (!dateFrom || !dateTo) return [];
      const all = await base44.entities.Booking.filter({}, "-session_date", 500);
      return all.filter((b) => b.session_date >= dateFrom && b.session_date <= dateTo);
    },
    enabled: !!dateFrom && !!dateTo,
  });

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const q = search.toLowerCase();
      const matchSearch = !q || (b.student_name || "").toLowerCase().includes(q) || (b.student_email || "").toLowerCase().includes(q);
      const matchStatus = filterStatus === "todos" || b.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [bookings, search, filterStatus]);

  const handleStatusChange = async (bookingId, newStatus) => {
    await base44.entities.Booking.update(bookingId, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ["adminBookingsPeriod"] });
    toast.success("Status atualizado");
  };

  const summary = useMemo(() => {
    const counts = { confirmada: 0, presente: 0, faltou: 0, cancelada: 0 };
    filtered.forEach((b) => { if (counts[b.status] !== undefined) counts[b.status]++; });
    return counts;
  }, [filtered]);

  return (
    <div>
      {/* Presets + período */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-semibold">Reservas</h2>
        <div className="flex gap-1.5">
          {presets.map((p) => (
            <Button key={p.label} size="sm" variant={dateFrom === p.from && dateTo === p.to ? "default" : "outline"}
              className="text-xs h-7 rounded-full" onClick={() => { setDateFrom(p.from); setDateTo(p.to); }}>
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Datas + status em linha compacta */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">De</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-xs" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Até</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-xs" />
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar aluna..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Resumo compacto */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge className="bg-primary/10 text-primary border-0 text-xs">{summary.confirmada} conf.</Badge>
          <Badge className="bg-green-100 text-green-700 border-0 text-xs">{summary.presente} pres.</Badge>
          <Badge className="bg-destructive/10 text-destructive border-0 text-xs">{summary.faltou} falt.</Badge>
          <Badge className="bg-muted text-muted-foreground border-0 text-xs">{summary.cancelada} canc.</Badge>
          <Badge variant="outline" className="text-xs">{filtered.length} total</Badge>
        </div>
      )}

      {isLoading ? (
        <p className="text-center text-muted-foreground py-10 text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma reserva no período</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((booking) => {
            const status = statusOptions.find((s) => s.value === booking.status) || statusOptions[0];
            return (
              <div key={booking.id} className="rounded-xl border border-border bg-card p-3">
                {/* Linha 1: nome + status select */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="font-medium text-sm truncate flex-1">{booking.student_name || booking.student_email}</p>
                  <Select value={booking.status} onValueChange={(v) => handleStatusChange(booking.id, v)}>
                    <SelectTrigger className="w-28 h-7 border-0 p-0 shadow-none">
                      <Badge className={`${status.class} border-0 text-xs`}>{status.label}</Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Linha 2: aula, data, horário em chips */}
                <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                  <span className="bg-muted px-2 py-0.5 rounded-full">{booking.class_type_name}</span>
                  <span className="bg-muted px-2 py-0.5 rounded-full">
                    {booking.session_date ? format(new Date(booking.session_date + "T12:00:00"), "dd/MM", { locale: ptBR }) : "—"}
                  </span>
                  {booking.session_time && (
                    <span className="bg-muted px-2 py-0.5 rounded-full">{booking.session_time}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}