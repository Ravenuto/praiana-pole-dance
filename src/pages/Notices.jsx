import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, Megaphone, BarChart2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import NoticeCard from "@/components/notices/NoticeCard";
import PollCard from "@/components/notices/PollCard";
import NewPollForm from "@/components/notices/NewPollForm";

const emptyForm = { title: "", content: "", pinned: false, color: "blue", media_url: "", media_type: "image" };

export default function Notices() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin";
  const [openNotice, setOpenNotice] = useState(false);
  const [openPoll, setOpenPoll] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const { data: notices = [], isLoading: loadingNotices } = useQuery({
    queryKey: ["notices"],
    queryFn: () => base44.entities.Notice.list("-created_date", 50),
  });

  const { data: polls = [], isLoading: loadingPolls } = useQuery({
    queryKey: ["polls"],
    queryFn: () => base44.entities.Poll.filter({ is_active: true }, "-created_date"),
  });

  // Ordena: fixados primeiro, depois por data
  const sortedNotices = [...notices].sort((a, b) => {
    if (b.pinned !== a.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
    return new Date(b.created_date) - new Date(a.created_date);
  });

  // Mistura recados e enquetes em ordem cronológica (pinned primeiro)
  const feedItems = [
    ...sortedNotices.map((n) => ({ type: "notice", data: n, date: new Date(n.created_date || 0), pinned: !!n.pinned })),
    ...polls.map((p) => ({ type: "poll", data: p, date: new Date(p.created_date || 0), pinned: false })),
  ].sort((a, b) => {
    if (b.pinned !== a.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
    return b.date - a.date;
  });

  const handleUploadMedia = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const isVideo = file.type.startsWith("video/");
    setForm((f) => ({ ...f, media_url: file_url, media_type: isVideo ? "video" : "image" }));
    setUploadingMedia(false);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return toast.error("Preencha título e conteúdo");
    setSaving(true);
    const payload = { ...form };
    if (!payload.media_url) { delete payload.media_url; delete payload.media_type; }
    await base44.entities.Notice.create(payload);
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

  const isEmpty = !loadingNotices && !loadingPolls && sortedNotices.length === 0 && polls.length === 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 font-body">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Recados</h1>
          <p className="mt-1 text-muted-foreground text-sm">Avisos e informações do estúdio</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Dialog open={openPoll} onOpenChange={setOpenPoll}>
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
                  {/* Upload de mídia */}
                  <div>
                    <Label>Imagem ou Vídeo (opcional)</Label>
                    <label className="mt-1 flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                      <ImagePlus className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {uploadingMedia ? "Enviando..." : form.media_url ? "Trocar arquivo" : "Clique para adicionar"}
                      </span>
                      <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUploadMedia} disabled={uploadingMedia} />
                    </label>
                    {form.media_url && !uploadingMedia && (
                      <div className="mt-2 relative rounded-lg overflow-hidden">
                        {form.media_type === "video"
                          ? <video src={form.media_url} className="w-full max-h-40 object-cover rounded-lg" />
                          : <img src={form.media_url} alt="preview" className="w-full max-h-40 object-cover rounded-lg" />
                        }
                        <button
                          onClick={() => setForm((f) => ({ ...f, media_url: "", media_type: "image" }))}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                        >✕</button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center">
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
                  <Button onClick={handleSave} disabled={saving || uploadingMedia} className="w-full rounded-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicar Recado"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Feed unificado — enquetes e recados misturados por data */}
      {isEmpty ? (
        <div className="text-center py-16 text-muted-foreground">
          <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhum recado ainda</p>
          {isAdmin && <p className="text-sm mt-1">Publique o primeiro recado para as alunas</p>}
        </div>
      ) : (loadingNotices || loadingPolls) ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-4">
            {feedItems.map((item) =>
              item.type === "poll" ? (
                <PollCard key={"poll-" + item.data.id} poll={item.data} currentUser={user} />
              ) : (
                <NoticeCard
                  key={"notice-" + item.data.id}
                  notice={item.data}
                  currentUser={user}
                  isAdmin={isAdmin}
                  onTogglePin={togglePin}
                  onDelete={handleDelete}
                />
              )
            )}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}