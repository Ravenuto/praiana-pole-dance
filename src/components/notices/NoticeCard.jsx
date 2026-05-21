import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pin, PinOff, Trash2, Heart, MessageCircle, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const noticeStyle = { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary", badge: "bg-primary/15 text-primary" };

export default function NoticeCard({ notice, currentUser, isAdmin, onTogglePin, onDelete }) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const c = noticeStyle;
  const timeAgo = notice.created_date
    ? formatDistanceToNow(new Date(notice.created_date), { addSuffix: true, locale: ptBR })
    : "";

  const likes = notice.likes || [];
  const liked = likes.includes(currentUser?.email);

  // Busca comentários deste recado
  const { data: comments = [] } = useQuery({
    queryKey: ["comments", notice.id],
    queryFn: () => base44.entities.Comment.filter({ post_id: notice.id }, "created_date", 100),
    enabled: showComments,
  });

  const handleLike = async () => {
    const newLikes = liked
      ? likes.filter((e) => e !== currentUser?.email)
      : [...likes, currentUser?.email];
    await base44.entities.Notice.update(notice.id, { likes: newLikes });
    queryClient.invalidateQueries({ queryKey: ["notices"] });
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSendingComment(true);
    await base44.entities.Comment.create({
      post_id: notice.id,
      author_name: currentUser?.full_name || currentUser?.email,
      author_email: currentUser?.email,
      text: commentText.trim(),
    });
    setCommentText("");
    queryClient.invalidateQueries({ queryKey: ["comments", notice.id] });
    setSendingComment(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`rounded-2xl border-2 p-5 ${c.bg} ${c.border}`}
    >
      {/* Cabeçalho */}
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
          <p className="mt-2 text-xs text-muted-foreground">{timeAgo}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => onTogglePin(notice)} className="h-8 w-8">
              {notice.pinned
                ? <PinOff className="h-4 w-4 text-muted-foreground" />
                : <Pin className="h-4 w-4 text-muted-foreground" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(notice.id)} className="h-8 w-8">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-black/10">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            liked ? "text-red-500" : "text-muted-foreground hover:text-red-400"
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          <span>{likes.length > 0 ? likes.length : ""} Curtir</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{comments.length > 0 && showComments ? comments.length : ""} Comentar</span>
        </button>
      </div>

      {/* Seção de comentários */}
      {showComments && (
        <div className="mt-3">
          {comments.length > 0 && (
            <div className="space-y-2 mb-3">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2 text-sm">
                  <span className="font-semibold shrink-0">{c.author_name?.split(" ")[0] || "Aluna"}:</span>
                  <span className="text-foreground/80">{c.text}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escreva um comentário..."
              className="h-8 text-sm bg-background/60"
              onKeyDown={(e) => e.key === "Enter" && handleComment()}
            />
            <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleComment} disabled={sendingComment}>
              {sendingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}