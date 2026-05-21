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
    <div className="grid grid-cols-7 gap-1 sm:flex sm:gap-2 sm:overflow-x-auto sm:pb-2">
      {DAYS.map((day) => (
        <button
          key={day.key}
          onClick={() => onChange(day.key)}
          className={`flex flex-col items-center justify-center rounded-xl py-2 px-1 text-center transition-colors font-body ${
            selected === day.key
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
          }`}
        >
          <span className="text-xs font-semibold">{day.label}</span>
        </button>
      ))}
    </div>
  );
}

export { DAYS };