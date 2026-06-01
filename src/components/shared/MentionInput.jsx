import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";

/**
 * Input com suporte a menções @nome
 * Props: value, onChange, onKeyDown, placeholder, className
 */
export default function MentionInput({ value, onChange, onKeyDown, placeholder, className }) {
  const [mentionSearch, setMentionSearch] = useState(null); // string após @
  const [users, setUsers] = useState([]);
  const [mentionPos, setMentionPos] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);

  // Busca usuários ao digitar @
  useEffect(() => {
    if (mentionSearch === null) { setUsers([]); return; }
    base44.entities.User.filter({}).then((all) => {
      const q = mentionSearch.toLowerCase();
      setUsers(all.filter((u) => (u.full_name || u.email || "").toLowerCase().includes(q)).slice(0, 6));
    });
  }, [mentionSearch]);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);

    // Detectar @ na posição do cursor
    const cursor = e.target.selectionStart;
    const before = val.slice(0, cursor);
    const match = before.match(/@(\w*)$/);
    if (match) {
      setMentionSearch(match[1]);
      setMentionPos(cursor - match[0].length);
      setSelectedIdx(0);
    } else {
      setMentionSearch(null);
      setMentionPos(null);
    }
  };

  const insertMention = (user) => {
    const name = (user.full_name || user.email).replace(/\s+/g, "");
    const before = value.slice(0, mentionPos);
    const cursor = inputRef.current?.selectionStart || value.length;
    const afterAt = value.slice(mentionPos);
    // substitui o @busca pelo @nome
    const afterMatch = afterAt.replace(/^@\w*/, "");
    const newVal = `${before}@${name}${afterMatch} `;
    onChange(newVal);
    setMentionSearch(null);
    setMentionPos(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e) => {
    if (users.length > 0 && mentionSearch !== null) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, users.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter" && users[selectedIdx]) { e.preventDefault(); insertMention(users[selectedIdx]); return; }
      if (e.key === "Escape") { setMentionSearch(null); return; }
    }
    onKeyDown && onKeyDown(e);
  };

  return (
    <div className="relative flex-1">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      {mentionSearch !== null && users.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-56 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {users.map((u, i) => (
            <button
              key={u.id}
              onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                i === selectedIdx ? "bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                {(u.full_name || u.email || "?")[0].toUpperCase()}
              </div>
              <span className="truncate">{u.full_name || u.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}