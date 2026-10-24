import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { demoCategories, demoCombos, demoCoupons, demoHomepageSections, demoPopupOffer, demoProducts, demoSiteSettings } from "../src/lib/demo-data";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local first.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("No SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD provided; skipping admin creation.");
    return;
  }

  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) throw listError;

  const existing = existingUsers.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase(),
  );

  let userId = existing?.id;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Studio Admin" },
      app_metadata: { role: "admin" },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created admin user ${email}.`);
  } else {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: { role: "admin" },
    });
    if (error) throw error;
    console.log(`Admin user ${email} already existed; ensured admin app metadata.`);
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: "Studio Admin",
      role: "admin",
      account_type: "b2c",
    },
    { onConflict: "id" },
  );
  if (profileError) throw profileError;
}

async function main() {
  const force = process.env.SEED_FORCE === "true";
  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true });

  if (countError) throw countError;

  if ((count ?? 0) > 0 && !force) {
    console.log(
      "The catalog already has products. Refusing to overwrite an existing shop.",
    );
    console.log("Set SEED_FORCE=true and run again only if you want to reset demo catalog records.");
    await seedAdmin();
    return;
  }

  console.log("Seeding categories...");
  const { error: categoriesError } = await supabase.from("categories").upsert(
    demoCategories.map(({ created_at, updated_at, ...category }) => category),
    { onConflict: "id" },
  );
  if (categoriesError) throw categoriesError;

  console.log("Seeding products and variants...");
  for (const product of demoProducts) {
    const { variants, category, created_at, updated_at, ...productRow } = product;
    const { error: productError } = await supabase
      .from("products")
      .upsert(productRow, { onConflict: "id" });
    if (productError) throw productError;

    const { error: variantsError } = await supabase
      .from("product_variants")
      .upsert(variants, { onConflict: "id" });
    if (variantsError) throw variantsError;
  }

  console.log("Seeding combos...");
  for (const combo of demoCombos) {
    const { items, retail_value, created_at, updated_at, ...comboRow } = combo;
    const { error: comboError } = await supabase
      .from("combos")
      .upsert(comboRow, { onConflict: "id" });
    if (comboError) throw comboError;

    const { error: itemsError } = await supabase.from("combo_items").upsert(
      items.map(({ product, variant, ...item }) => item),
      { onConflict: "id" },
    );
    if (itemsError) throw itemsError;
  }

  console.log("Seeding coupons...");
  const { error: couponsError } = await supabase
    .from("coupons")
    .upsert(
      demoCoupons.map(({ created_at, updated_at, ...coupon }) => coupon),
      { onConflict: "id" },
    );
  if (couponsError) throw couponsError;

  console.log("Seeding homepage sections...");
  const { error: sectionsError } = await supabase
    .from("homepage_sections")
    .upsert(
      demoHomepageSections.map(({ created_at, updated_at, ...section }) => section),
      { onConflict: "id" },
    );
  if (sectionsError) throw sectionsError;

  console.log("Seeding popup offer...");
  const { error: popupError } = await supabase
    .from("popup_offers")
    .upsert(
      (({ created_at, updated_at, ...popup }) => popup)(demoPopupOffer),
      { onConflict: "id" },
    );
  if (popupError) throw popupError;

  console.log("Seeding site settings...");
  const { data: currentSettings, error: settingsReadError } = await supabase
    .from("site_settings")
    .select("data")
    .eq("id", true)
    .maybeSingle();
  if (settingsReadError) throw settingsReadError;

  const existingData =
    currentSettings?.data && typeof currentSettings.data === "object"
      ? currentSettings.data
      : {};

  const { error: settingsError } = await supabase
    .from("site_settings")
    .upsert(
      {
        id: true,
        data: {
          ...demoSiteSettings,
          ...existingData,
        },
      },
      { onConflict: "id" },
    );
  if (settingsError) throw settingsError;

  await seedAdmin();

  console.log("");
  console.log("Demo shop seeded successfully.");
  console.log("Next: start the app, sign in, and open /admin.");
  if ((count ?? 0) > 0) {
    console.log("Existing catalog rows were overwritten because SEED_FORCE=true.");
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
