import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Pin, Plus, Trash2, Loader2, Megaphone, PinOff, BarChart2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import PollCard from "@/components/notices/PollCard";
import NewPollForm from "@/components/notices/NewPollForm";

const colorMap = {
  blue: { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary", badge: "bg-primary/15 text-primary" },
  yellow: { bg: "bg-accent/10", border: "border-accent/30", text: "text-accent-foreground", badge: "bg-accent/15 text-accent-foreground" },
  green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", badge: "bg-green-100 text-green-700" },
  red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", badge: "bg-red-100 text-red-700" },
};

const emptyForm = { title: "", content: "", pinned: false, color: "blue" };

export default function Notices() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin";
  const [openNotice, setOpenNotice] = useState(false);
  const [openPoll, setOpenPoll] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: notices = [], isLoading: loadingNotices } = useQuery({
    queryKey: ["notices"],
    queryFn: () => base44.entities.Notice.list("-created_date", 50),
  });

  const { data: polls = [], isLoading: loadingPolls } = useQuery({
    queryKey: ["polls"],
    queryFn: () => base44.entities.Poll.filter({ is_active: true }, "-created_date"),
  });

  const sorted = [...notices].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return toast.error("Preencha título e conteúdo");
    setSaving(true);
    await base44.entities.Notice.create(form);
    queryClient.invalidateQueries({ queryKey: ["notices"] });
    setOpenNotice(false);
    setForm(emptyForm);
    setSaving(false);
    toast.success("Recado publicado!");
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este recado?")) return;
    await base44.entities.Notice.delete(id);
    queryClient.invalidateQueries({ queryKey: ["notices"] });
    toast.success("Recado excluído");
  };

  const togglePin = async (notice) => {
    await base44.entities.Notice.update(notice.id, { pinned: !notice.pinned });
    queryClient.invalidateQueries({ queryKey: ["notices"] });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 font-body">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Recados</h1>
          <p className="mt-1 text-muted-foreground text-sm">Avisos e informações do estúdio</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {/* Nova Enquete */}
            <Dialog open={openPoll} onOpenChange={(v) => { setOpenPoll(v); }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-full gap-2">
                  <BarChart2 className="h-4 w-4" /> Enquete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading">Nova Enquete</DialogTitle>
                </DialogHeader>
                <NewPollForm onClose={() => setOpenPoll(false)} />
              </DialogContent>
            </Dialog>

            {/* Novo Recado */}
            <Dialog open={openNotice} onOpenChange={(v) => { setOpenNotice(v); if (!v) setForm(emptyForm); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-full gap-2">
                  <Plus className="h-4 w-4" /> Recado
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading">Novo Recado</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label>Título *</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título do recado" />
                  </div>
                  <div>
                    <Label>Mensagem *</Label>
                    <Textarea
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      placeholder="Escreva seu recado..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cor</Label>
                      <Select value={form.color} onValueChange={(v) => setForm({ ...form, color: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blue">Azul</SelectItem>
                          <SelectItem value="yellow">Amarelo</SelectItem>
                          <SelectItem value="green">Verde</SelectItem>
                          <SelectItem value="red">Vermelho</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.pinned}
                          onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-sm">Fixar no topo</span>
                      </label>
                    </div>
                  </div>
                  <Button onClick={handleSave} disabled={saving} className="w-full rounded-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicar Recado"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Enquetes */}
      {(polls.length > 0 || loadingPolls) && (
        <div className="mb-8">
          <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" /> Enquetes
          </h2>
          <div className="space-y-4">
            {loadingPolls
              ? Array(2).fill(0).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)
              : polls.map((poll) => (
                  <PollCard key={poll.id} poll={poll} currentUser={user} />
                ))}
          </div>
        </div>
      )}

      {/* Recados */}
      <div className="space-y-4">
        {loadingNotices ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))
        ) : sorted.length === 0 && polls.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhum recado ainda</p>
            {isAdmin && <p className="text-sm mt-1">Publique o primeiro recado para as alunas</p>}
          </div>
        ) : (
          <AnimatePresence>
            {sorted.map((notice) => {
              const c = colorMap[notice.color] || colorMap.blue;
              const timeAgo = notice.created_date
                ? formatDistanceToNow(new Date(notice.created_date), { addSuffix: true, locale: ptBR })
                : "";
              return (
                <motion.div
                  key={notice.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`rounded-2xl border-2 p-5 ${c.bg} ${c.border}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-heading text-lg font-bold ${c.text}`}>{notice.title}</h3>
                        {notice.pinned && (
                          <Badge className={`${c.badge} border-0 gap-1 text-xs`}>
                            <Pin className="h-3 w-3" /> Fixado
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{notice.content}</p>
                      <p className="mt-3 text-xs text-muted-foreground">{timeAgo}</p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => togglePin(notice)} className="h-8 w-8">
                          {notice.pinned ? <PinOff className="h-4 w-4 text-muted-foreground" /> : <Pin className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(notice.id)} className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}