import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, UserCheck, CalendarRange, Filter } from "lucide-react";
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
  {
    label: "Este mês",
    from: format(startOfMonth(today), "yyyy-MM-dd"),
    to: format(endOfMonth(today), "yyyy-MM-dd"),
  },
];

export default function ManageBookings() {
  const queryClient = useQueryClient();
  const [dateFrom, setDateFrom] = useState(format(today, "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(today, "yyyy-MM-dd"));
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterModality, setFilterModality] = useState("todas");

  // Busca todos os bookings no período (até 500)
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["adminBookingsPeriod", dateFrom, dateTo],
    queryFn: async () => {
      if (!dateFrom || !dateTo) return [];
      // Filtra do lado do servidor pela data de início, e filtra o restante client-side
      const all = await base44.entities.Booking.filter({}, "-session_date", 500);
      return all.filter((b) => b.session_date >= dateFrom && b.session_date <= dateTo);
    },
    enabled: !!dateFrom && !!dateTo,
  });

  // Busca todas as modalidades cadastradas
  const { data: classTypes = [] } = useQuery({
    queryKey: ["classTypes"],
    queryFn: () => base44.entities.ClassType.filter({ is_active: true }),
  });

  // Modalidades únicas para o filtro — sempre todas as cadastradas
  const modalities = useMemo(() => {
    return classTypes.map((ct) => ct.name).sort();
  }, [classTypes]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (b.student_name || "").toLowerCase().includes(q) ||
        (b.student_email || "").toLowerCase().includes(q);
      const matchStatus = filterStatus === "todos" || b.status === filterStatus;
      const matchModality = filterModality === "todas" || b.class_type_name === filterModality;
      return matchSearch && matchStatus && matchModality;
    });
  }, [bookings, search, filterStatus, filterModality]);

  const handleStatusChange = async (bookingId, newStatus) => {
    await base44.entities.Booking.update(bookingId, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ["adminBookingsPeriod"] });
    toast.success("Status atualizado");
  };

  const applyPreset = (preset) => {
    setDateFrom(preset.from);
    setDateTo(preset.to);
  };

  // Contadores resumo
  const summary = useMemo(() => {
    const counts = { confirmada: 0, presente: 0, faltou: 0, cancelada: 0 };
    filtered.forEach((b) => { if (counts[b.status] !== undefined) counts[b.status]++; });
    return counts;
  }, [filtered]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-xl font-semibold">Reservas</h2>
        <div className="flex gap-2">
          {presets.map((p) => (
            <Button
              key={p.label}
              size="sm"
              variant={dateFrom === p.from && dateTo === p.to ? "default" : "outline"}
              className="text-xs h-8 rounded-full gap-1"
              onClick={() => applyPreset(p)}
            >
              <CalendarRange className="h-3 w-3" /> {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">De</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Até</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Modalidade</label>
          <Select value={filterModality} onValueChange={setFilterModality}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {modalities.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Status</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Resumo */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge className="bg-primary/10 text-primary border-0 text-xs">{summary.confirmada} confirmadas</Badge>
          <Badge className="bg-green-100 text-green-700 border-0 text-xs">{summary.presente} presentes</Badge>
          <Badge className="bg-destructive/10 text-destructive border-0 text-xs">{summary.faltou} faltaram</Badge>
          <Badge className="bg-muted text-muted-foreground border-0 text-xs">{summary.cancelada} canceladas</Badge>
          <Badge variant="outline" className="text-xs">{filtered.length} total</Badge>
        </div>
      )}

      {isLoading ? (
        <p className="text-center text-muted-foreground py-10">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Nenhuma reserva no período</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Aluna</TableHead>
                <TableHead>Aula</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((booking) => {
                const status = statusOptions.find((s) => s.value === booking.status) || statusOptions[0];
                return (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{booking.student_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{booking.student_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{booking.class_type_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {booking.session_date
                        ? format(new Date(booking.session_date + "T12:00:00"), "dd/MM/yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{booking.session_time || "—"}</TableCell>
                    <TableCell>
                      <Select value={booking.status} onValueChange={(v) => handleStatusChange(booking.id, v)}>
                        <SelectTrigger className="w-32 h-8">
                          <Badge className={`${status.class} border-0 text-xs`}>{status.label}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}