import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, Trash2 } from "lucide-react";

export default function CommentItem({ comment, currentUser, isAdmin, queryKey }) {
  const queryClient = useQueryClient();
  const [liking, setLiking] = useState(false);

  const likes = comment.likes || [];
  const liked = likes.includes(currentUser?.email);
  const canDelete = comment.author_email === currentUser?.email || isAdmin;

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    const newLikes = liked
      ? likes.filter((e) => e !== currentUser?.email)
      : [...likes, currentUser?.email];
    await base44.entities.Comment.update(comment.id, { likes: newLikes });
    queryClient.invalidateQueries({ queryKey });
    setLiking(false);
  };

  const handleDelete = async () => {
    await base44.entities.Comment.delete(comment.id);
    queryClient.invalidateQueries({ queryKey });
  };

  const initials = (comment.author_name || comment.author_email || "?")[0].toUpperCase();

  return (
    <div className="flex items-start gap-2 group">
      {/* Avatar */}
      <div className="shrink-0 w-7 h-7 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
        {comment.author_avatar ? (
          <img src={comment.author_avatar} alt={comment.author_name} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className="text-sm leading-snug">
            <span className="font-semibold mr-1">{comment.author_name?.split(" ")[0] || comment.author_email}</span>
            <span className="text-foreground/80">{comment.text}</span>
          </p>
          {canDelete && (
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-destructive transition-all"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Curtir comentário */}
        <button
          onClick={handleLike}
          disabled={liking}
          className={`mt-0.5 flex items-center gap-1 text-xs transition-colors ${
            liked ? "text-red-500" : "text-muted-foreground hover:text-red-400"
          }`}
        >
          <Heart className={`h-3 w-3 ${liked ? "fill-current" : ""}`} />
          {likes.length > 0 && <span>{likes.length}</span>}
        </button>
      </div>
    </div>
  );
}