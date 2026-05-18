import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, User, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SessionCard({ session, bookingCount, isBooked, onBook, onCancel, isLoading }) {
  const spotsLeft = (session.max_students || 8) - bookingCount;
  const isFull = spotsLeft <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold">{session.class_type_name}</h3>
              <p className="text-sm text-muted-foreground font-body">{session.time}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {session.instructor && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> {session.instructor}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {bookingCount}/{session.max_students || 8} vagas
            </span>
            {session.notes && (
              <Badge variant="secondary" className="text-xs">{session.notes}</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isBooked ? (
            <>
              <Badge className="bg-primary/10 text-primary border-0 gap-1">
                <Check className="h-3 w-3" /> Reservada
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={isLoading}
                className="rounded-full text-sm"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancelar"}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={onBook}
              disabled={isFull || isLoading}
              className="rounded-full px-6 text-sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isFull ? (
                "Lotada"
              ) : (
                "Reservar"
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}