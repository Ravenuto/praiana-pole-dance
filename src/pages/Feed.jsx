import React from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import NewPostForm from "@/components/feed/NewPostForm";
import PostCard from "@/components/feed/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Images } from "lucide-react";
import { toast } from "sonner";

export default function Feed() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  return (
    <div className="max-w-xl mx-auto px-4 py-8 font-body">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold">Feed</h1>
        <p className="mt-1 text-muted-foreground text-sm">Compartilhe seus momentos no pole</p>
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