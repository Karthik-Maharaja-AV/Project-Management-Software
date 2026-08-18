"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Invitation = {
  id: string;
  role: string;
  status: string;
  workspace: { name: string; slug: string; icon: string | null };
  invitedBy: { name: string; username: string };
};

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/invitations/${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || "Invitation not found");
        return res.json();
      })
      .then((body) => setInvitation(body.invitation))
      .catch((err) => setError(err.message));
  }, [token]);

  async function respond(action: "accept" | "reject") {
    setBusy(true);
    try {
      const res = await fetch(`/api/invitations/${token}/${action}`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Something went wrong");
      if (action === "accept" && invitation) {
        toast.success(`Joined ${invitation.workspace.name}`);
        router.push(`/${invitation.workspace.slug}`);
      } else {
        toast.info("Invitation declined");
        router.push("/");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-8 bg-surface-0 px-4">
      <Link href="/" className="flex items-center gap-2 text-text-primary">
        <span className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-accent-foreground font-bold text-sm">
          PF
        </span>
        <span className="text-lg font-semibold tracking-tight">PixelForge</span>
      </Link>
      <Card className="w-full max-w-sm">
        {error ? (
          <CardContent className="pt-5 text-sm text-danger">{error}</CardContent>
        ) : !invitation ? (
          <CardContent className="pt-5 text-sm text-text-tertiary">Loading invitation…</CardContent>
        ) : invitation.status !== "PENDING" ? (
          <CardContent className="pt-5 text-sm text-text-tertiary">
            This invitation has already been {invitation.status.toLowerCase()}.
          </CardContent>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-lg">
                Join {invitation.workspace.icon ?? ""} {invitation.workspace.name}
              </CardTitle>
              <CardDescription>
                {invitation.invitedBy.name} invited you as a {invitation.role.toLowerCase()}.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button className="flex-1" disabled={busy} onClick={() => respond("accept")}>
                Accept
              </Button>
              <Button variant="secondary" className="flex-1" disabled={busy} onClick={() => respond("reject")}>
                Decline
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
