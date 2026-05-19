import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Loader2, X, Film } from "lucide-react";
import { toast } from "sonner";

export default function NewPostForm({ currentUser }) {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState("image");
  const [uploading, setUploading] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setMediaType(f.type.startsWith("video") ? "video" : "image");
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !caption.trim()) return toast.error("Escreva algo ou selecione uma mídia");
    setUploading(true);
    let file_url = null;
    if (file) {
      const result = await base44.integrations.Core.UploadFile({ file });
      file_url = result.file_url;
    }
    const postData = {
      author_name: currentUser?.full_name || currentUser?.email,
      author_email: currentUser?.email,
      caption: caption.trim(),
      likes: [],
    };
    if (file_url) {
      postData.media_url = file_url;
      postData.media_type = mediaType;
    }
    await base44.entities.Post.create(postData);
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    setCaption("");
    setFile(null);
    setPreview(null);
    setUploading(false);
    toast.success("Post publicado!");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
          {(currentUser?.full_name || currentUser?.email || "?")[0].toUpperCase()}
        </div>
        <Textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Compartilhe um momento..."
          className="flex-1 min-h-[60px] resize-none text-sm"
        />
      </div>

      {preview && (
        <div className="relative mb-3">
          {mediaType === "video" ? (
            <video src={preview} className="w-full max-h-64 object-cover rounded-xl" />
          ) : (
            <img src={preview} className="w-full max-h-64 object-cover rounded-xl" />
          )}
          <button
            type="button"
            onClick={() => { setPreview(null); setFile(null); }}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={() => fileRef.current?.click()} className="gap-2 text-muted-foreground">
          <ImagePlus className="h-4 w-4" /> Foto / Vídeo
        </Button>
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
        <Button type="submit" size="sm" disabled={(!file && !caption.trim()) || uploading} className="rounded-full px-6">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicar"}
        </Button>
      </div>
    </form>
  );
}