import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Heart } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/components/ui/use-toast";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }
    if (!fullName.trim()) {
      setError("Nome completo é obrigatório");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      // Salva dados extras no perfil
      await base44.auth.updateMe({
        full_name: fullName,
        phone: phone,
        birth_date: birthDate
      });
      // Notifica admins sobre novo cadastro
      const admins = await base44.entities.User.filter({ role: "admin" });
      await Promise.all(
        admins.map((admin) =>
        base44.entities.Notification.create({
          user_email: admin.email,
          type: "new_post",
          title: "Nova aluna cadastrada! 🎉",
          message: `${fullName || email} acabou de se cadastrar no app. Não esqueça de ativar o plano dela!`,
          link: "/admin",
          read: false,
          actor_name: fullName || email
        })
        )
      );
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Código reenviado", description: "Verifique seu email." });
    } catch (err) {
      setError(err.message || "Erro ao reenviar código");
    }
  };

  if (showOtp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Verifique seu email</h1>
            <p className="text-muted-foreground mt-2">Enviamos um código para <strong>{email}</strong></p>
          </div>

          <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
            {error &&
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
            }
            <div className="flex justify-center mb-6">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button className="w-full h-12 font-medium rounded-full" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verificando...</> : "Verificar e entrar"}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Não recebeu o código?{" "}
              <button onClick={handleResend} className="text-primary font-medium hover:underline">Reenviar</button>
            </p>
          </div>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header do estúdio */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Praiana Pole Dance</h1>
          <p className="text-muted-foreground mt-1 text-sm">Crie sua conta e faça parte da nossa família 💙</p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {error &&
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
          }

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo *</Label>
              <Input
                id="fullName"
                type="text"
                autoFocus
                placeholder="Seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12"
                required />
              
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required />
              
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(99) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12"
                required />
              
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de nascimento *</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="h-12"
                required />
              
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
                required />
              
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar senha *</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12"
                required />
              
            </div>
            <Button type="submit" className="w-full h-12 font-medium rounded-full" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando conta...</> : "Criar conta"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>);

}