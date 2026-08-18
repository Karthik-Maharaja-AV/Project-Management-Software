import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-8 bg-surface-0 px-4 py-12">
      <Link href="/" className="flex items-center gap-2 text-text-primary">
        <span className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-accent-foreground font-bold text-sm">
          PF
        </span>
        <span className="text-lg font-semibold tracking-tight">PixelForge</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
