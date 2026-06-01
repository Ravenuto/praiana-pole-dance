import React from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Semana começa na segunda (weekStartsOn: 1)
function getWeekDays(anchor) {
  const monday = startOfWeek(anchor, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

const DAY_KEY_MAP = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

// Suporta duas APIs:
// Nova (Schedule): selectedDate (string yyyy-MM-dd), onSelectDate, weekAnchor (Date), onWeekChange
// Legada (ManageSessions): selected (day key string), onChange (day key string)
export default function DaySelector({ selectedDate, onSelectDate, weekAnchor, onWeekChange, selected, onChange }) {
  const isLegacyMode = !!onChange;

  const anchor = weekAnchor instanceof Date && !isNaN(weekAnchor) ? weekAnchor : new Date();
  const weekDays = getWeekDays(anchor);

  const prevWeek = () => onWeekChange && onWeekChange(addDays(anchor, -7));
  const nextWeek = () => onWeekChange && onWeekChange(addDays(anchor, 7));

  // Legacy mode: simple day-of-week tabs
  if (isLegacyMode) {
    return (
      <div className="flex gap-1 flex-wrap">
        {DAYS.map((d) => (
          <button
            key={d.key}
            onClick={() => onChange(d.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selected === d.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
            }`}
          >
            {d.full}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="grid grid-cols-7 gap-0.5 flex-1">
        {weekDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
          const dayLabel = format(day, "EEEEE", { locale: ptBR }); // letra única: S, T, Q...
          const dayNum = format(day, "d");

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate && onSelectDate(dateStr)}
              className={`flex flex-col items-center justify-center rounded-xl py-2 px-0.5 text-center transition-colors font-body min-w-0 ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isToday
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
              }`}
            >
              <span className="text-[10px] font-medium capitalize leading-none">{dayLabel}</span>
              <span className="text-sm font-bold leading-tight">{dayNum}</span>
            </button>
          );
        })}
      </div>

      <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}

export { DAY_KEY_MAP };

// Legacy export for compatibility
export const DAYS = [
  { key: "segunda", label: "Seg", full: "Segunda" },
  { key: "terca", label: "Ter", full: "Terça" },
  { key: "quarta", label: "Qua", full: "Quarta" },
  { key: "quinta", label: "Qui", full: "Quinta" },
  { key: "sexta", label: "Sex", full: "Sexta" },
  { key: "sabado", label: "Sáb", full: "Sábado" },
  { key: "domingo", label: "Dom", full: "Domingo" },
];