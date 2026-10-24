"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { saveSettingsAction } from "@/lib/actions/admin/content";
import { INITIAL_FORM_STATE } from "@/lib/form-state";
import type { SiteSettings } from "@/lib/types";
import { INDIAN_STATES } from "@/lib/constants";
import {
  Checkbox,
  Field,
  FormMessage,
  Input,
  Select,
  Textarea,
} from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { MediaUrlField } from "@/components/admin/media";
import { Panel, Pill } from "@/components/admin/ui";

function IntegrationRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <div>
        <p className="text-[0.72rem] font-medium text-ink">{label}</p>
        <p className="text-[0.62rem] text-muted">{detail}</p>
      </div>
      <Pill tone={ok ? "positive" : "warning"}>{ok ? "Ready" : "Missing"}</Pill>
    </div>
  );
}

export function SettingsForm({
  settings,
  integrations,
}: {
  settings: SiteSettings;
  integrations: {
    supabase: boolean;
    serviceRole: boolean;
    razorpay: boolean;
    resend: boolean;
  };
}) {
  const [state, formAction] = useActionState(saveSettingsAction, INITIAL_FORM_STATE);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl ?? "");

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  return (
    <form action={formAction} className="mt-7">
      <input type="hidden" name="logoUrl" value={logoUrl} />

      {state.status === "error" ? (
        <div className="mb-5">
          <FormMessage message={state.message} tone="error" />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="Brand" description="The name, mark and announcement bar." bodyClassName="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Brand name" htmlFor="brandName" required>
                <Input
                  id="brandName"
                  name="brandName"
                  defaultValue={settings.brandName}
                  maxLength={80}
                  required
                />
              </Field>
              <Field label="Tagline" htmlFor="brandTagline">
                <Input
                  id="brandTagline"
                  name="brandTagline"
                  defaultValue={settings.brandTagline}
                  maxLength={140}
                />
              </Field>
            </div>
            <MediaUrlField
              label="Logo"
              value={logoUrl}
              onChange={setLogoUrl}
              folder="brand"
              hint="Optional. A transparent SVG or PNG works best."
            />
            <div className="border-t border-line pt-4">
              <Field label="Announcement text" htmlFor="announcementText">
                <Input
                  id="announcementText"
                  name="announcementText"
                  defaultValue={settings.announcementText}
                  maxLength={220}
                />
              </Field>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 sm:items-end">
                <Field label="Announcement link" htmlFor="announcementHref">
                  <Input
                    id="announcementHref"
                    name="announcementHref"
                    defaultValue={settings.announcementHref}
                    maxLength={500}
                  />
                </Field>
                <div className="pb-2.5">
                  <Checkbox
                    name="announcementActive"
                    label="Show the announcement bar"
                    defaultChecked={settings.announcementActive}
                  />
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Contact & social" description="Where customers can reach the studio." bodyClassName="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Support email" htmlFor="supportEmail" required>
                <Input
                  id="supportEmail"
                  name="supportEmail"
                  type="email"
                  defaultValue={settings.supportEmail}
                  required
                />
              </Field>
              <Field label="Support phone" htmlFor="supportPhone" required>
                <Input
                  id="supportPhone"
                  name="supportPhone"
                  defaultValue={settings.supportPhone}
                  maxLength={40}
                  required
                />
              </Field>
              <Field label="WhatsApp" htmlFor="whatsapp">
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  defaultValue={settings.whatsapp}
                  maxLength={40}
                />
              </Field>
              <Field
                label="Trade enquiries email"
                htmlFor="b2bEmail"
                hint="Shown on the wholesale page."
              >
                <Input
                  id="b2bEmail"
                  name="b2bEmail"
                  type="email"
                  defaultValue={settings.b2bEmail}
                />
              </Field>
              <Field label="Instagram URL" htmlFor="instagramUrl">
                <Input
                  id="instagramUrl"
                  name="instagramUrl"
                  type="url"
                  defaultValue={settings.instagramUrl}
                />
              </Field>
              <Field label="Facebook URL" htmlFor="facebookUrl">
                <Input
                  id="facebookUrl"
                  name="facebookUrl"
                  type="url"
                  defaultValue={settings.facebookUrl}
                />
              </Field>
              <Field label="Pinterest URL" htmlFor="pinterestUrl">
                <Input
                  id="pinterestUrl"
                  name="pinterestUrl"
                  type="url"
                  defaultValue={settings.pinterestUrl}
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Storefront copy" description="About and policy text shown on the storefront." bodyClassName="space-y-4">
            <Field label="About the studio" htmlFor="aboutText">
              <Textarea
                id="aboutText"
                name="aboutText"
                rows={5}
                maxLength={2400}
                defaultValue={settings.aboutText}
              />
            </Field>
            <Field label="Shipping policy" htmlFor="shippingPolicy">
              <Textarea
                id="shippingPolicy"
                name="shippingPolicy"
                rows={5}
                maxLength={4000}
                defaultValue={settings.shippingPolicy}
              />
            </Field>
            <Field label="Returns policy" htmlFor="returnsPolicy">
              <Textarea
                id="returnsPolicy"
                name="returnsPolicy"
                rows={5}
                maxLength={4000}
                defaultValue={settings.returnsPolicy}
              />
            </Field>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Seller & invoices" description="Used on retail and GST invoices." bodyClassName="space-y-4">
            <Field label="Legal seller name" htmlFor="sellerLegalName" required>
              <Input
                id="sellerLegalName"
                name="sellerLegalName"
                defaultValue={settings.sellerLegalName}
                maxLength={140}
                required
              />
            </Field>
            <Field
              label="Seller GSTIN"
              htmlFor="sellerGstin"
              hint="Printed on trade invoices. Leave blank only if not registered."
            >
              <Input
                id="sellerGstin"
                name="sellerGstin"
                defaultValue={settings.sellerGstin}
                maxLength={15}
                className="uppercase"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Invoice prefix" htmlFor="invoicePrefix" required>
                <Input
                  id="invoicePrefix"
                  name="invoicePrefix"
                  defaultValue={settings.invoicePrefix}
                  maxLength={8}
                  className="uppercase"
                  required
                />
              </Field>
              <Field label="GST rate (%)" htmlFor="gstRate">
                <Input
                  id="gstRate"
                  name="gstRate"
                  type="number"
                  min="0"
                  max="28"
                  step="0.01"
                  defaultValue={settings.gstRate}
                />
              </Field>
            </div>
            <p className="text-[0.68rem] leading-relaxed text-muted">
              Prices are tax-inclusive. The GST rate and seller details are recorded on
              each order when it is paid.
            </p>
          </Panel>

          <Panel title="Registered address" bodyClassName="space-y-4">
            <Field label="Address line 1" htmlFor="sellerLine1" required>
              <Input
                id="sellerLine1"
                name="sellerLine1"
                defaultValue={settings.sellerAddress.line1}
                maxLength={180}
                required
              />
            </Field>
            <Field label="Address line 2" htmlFor="sellerLine2">
              <Input
                id="sellerLine2"
                name="sellerLine2"
                defaultValue={settings.sellerAddress.line2}
                maxLength={180}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" htmlFor="sellerCity" required>
                <Input
                  id="sellerCity"
                  name="sellerCity"
                  defaultValue={settings.sellerAddress.city}
                  maxLength={90}
                  required
                />
              </Field>
              <Field label="PIN code" htmlFor="sellerPincode" required>
                <Input
                  id="sellerPincode"
                  name="sellerPincode"
                  defaultValue={settings.sellerAddress.pincode}
                  maxLength={6}
                  inputMode="numeric"
                  required
                />
              </Field>
            </div>
            <Field label="State" htmlFor="sellerState">
              <Select
                id="sellerState"
                name="sellerState"
                defaultValue={settings.sellerAddress.state}
              >
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Country" htmlFor="sellerCountry" required>
              <Input
                id="sellerCountry"
                name="sellerCountry"
                defaultValue={settings.sellerAddress.country}
                maxLength={60}
                required
              />
            </Field>
          </Panel>

          <Panel bodyClassName="space-y-3">
            <SubmitButton className="w-full" pendingLabel="Saving settings">
              Save settings
            </SubmitButton>
            {state.status === "success" ? (
              <FormMessage message={state.message} tone="success" />
            ) : null}
            <p className="pt-1 text-center text-[0.62rem] leading-relaxed text-muted">
              Changes to the storefront take effect immediately after saving.
            </p>
          </Panel>

          <Panel
            title="Integrations"
            description="Read-only status from your environment."
            bodyClassName="divide-y divide-line/70 pt-1"
          >
            <IntegrationRow
              label="Supabase"
              ok={integrations.supabase}
              detail="Database, auth and media."
            />
            <IntegrationRow
              label="Service role key"
              ok={integrations.serviceRole}
              detail="Required for studio writes."
            />
            <IntegrationRow
              label="Razorpay"
              ok={integrations.razorpay}
              detail="Checkout and shipping links."
            />
            <IntegrationRow
              label="Resend"
              ok={integrations.resend}
              detail="Order and status emails."
            />
            <p className="py-3 text-[0.62rem] leading-relaxed text-muted">
              Keys live in <code>.env.local</code> and are never saved from this screen.
            </p>
          </Panel>
        </div>
      </div>
    </form>
  );
}
