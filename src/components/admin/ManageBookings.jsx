import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, X, AlertCircle, UserCheck, Search } from "lucide-react";
import { toast } from "sonner";

const statusOptions = [
  { value: "confirmada", label: "Confirmada", class: "bg-primary/10 text-primary" },
  { value: "presente", label: "Presente", class: "bg-green-100 text-green-700" },
  { value: "faltou", label: "Faltou", class: "bg-destructive/10 text-destructive" },
  { value: "cancelada", label: "Cancelada", class: "bg-muted text-muted-foreground" },
];

export default function ManageBookings() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["adminBookings", dateFilter],
    queryFn: () => base44.entities.Booking.filter({ session_date: dateFilter }, "-created_date", 100),
    enabled: !!dateFilter,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return bookings;
    const q = search.toLowerCase();
    return bookings.filter(
      (b) =>
        (b.student_name || "").toLowerCase().includes(q) ||
        (b.student_email || "").toLowerCase().includes(q) ||
        (b.class_type_name || "").toLowerCase().includes(q)
    );
  }, [bookings, search]);

  const handleStatusChange = async (bookingId, newStatus) => {
    await base44.entities.Booking.update(bookingId, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
    toast.success("Status atualizado");
  };

  const formattedDate = dateFilter
    ? format(new Date(dateFilter + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: ptBR })
    : "";

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="font-heading text-xl font-semibold">Reservas</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-auto"
          />
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluna..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {formattedDate && (
        <p className="text-sm text-muted-foreground mb-4 capitalize">{formattedDate}</p>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Nenhuma reserva encontrada</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Aluna</TableHead>
                <TableHead>Aula</TableHead>
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
                        <p className="font-medium">{booking.student_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{booking.student_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{booking.class_type_name}</TableCell>
                    <TableCell>{booking.session_time || "—"}</TableCell>
                    <TableCell>
                      <Select
                        value={booking.status}
                        onValueChange={(v) => handleStatusChange(booking.id, v)}
                      >
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