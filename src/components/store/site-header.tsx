import { getViewer } from "@/lib/auth";
import { getOffersForNavigation } from "@/lib/data/promotions";
import type { Category, SiteSettings } from "@/lib/types";
import { HeaderShell } from "@/components/store/header-shell";

export async function SiteHeader({
  settings,
  categories,
}: {
  settings: SiteSettings;
  categories: Category[];
}) {
  const viewer = await getViewer();
  const offers = await getOffersForNavigation(viewer.isB2B ? "b2b" : "b2c", 4);

  return (
    <HeaderShell
      settings={settings}
      categories={categories}
      offers={offers}
      viewer={{
        isB2B: viewer.isB2B,
        isAdmin: viewer.isAdmin,
        name: viewer.profile?.full_name ?? null,
        email: viewer.user?.email ?? null,
      }}
    />
  );
}
