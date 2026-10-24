import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Studio",
    template: "%s · Studio · Loom & Lore",
  },
  robots: { index: false, follow: false },
};

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await requireAdmin();
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
    >
      {children}
    </AdminShell>
  );
}
