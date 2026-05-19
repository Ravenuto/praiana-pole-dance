import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NewPollForm({ onClose }) {
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [saving, setSaving] = useState(false);

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (i) => setOptions(options.filter((_, idx) => idx !== i));
  const updateOption = (i, val) => setOptions(options.map((o, idx) => (idx === i ? val : o)));

  const handleSave = async () => {
    if (!question.trim()) return toast.error("Digite a pergunta");
    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) return toast.error("Adicione pelo menos 2 opções");
    setSaving(true);
    await base44.entities.Poll.create({
      question: question.trim(),
      options: validOptions.map((text) => ({ text, votes: [] })),
      is_active: true,
    });
    queryClient.invalidateQueries({ queryKey: ["polls"] });
    toast.success("Enquete publicada!");
    onClose();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Pergunta *</Label>
        <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="O que você quer perguntar?" />
      </div>
      <div>
        <Label>Opções *</Label>
        <div className="space-y-2 mt-1">
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Opção ${i + 1}`}
              />
              {options.length > 2 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(i)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={addOption} className="mt-2 gap-1 text-muted-foreground">
          <Plus className="h-4 w-4" /> Adicionar opção
        </Button>
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full rounded-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicar Enquete"}
      </Button>
    </div>
  );
}