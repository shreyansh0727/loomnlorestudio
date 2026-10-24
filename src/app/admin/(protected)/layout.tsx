import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/data/content";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: {
      default: "Studio",
      template: `%s · Studio · ${settings.brandName}`,
    },
    robots: { index: false, follow: false },
  };
}

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [viewer, settings] = await Promise.all([requireAdmin(), getSiteSettings()]);
  const demo = !isSupabaseConfigured && process.env.NODE_ENV !== "production";
  const serviceRoleMissing = isSupabaseConfigured && !process.env.SUPABASE_SERVICE_ROLE_KEY;
  const name =
    viewer.profile?.full_name?.trim() ||
    viewer.user?.email ||
    "Studio preview";

  return (
    <AdminShell
      email={viewer.user?.email ?? null}
      name={name}
      demo={demo}
      serviceRoleMissing={serviceRoleMissing}
      brandName={settings.brandName}
      logoUrl={settings.logoUrl}
    >
      {children}
    </AdminShell>
  );
}
