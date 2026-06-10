import React from "react";
import ChangePassword from "@/components/settings/ChangePassword";
import StudioRules from "@/components/settings/StudioRules";
import { useTheme } from "@/lib/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function Settings() {
  const { theme, toggle } = useTheme();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 font-body space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Configurações</h1>
      </div>

      {/* Tema */}
      <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {theme === "dark" ? (
            <Moon className="h-5 w-5 text-primary" />
          ) : (
            <Sun className="h-5 w-5 text-primary" />
          )}
          <div>
            <p className="text-sm font-medium">Tema</p>
            <p className="text-xs text-muted-foreground">
              {theme === "dark" ? "Modo escuro ativado" : "Modo claro ativado"}
            </p>
          </div>
        </div>
        <button
          onClick={toggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            theme === "dark" ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              theme === "dark" ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Trocar senha */}
      <ChangePassword />

      {/* Regras do estúdio */}
      <StudioRules />
    </div>
  );
}