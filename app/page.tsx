import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
    include: { workspace: true },
  });

  if (membership) redirect(`/${membership.workspace.slug}`);
  redirect("/workspaces/new");
}
