import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Loader2, Save, CalendarDays, Phone, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import MyPaymentHistory from "@/components/profile/MyPaymentHistory";

const planInfo = {
  "4_aulas": { label: "4 aulas/mês", price: "R$ 230", color: "bg-blue-100 text-blue-700" },
  "8_aulas": { label: "8 aulas/mês", price: "R$ 370", color: "bg-purple-100 text-purple-700" },
  "12_aulas": { label: "12 aulas/mês", price: "R$ 480", color: "bg-pink-100 text-pink-700" },
  "avulsa": { label: "Aula avulsa", price: "R$ 70", color: "bg-amber-100 text-amber-700" },
};

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [form, setForm] = useState(null);

  const { data: userData, isLoading } = useQuery({
    queryKey: ["myProfile", user?.email],
    queryFn: () => base44.entities.User.filter({ email: user?.email }, "-created_date", 1),
    enabled: !!user?.email,
    select: (data) => data[0],
    onSuccess: (data) => {
      if (data && !form) {
        setForm({
          full_name: data.full_name || "",
          phone: data.phone || "",
          birth_date: data.birth_date || "",
          profile_image_url: data.profile_image_url || "",
        });
      }
    },
  });

  const today = new Date();
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(today), "yyyy-MM-dd");

  const { data: monthBookings = [] } = useQuery({
    queryKey: ["profileBookings", user?.email, monthStart],
    queryFn: () => base44.entities.Booking.filter({ student_email: user?.email }, "-session_date", 100),
    enabled: !!user?.email,
    select: (data) =>
      data.filter(
        (b) => b.status !== "cancelada" && b.session_date >= monthStart && b.session_date <= monthEnd
      ),
  });

  const planMaxCredits = { "4_aulas": 4, "8_aulas": 8, "12_aulas": 12, "avulsa": 1 };

  const currentUser = userData || user;
  const plan = currentUser?.plan || "4_aulas";
  const planData = planInfo[plan] || planInfo["4_aulas"];
  const credits = currentUser?.credits ?? 0;
  const maxCredits = planMaxCredits[plan] || 4;
  const usedThisMonth = monthBookings.length;

  React.useEffect(() => {
    if (userData && !form) {
      setForm({
        full_name: userData.full_name || user?.full_name || "",
        phone: userData.phone || "",
        birth_date: userData.birth_date || "",
        profile_image_url: userData.profile_image_url || "",
      });
    }
  }, [userData]);

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, profile_image_url: file_url }));
      toast.success("Foto carregada!");
    } catch {
      toast.error("Erro ao carregar foto");
    }
    setUploadingPhoto(false);
  };

  const handleSave = async () => {
    if (!userData?.id) return;
    setSaving(true);
    try {
      await base44.entities.User.update(userData.id, {
        phone: form.phone,
        birth_date: form.birth_date,
        profile_image_url: form.profile_image_url,
      });
      await base44.auth.updateMe({ full_name: form.full_name });
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      toast.success("Dados atualizados!");
    } catch {
      toast.error("Erro ao salvar");
    }
    setSaving(false);
  };

  if (isLoading || !form) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 font-body">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold">Meu Perfil</h1>
        <p className="mt-1 text-muted-foreground text-sm">Seus dados pessoais e informações do plano</p>
      </div>

      {/* Foto + nome */}
      <div className="flex items-center gap-4 mb-6 p-5 rounded-2xl border border-border bg-card">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center text-primary font-bold text-2xl font-heading">
            {form.profile_image_url ? (
              <img src={form.profile_image_url} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              (form.full_name || user?.email || "?")[0].toUpperCase()
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 shadow"
          >
            {uploadingPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>
        <div className="min-w-0">
          <p className="font-heading text-xl font-semibold truncate">{form.full_name || user?.email}</p>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          <Badge className={`mt-1.5 border-0 text-xs ${planData.color}`}>{planData.label}</Badge>
        </div>
      </div>

      {/* Plano e créditos */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Plano</p>
          <p className="font-heading text-lg font-bold">{planData.label}</p>
          <p className="text-xs text-primary font-medium">{planData.price}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Créditos disponíveis</p>
          <p className="font-heading text-2xl font-bold text-primary">{credits}</p>
          <p className="text-xs text-muted-foreground">de {maxCredits} aulas</p>
          <div className="mt-2 w-full bg-muted rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{ width: `${Math.max(0, Math.min(100, (credits / maxCredits) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Datas do plano */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {currentUser?.plan_start_date && (
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <CalendarDays className="h-3 w-3" /> Início do plano
            </p>
            <p className="font-medium text-sm">
              {format(new Date(currentUser.plan_start_date + "T12:00:00"), "dd/MM/yyyy")}
            </p>
          </div>
        )}
        {currentUser?.last_payment_date && (
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <RefreshCw className="h-3 w-3" /> Última renovação
            </p>
            <p className="font-medium text-sm">
              {format(new Date(currentUser.last_payment_date + "T12:00:00"), "dd/MM/yyyy")}
            </p>
          </div>
        )}
      </div>

      {/* Formulário */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-heading text-lg font-semibold">Dados Pessoais</h2>
        <div>
          <Label className="text-xs mb-1 block">Nome completo</Label>
          <Input
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="Seu nome"
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> Telefone / WhatsApp</span>
          </Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="(11) 99999-9999"
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">
            <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Data de nascimento</span>
          </Label>
          <Input
            type="date"
            value={form.birth_date}
            onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
          />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full rounded-full gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Salvar alterações</>}
        </Button>
      </div>

      {/* Histórico de pagamentos */}
      {userData?.id && <MyPaymentHistory userId={userData.id} />}
    </div>
  );
}