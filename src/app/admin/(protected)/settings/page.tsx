import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data/content";
import { AdminPageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { isEmailConfigured, isRazorpayConfigured, isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Studio"
        title="Settings"
        description="Brand details, contact information, seller registration and storefront policy copy."
      />
      <SettingsForm
        settings={settings}
        integrations={{
          supabase: isSupabaseConfigured,
          serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
          razorpay: isRazorpayConfigured,
          resend: isEmailConfigured,
        }}
      />
    </div>
  );
}
