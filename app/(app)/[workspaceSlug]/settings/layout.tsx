import { SettingsTabs } from "@/components/layout/settings-tabs";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-5 text-lg font-semibold text-text-primary">Settings</h1>
      <SettingsTabs workspaceSlug={workspaceSlug} />
      {children}
    </div>
  );
}
