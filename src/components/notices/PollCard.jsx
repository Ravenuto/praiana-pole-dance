import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Trash2, BarChart2, CheckSquare, Square } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function PollCard({ poll, currentUser }) {
  const queryClient = useQueryClient();
  const isAdmin = currentUser?.role === "admin";
  const [voting, setVoting] = useState(false);

  const userEmail = currentUser?.email;
  const isMultiple = poll.multiple_choice === true;

  // Para múltipla escolha, hasVoted = votou em PELO MENOS uma opção
  const hasVoted = poll.options?.some((o) => o.votes?.includes(userEmail));
  const totalVotes = poll.options?.reduce((sum, o) => sum + (o.votes?.length || 0), 0) || 0;

  // Voto único
  const handleVoteSingle = async (optionIndex) => {
    if (hasVoted || voting) return;
    setVoting(true);
    const newOptions = poll.options.map((o, i) => {
      if (i === optionIndex) return { ...o, votes: [...(o.votes || []), userEmail] };
      return o;
    });
    await base44.entities.Poll.update(poll.id, { options: newOptions });
    queryClient.invalidateQueries({ queryKey: ["polls"] });
    setVoting(false);
    toast.success("Voto registrado!");
  };

  // Múltipla escolha — toggle opção
  const handleVoteMultiple = async (optionIndex) => {
    if (voting) return;
    setVoting(true);
    const option = poll.options[optionIndex];
    const alreadyVoted = option.votes?.includes(userEmail);
    const newOptions = poll.options.map((o, i) => {
      if (i !== optionIndex) return o;
      if (alreadyVoted) {
        return { ...o, votes: (o.votes || []).filter((e) => e !== userEmail) };
      } else {
        return { ...o, votes: [...(o.votes || []), userEmail] };
      }
    });
    await base44.entities.Poll.update(poll.id, { options: newOptions });
    queryClient.invalidateQueries({ queryKey: ["polls"] });
    setVoting(false);
  };

  const handleDelete = async () => {
    if (!confirm("Excluir esta enquete?")) return;
    await base44.entities.Poll.delete(poll.id);
    queryClient.invalidateQueries({ queryKey: ["polls"] });
    toast.success("Enquete excluída");
  };

  const timeAgo = poll.created_date
    ? formatDistanceToNow(new Date(poll.created_date), { addSuffix: true, locale: ptBR })
    : "";

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-primary shrink-0" />
          <h3 className="font-heading text-base font-semibold">{poll.question}</h3>
        </div>
        {isAdmin && (
          <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isMultiple && !hasVoted && (
        <p className="text-xs text-muted-foreground mb-3 ml-7">Pode escolher mais de uma opção</p>
      )}
      {!isMultiple && !hasVoted && (
        <p className="text-xs text-muted-foreground mb-3 ml-7">Escolha uma opção</p>
      )}
      {hasVoted && <p className="text-xs text-muted-foreground mb-3 ml-7">{totalVotes} voto{totalVotes !== 1 ? "s" : ""} · {timeAgo}</p>}

      <div className="space-y-2">
        {poll.options?.map((option, i) => {
          const count = option.votes?.length || 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const voted = option.votes?.includes(userEmail);

          if (isMultiple) {
            // Múltipla escolha: sempre clicável (toggle)
            return (
              <button
                key={i}
                onClick={() => handleVoteMultiple(i)}
                disabled={voting}
                className={`w-full text-left rounded-xl overflow-hidden border transition-all ${
                  voted ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="relative px-4 py-2.5">
                  {hasVoted && (
                    <div className="absolute inset-0 bg-primary/8 transition-all" style={{ width: `${pct}%` }} />
                  )}
                  <div className="relative flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {voted
                        ? <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                        : <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                      }
                      <span className={`text-sm font-medium ${voted ? "text-primary" : "text-foreground"}`}>
                        {option.text}
                      </span>
                    </div>
                    {hasVoted && <span className="text-xs text-muted-foreground shrink-0">{pct}%</span>}
                  </div>
                </div>
              </button>
            );
          }

          // Escolha única
          return (
            <button
              key={i}
              onClick={() => handleVoteSingle(i)}
              disabled={hasVoted || voting}
              className={`w-full text-left rounded-xl overflow-hidden border transition-all ${
                voted ? "border-primary" : "border-border hover:border-primary/40"
              } ${hasVoted ? "cursor-default" : "cursor-pointer"}`}
            >
              <div className="relative px-4 py-2.5">
                {hasVoted && (
                  <div className="absolute inset-0 bg-primary/10 transition-all" style={{ width: `${pct}%` }} />
                )}
                <div className="relative flex items-center justify-between">
                  <span className={`text-sm font-medium ${voted ? "text-primary" : "text-foreground"}`}>
                    {option.text}
                  </span>
                  {hasVoted && <span className="text-xs text-muted-foreground">{pct}%</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {!hasVoted && (
        <p className="mt-3 text-xs text-muted-foreground">{totalVotes} voto{totalVotes !== 1 ? "s" : ""} · {timeAgo}</p>
      )}
    </div>
  );
}