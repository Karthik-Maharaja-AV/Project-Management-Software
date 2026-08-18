import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function MarkdownContent({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none text-text-primary", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
