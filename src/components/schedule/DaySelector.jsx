import React from "react";
import { Button } from "@/components/ui/button";

const DAYS = [
  { key: "segunda", label: "Seg", full: "Segunda" },
  { key: "terca", label: "Ter", full: "Terça" },
  { key: "quarta", label: "Qua", full: "Quarta" },
  { key: "quinta", label: "Qui", full: "Quinta" },
  { key: "sexta", label: "Sex", full: "Sexta" },
  { key: "sabado", label: "Sáb", full: "Sábado" },
  { key: "domingo", label: "Dom", full: "Domingo" },
];

export default function DaySelector({ selected, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {DAYS.map((day) => (
        <Button
          key={day.key}
          variant={selected === day.key ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(day.key)}
          className={`rounded-full px-4 font-body text-sm whitespace-nowrap ${
            selected === day.key ? "" : "hover:bg-primary/5 hover:text-primary hover:border-primary/30"
          }`}
        >
          <span className="sm:hidden">{day.label}</span>
          <span className="hidden sm:inline">{day.full}</span>
        </Button>
      ))}
    </div>
  );
}

export { DAYS };