import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Check, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function isWithin4Hours(sessionDate, sessionTime) {
  if (!sessionDate || !sessionTime) return false;
  const [h, m] = sessionTime.split(":").map(Number);
  const classDateTime = new Date(`${sessionDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  const diffMs = classDateTime - new Date();
  return diffMs <= 4 * 60 * 60 * 1000 && diffMs > 0;
}

function isPast(sessionDate, sessionTime) {
  if (!sessionDate || !sessionTime) return false;
  const [h, m] = sessionTime.split(":").map(Number);
  const classDateTime = new Date(`${sessionDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  return classDateTime <= new Date();
}

export default function SessionCard({
  session, sessionDate, bookingCount, sessionBookings = [], sessionWaitlist = [],
  isBooked, waitlistPosition, onBook, onCancel, onJoinWaitlist, onLeaveWaitlist, isLoading,
  hasCredits = true,
}) {
  const [expanded, setExpanded] = useState(false);
  const spotsLeft = (session.max_students || 8) - bookingCount;
  const isFull = spotsLeft <= 0;
  const locked = isWithin4Hours(sessionDate, session.time);
  const past = isPast(sessionDate, session.time);
  const inWaitlist = waitlistPosition != null;
  const hasParticipants = sessionBookings.length > 0 || sessionWaitlist.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border border-border bg-card hover:shadow-md transition-shadow overflow-hidden ${past ? "opacity-60" : ""}`}
    >
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold truncate">{session.class_type_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {session.time}{session.instructor && <span className="ml-2 text-muted-foreground/70">· {session.instructor}</span>}
                </p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className={`flex items-center gap-1 ${isFull ? "text-destructive font-medium" : ""}`}>
                <Users className="h-3 w-3" /> {bookingCount}/{session.max_students || 8}
                {isFull ? " — Lotada" : ` — ${spotsLeft} vaga${spotsLeft !== 1 ? "s" : ""}`}
              </span>
              {session.notes && <Badge variant="secondary" className="text-xs">{session.notes}</Badge>}
              {locked && !past && (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="h-3 w-3" /> Reservas encerradas
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {past ? (
              <span className="text-xs text-muted-foreground">Encerrada</span>
            ) : isBooked ? (
              <>
                <Badge className="bg-primary/10 text-primary border-0 gap-1 text-xs">
                  <Check className="h-3 w-3" /> Reservada
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={isLoading || locked}
                  className="rounded-full text-xs h-8"
                  title={locked ? "Cancelamento não permitido com menos de 4h" : ""}
                >
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Cancelar"}
                </Button>
              </>
            ) : isFull ? (
              inWaitlist ? (
                <div className="text-center">
                  <Badge className="bg-amber-100 text-amber-700 border-0 text-xs mb-1">
                    Fila #{waitlistPosition}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLeaveWaitlist}
                    disabled={isLoading}
                    className="text-xs h-7 text-muted-foreground"
                  >
                    {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Sair da fila"}
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onJoinWaitlist}
                  disabled={isLoading || locked}
                  className="rounded-full text-xs h-8"
                >
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Fila de espera"}
                </Button>
              )
            ) : !hasCredits ? (
              <span className="text-xs text-red-500 font-medium text-center">Sem créditos</span>
            ) : (
              <Button
                size="sm"
                onClick={onBook}
                disabled={isLoading || locked}
                className="rounded-full px-5 text-sm h-8"
                title={locked ? "Reservas encerradas (menos de 4h)" : ""}
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Reservar"}
              </Button>
            )}

            {hasParticipants && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                title="Ver participantes"
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-3">
              {sessionBookings.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Na aula ({sessionBookings.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {sessionBookings.map((b) => (
                      <span key={b.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        <Check className="h-3 w-3" />
                        {b.student_name || b.student_email}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {sessionWaitlist.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Fila de espera ({sessionWaitlist.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...sessionWaitlist].sort((a, b) => a.position - b.position).map((w) => (
                      <span key={w.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                        #{w.position} {w.student_name || w.student_email}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}