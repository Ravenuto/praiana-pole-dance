import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChevronDown } from "lucide-react";

export default function MobileSelect({ value, onValueChange, options, placeholder, label }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;

  if (isDesktop) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <button
        onClick={() => setSheetOpen(true)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-left"
      >
        <span className="text-sm">
          {value ? options.find(o => o.value === value)?.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>{label || placeholder}</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 pb-6">
            {options.map((opt) => (
              <Button
                key={opt.value}
                variant={value === opt.value ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  onValueChange(opt.value);
                  setSheetOpen(false);
                }}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}