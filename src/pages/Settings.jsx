import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, BellOff, Loader2, Check, Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ChangePassword from "@/components/settings/ChangePassword";

const NOTIFICATION_OPTIONS = [
  { key: "booking_made", label: "Reserva confirmada", description: "Quando você faz uma reserva de aula" },
  { key: "booking_cancelled", label: "Reserva cancelada", description: "Quando uma reserva é cancelada" },
  { key: "new_notice", label: "Novos recados", description: "Quando um novo recado é publicado" },
  { key: "new_post", label: "Novos posts no feed", description: "Quando alguém publica no feed" },
  { key: "credits_added", label: "Créditos adicionados", description: "Quando créditos são adicionados à sua conta" },
  { key: "schedule_change", label: "Mudanças de horário", description: "Quando um horário de aula é alterado" },
  { key: "like", label: "Curtidas", description: "Quando alguém curte seu post ou comentário" },
  { key: "comment", label: "Comentários", description: "Quando alguém comenta no seu post" },
];

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("notifications");

  const { data: userData, isLoading } = useQuery({
    queryKey: ["myProfile", user?.email],
    queryFn: async () => {
      const [u] = await base44.entities.User.filter({ email: user?.email }, "-created_date", 1);
      return u || null;
    },
    enabled: !!user?.email,
  });

  const notifPrefs = userData?.data?.notification_prefs || {};
  const isEnabled = (key) => notifPrefs[key] !== false;

  const handleToggle = async (key) => {
    if (!userData) return;
    setSaving(true);
    const newPrefs = { ...notifPrefs, [key]: !isEnabled(key) };
    const cleanData = Object.fromEntries(
      Object.entries(userData.data || {}).filter(([k]) => k !== "data")
    );
    await base44.entities.User.update(userData.id, {
      data: { ...cleanData, notification_prefs: newPrefs },
    });
    queryClient.invalidateQueries({ queryKey: ["myProfile", user?.email] });
    setSaving(false);
    toast.success("Preferência salva!");
  };

  const handleEnableAll = async () => {
    if (!userData) return;
    setSaving(true);
    const newPrefs = Object.fromEntries(NOTIFICATION_OPTIONS.map((o) => [o.key, true]));
    const cleanData = Object.fromEntries(
      Object.entries(userData.data || {}).filter(([k]) => k !== "data")
    );
    await base44.entities.User.update(userData.id, {
      data: { ...cleanData, notification_prefs: newPrefs },
    });
    queryClient.invalidateQueries({ queryKey: ["myProfile", user?.email] });
    setSaving(false);
    toast.success("Todas as notificações ativadas!");
  };

  const handleDisableAll = async () => {
    if (!userData) return;
    setSaving(true);
    const newPrefs = Object.fromEntries(NOTIFICATION_OPTIONS.map((o) => [o.key, false]));
    const cleanData = Object.fromEntries(
      Object.entries(userData.data || {}).filter(([k]) => k !== "data")
    );
    await base44.entities.User.update(userData.id, {
      data: { ...cleanData, notification_prefs: newPrefs },
    });
    queryClient.invalidateQueries({ queryKey: ["myProfile", user?.email] });
    setSaving(false);
    toast.success("Todas as notificações desativadas!");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 font-body">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Configurações</h1>
        <p className="mt-1 text-muted-foreground text-sm">Personalize sua experiência no app</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "notifications"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bell className="h-4 w-4" />
          Notificações
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "password"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Lock className="h-4 w-4" />
          Alterar Senha
        </button>
      </div>

      {/* Notificações Tab */}
      {activeTab === "notifications" && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="font-heading font-semibold text-base">Notificações</h2>
            </div>
            <div className="flex gap-2 w-full sm:w-auto flex-col sm:flex-row">
              <Button variant="outline" size="sm" onClick={handleDisableAll} disabled={saving} className="text-xs gap-1 w-full sm:w-auto">
                <BellOff className="h-3.5 w-3.5" /> Desativar todas
              </Button>
              <Button variant="default" size="sm" onClick={handleEnableAll} disabled={saving} className="text-xs gap-1 w-full sm:w-auto">
                <Check className="h-3.5 w-3.5" /> Ativar todas
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {NOTIFICATION_OPTIONS.map((opt) => (
                <div key={opt.key} className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <Label className="text-sm font-medium cursor-pointer" htmlFor={opt.key}>
                      {opt.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                  </div>
                  <Switch
                    id={opt.key}
                    checked={isEnabled(opt.key)}
                    onCheckedChange={() => handleToggle(opt.key)}
                    disabled={saving}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Alterar Senha Tab */}
      {activeTab === "password" && (
        <ChangePassword />
      )}
    </div>
  );
}