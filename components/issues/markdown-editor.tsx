"use client";

import { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye, Pencil } from "lucide-react";
import { useProjectMembers } from "@/hooks/use-project-members";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function MarkdownEditor({
  projectId,
  value,
  onChange,
  onBlur,
  placeholder,
  minRows = 4,
  autoFocus,
}: {
  projectId: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minRows?: number;
  autoFocus?: boolean;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const { data: members } = useProjectMembers(projectId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number | null>(null);

  const mentionResults = useMemo(() => {
    if (mentionQuery === null) return [];
    return (members ?? [])
      .filter((m) => m.user.username.toLowerCase().includes(mentionQuery.toLowerCase()))
      .slice(0, 6);
  }, [members, mentionQuery]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    onChange(next);

    const cursor = e.target.selectionStart;
    const upToCursor = next.slice(0, cursor);
    const match = upToCursor.match(/@([a-z0-9_-]*)$/i);
    if (match) {
      setMentionQuery(match[1]);
      setMentionStart(cursor - match[1].length - 1);
    } else {
      setMentionQuery(null);
      setMentionStart(null);
    }
  }

  function insertMention(username: string) {
    if (mentionStart === null || !textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart;
    const before = value.slice(0, mentionStart);
    const after = value.slice(cursor);
    const next = `${before}@${username} ${after}`;
    onChange(next);
    setMentionQuery(null);
    setMentionStart(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-border-strong bg-surface-1">
      <div className="flex items-center gap-1 border-b border-border px-2 py-1">
        <button
          onClick={() => setTab("write")}
          className={cn(
            "flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-xs transition-colors",
            tab === "write" ? "bg-surface-2 text-text-primary" : "text-text-tertiary hover:text-text-primary",
          )}
        >
          <Pencil className="size-3" /> Write
        </button>
        <button
          onClick={() => setTab("preview")}
          className={cn(
            "flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-xs transition-colors",
            tab === "preview" ? "bg-surface-2 text-text-primary" : "text-text-tertiary hover:text-text-primary",
          )}
        >
          <Eye className="size-3" /> Preview
        </button>
      </div>

      {tab === "write" ? (
        <div className="relative">
          <Textarea
            ref={textareaRef}
            autoFocus={autoFocus}
            value={value}
            onChange={handleChange}
            onBlur={onBlur}
            placeholder={placeholder}
            rows={minRows}
            className="rounded-none border-none focus-visible:ring-0"
          />
          {mentionQuery !== null && mentionResults.length > 0 && (
            <div className="absolute left-2 top-full z-10 mt-1 w-48 rounded-[var(--radius-md)] border border-border-strong bg-surface-3 p-1 shadow-[var(--shadow-lg)]">
              {mentionResults.map((m) => (
                <button
                  key={m.userId}
                  onClick={() => insertMention(m.user.username)}
                  className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-text-primary hover:bg-surface-2"
                >
                  <Avatar name={m.user.name} src={m.user.avatarUrl} size="xs" />
                  <span>{m.user.name}</span>
                  <span className="text-text-tertiary">@{m.user.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="prose prose-sm dark:prose-invert min-h-24 max-w-none px-3 py-2 text-text-primary">
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-text-tertiary">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
