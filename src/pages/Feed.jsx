import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import NewPostForm from "@/components/feed/NewPostForm";
import PostCard from "@/components/feed/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Images, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

export default function Feed() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () => base44.entities.Post.list("-created_date", 50),
  });

  const handleDelete = async (postId) => {
    if (!confirm("Excluir este post?")) return;
    await base44.entities.Post.delete(postId);
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    toast.success("Post excluído");
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["posts"] });
    setIsRefreshing(false);
  };

  const { containerRef, isPulling } = usePullToRefresh(handleRefresh);

  return (
    <div
      ref={containerRef}
      className="max-w-xl mx-auto px-4 py-8 font-body overflow-y-auto transition-transform"
      style={{
        transform: isPulling ? "translateY(20px)" : "translateY(0)",
      }}
    >
      {isPulling && (
        <div className="flex justify-center mb-4">
          <RefreshCw className={`h-5 w-5 text-primary transition-transform ${isRefreshing ? "animate-spin" : ""}`} />
        </div>
      )}

      <div className="mb-6">
         <h1 className="font-heading text-xl font-semibold">Feed</h1>
         <p className="mt-1 text-muted-foreground text-xs">Compartilhe seus momentos no pole</p>
       </div>

      <NewPostForm currentUser={user} />

      <div className="mt-6 space-y-5">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Images className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhum post ainda</p>
            <p className="text-sm mt-1">Seja a primeira a compartilhar!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={user}
              onDelete={() => handleDelete(post.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}