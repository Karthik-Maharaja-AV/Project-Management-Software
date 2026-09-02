"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useEditor, useEditorState, EditorContent, ReactRenderer, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Markdown } from "@tiptap/markdown";
import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionProps } from "@tiptap/suggestion";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Code2,
  Link2,
  Undo2,
  Redo2,
} from "lucide-react";
import { useProjectMembers } from "@/hooks/use-project-members";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { UserSummary } from "@/lib/types";

type Member = { userId: string; role: string; user: UserSummary };

function MentionList({ items, command }: SuggestionProps<Member>) {
  if (items.length === 0) return null;
  return (
    <div className="w-56 rounded-[var(--radius-md)] border border-border-strong bg-surface-3 p-1 shadow-[var(--shadow-lg)]">
      {items.map((m) => (
        <button
          key={m.userId}
          onClick={() => command(m)}
          className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-sm text-text-primary hover:bg-surface-2"
        >
          <Avatar name={m.user.name} src={m.user.avatarUrl} size="xs" />
          <span className="truncate">{m.user.name}</span>
          <span className="truncate text-text-tertiary">@{m.user.username}</span>
        </button>
      ))}
    </div>
  );
}

function createMentionExtension(queryClient: QueryClient, projectId: string) {
  return Extension.create({
    name: "mentionSuggestion",
    addProseMirrorPlugins() {
      return [
        Suggestion<Member>({
          editor: this.editor,
          char: "@",
          allowSpaces: false,
          items: ({ query }) => {
            const members = queryClient.getQueryData<Member[]>(["project-members", projectId]) ?? [];
            return members
              .filter((m) => m.user.username.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 6);
          },
          command: ({ editor, range, props }) => {
            editor.chain().focus().insertContentAt(range, `@${props.user.username} `).run();
          },
          render: () => {
            let component: ReactRenderer<unknown, SuggestionProps<Member>> | null = null;

            function position() {
              if (!component) return;
              const rect = component.props.clientRect?.();
              if (!rect) return;
              const el = component.element as HTMLElement;
              el.style.position = "fixed";
              el.style.left = `${rect.left}px`;
              el.style.top = `${rect.bottom + 4}px`;
              el.style.zIndex = "50";
            }

            return {
              onStart: (props) => {
                component = new ReactRenderer(MentionList, { props, editor: props.editor });
                document.body.appendChild(component.element);
                position();
              },
              onUpdate: (props) => {
                component?.updateProps(props);
                position();
              },
              onKeyDown: ({ event }) => {
                if (event.key === "Escape") {
                  component?.destroy();
                  component?.element.remove();
                  component = null;
                  return true;
                }
                return false;
              },
              onExit: () => {
                component?.element.remove();
                component?.destroy();
                component = null;
              },
            };
          },
        }),
      ];
    },
  });
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClick}
          className={cn(
            "flex size-6.5 items-center justify-center rounded-[var(--radius-sm)] transition-colors disabled:pointer-events-none disabled:opacity-40",
            active ? "bg-accent-muted text-accent-muted-foreground" : "text-text-tertiary hover:bg-surface-2 hover:text-text-primary",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      strike: editor.isActive("strike"),
      code: editor.isActive("code"),
      h1: editor.isActive("heading", { level: 1 }),
      h2: editor.isActive("heading", { level: 2 }),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      taskList: editor.isActive("taskList"),
      blockquote: editor.isActive("blockquote"),
      codeBlock: editor.isActive("codeBlock"),
      link: editor.isActive("link"),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");

  function openLinkPopover() {
    setLinkValue(editor.getAttributes("link").href ?? "");
    setLinkOpen(true);
  }

  function applyLink() {
    const url = linkValue.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setLinkOpen(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-1.5 py-1">
      <ToolbarButton label="Bold" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Italic" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Strikethrough" active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Inline code" active={state.code} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code className="size-3.5" />
      </ToolbarButton>

      <span className="mx-0.5 h-4 w-px bg-border" />

      <ToolbarButton label="Heading 1" active={state.h1} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        <Heading1 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Heading 2" active={state.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="size-3.5" />
      </ToolbarButton>

      <span className="mx-0.5 h-4 w-px bg-border" />

      <ToolbarButton label="Bullet list" active={state.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Numbered list" active={state.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Checklist" active={state.taskList} onClick={() => editor.chain().focus().toggleTaskList().run()}>
        <ListTodo className="size-3.5" />
      </ToolbarButton>

      <span className="mx-0.5 h-4 w-px bg-border" />

      <ToolbarButton label="Quote" active={state.blockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Code block" active={state.codeBlock} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Code2 className="size-3.5" />
      </ToolbarButton>

      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <PopoverTrigger asChild>
          <span>
            <ToolbarButton label="Link" active={state.link} onClick={openLinkPopover}>
              <Link2 className="size-3.5" />
            </ToolbarButton>
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="flex items-center gap-1.5">
            <Input
              autoFocus
              placeholder="https://…"
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyLink();
                if (e.key === "Escape") setLinkOpen(false);
              }}
              className="h-7 text-xs"
            />
            <Button size="sm" onClick={applyLink}>
              {linkValue.trim() ? "Apply" : "Remove"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <span className="ml-auto flex items-center gap-0.5">
        <ToolbarButton label="Undo" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Redo" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="size-3.5" />
        </ToolbarButton>
      </span>
    </div>
  );
}

export function RichTextEditor({
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
  // Loads (and keeps fresh via React Query) the member list the mention suggestion
  // reads from the cache at query time, so it's never stale without needing a ref.
  useProjectMembers(projectId);
  const queryClient = useQueryClient();

  const extensions = useMemo(
    () => [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? "Write something…" }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown,
      createMentionExtension(queryClient, projectId),
    ],
    [placeholder, queryClient, projectId],
  );

  const editor = useEditor({
    extensions,
    content: value,
    contentType: "markdown",
    immediatelyRender: false,
    autofocus: autoFocus ? "end" : false,
    onUpdate: ({ editor }) => onChange(editor.getMarkdown()),
    onBlur: () => onBlur?.(),
    editorProps: {
      attributes: { class: "focus:outline-none" },
    },
  });

  // Sync external resets (e.g. a form clearing its draft after submit) into the
  // editor without disturbing content while the user is actively typing.
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    if (editor.getMarkdown() === value) return;
    editor.commands.setContent(value, { contentType: "markdown", emitUpdate: false });
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        className="rounded-[var(--radius-md)] border border-border-strong bg-surface-1"
        style={{ minHeight: `${minRows * 1.6 + 2}em` }}
      />
    );
  }

  return (
    <div className="tiptap-editor rounded-[var(--radius-md)] border border-border-strong bg-surface-1">
      <Toolbar editor={editor} />
      <div
        className="prose prose-sm dark:prose-invert max-w-none px-3 py-2 text-text-primary"
        style={{ "--editor-min-height": `${minRows * 1.5}em` } as React.CSSProperties}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
