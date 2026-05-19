import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function PostCard({ post, currentUser, onDelete }) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const likes = post.likes || [];
  const isLiked = likes.includes(currentUser?.email);
  const isOwner = post.author_email === currentUser?.email;
  const isAdmin = currentUser?.role === "admin";

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", post.id],
    queryFn: () => base44.entities.Comment.filter({ post_id: post.id }, "created_date"),
    enabled: showComments,
  });

  const handleLike = async () => {
    const newLikes = isLiked
      ? likes.filter((e) => e !== currentUser?.email)
      : [...likes, currentUser?.email];
    await base44.entities.Post.update(post.id, { likes: newLikes });
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    await base44.entities.Comment.create({
      post_id: post.id,
      author_name: currentUser?.full_name || currentUser?.email,
      author_email: currentUser?.email,
      text: commentText.trim(),
    });
    setCommentText("");
    queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId) => {
    await base44.entities.Comment.delete(commentId);
    queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
  };

  const timeAgo = post.created_date
    ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true, locale: ptBR })
    : "";

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
            {(post.author_name || post.author_email || "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold">{post.author_name || post.author_email}</p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        {(isOwner || isAdmin) && (
          <Button variant="ghost" size="icon" onClick={onDelete} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Media */}
      {post.media_url && (
        post.media_type === "video" ? (
          <video src={post.media_url} controls className="w-full max-h-[500px] object-cover bg-black" />
        ) : (
          <img src={post.media_url} alt="post" className="w-full max-h-[500px] object-cover" />
        )
      )}

      {/* Actions */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
              isLiked ? "text-red-500" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500" : ""}`} />
            {likes.length > 0 && <span>{likes.length}</span>}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            {comments.length > 0 && !showComments && <span>{comments.length}</span>}
          </button>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="mt-2 text-sm">
            <span className="font-semibold mr-1">{post.author_name || post.author_email}</span>
            {post.caption}
          </p>
        )}
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-3">
          <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
            {comments.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-2 group">
                <p className="text-sm">
                  <span className="font-semibold mr-1">{c.author_name || c.author_email}</span>
                  {c.text}
                </p>
                {(c.author_email === currentUser?.email || isAdmin) && (
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <form onSubmit={handleComment} className="flex gap-2 mt-3">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Adicionar comentário..."
              className="flex-1 h-8 text-sm"
            />
            <Button type="submit" size="icon" variant="ghost" disabled={submitting} className="h-8 w-8">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}