"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Settings, Plus, Edit2, Loader2, AlertTriangle,
  Globe, Palette, Phone, Share2, ShoppingCart, FileText, Image,
} from "lucide-react";
import {
  useWebsiteSettingsQuery, useCreateWebsiteSettingMutation,
  useUpdateWebsiteSettingMutation, WebsiteSetting, WebsiteSettingFormValues,
} from "@/hooks/useWebsiteSettings";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/store/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Controller } from "react-hook-form";

/* ── Schema ── */
const schema = z.object({
  site_name: z.string().min(1, "Site name is required"),
  site_tagline: z.string().nullable().default(null),
  site_description: z.string().nullable().default(null),
  logo_url: z.string().nullable().default(null),
  favicon_url: z.string().nullable().default(null),
  footer_logo_url: z.string().nullable().default(null),
  primary_color: z.string().nullable().default(null),
  secondary_color: z.string().nullable().default(null),
  accent_color: z.string().nullable().default(null),
  font_primary: z.string().nullable().default(null),
  font_heading: z.string().nullable().default(null),
  contact_email: z.string().email("Invalid email").nullable().or(z.literal("")).default(null),
  support_email: z.string().email("Invalid email").nullable().or(z.literal("")).default(null),
  contact_phone: z.string().nullable().default(null),
  whatsapp_number: z.string().nullable().default(null),
  address: z.string().nullable().default(null),
  business_hours: z.string().nullable().default(null),
  facebook_url: z.string().nullable().default(null),
  instagram_url: z.string().nullable().default(null),
  currency: z.string().nullable().default(null),
  currency_symbol: z.string().nullable().default(null),
  tax_percentage: z.number().nullable().default(null),
  free_shipping_threshold: z.number().nullable().default(null),
  meta_title: z.string().nullable().default(null),
  meta_description: z.string().nullable().default(null),
  is_active: z.boolean().default(true),
});

/* ── Field helper ── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

const EMPTY: WebsiteSettingFormValues = {
  site_name: "", site_tagline: null, site_description: null,
  logo_url: null, favicon_url: null, footer_logo_url: null,
  primary_color: null, secondary_color: null, accent_color: null,
  font_primary: null, font_heading: null,
  contact_email: null, support_email: null, contact_phone: null,
  whatsapp_number: null, address: null, business_hours: null,
  facebook_url: null, instagram_url: null,
  currency: "PKR", currency_symbol: "₨",
  tax_percentage: null, free_shipping_threshold: null,
  meta_title: null, meta_description: null,
  is_active: true,
};

function toFormValues(s: WebsiteSetting): WebsiteSettingFormValues {
  return {
    site_name: s.site_name,
    site_tagline: s.site_tagline,
    site_description: s.site_description,
    logo_url: s.logo_url,
    favicon_url: s.favicon_url,
    footer_logo_url: s.footer_logo_url,
    primary_color: s.primary_color,
    secondary_color: s.secondary_color,
    accent_color: s.accent_color,
    font_primary: s.font_primary,
    font_heading: s.font_heading,
    contact_email: s.contact_email,
    support_email: s.support_email,
    contact_phone: s.contact_phone,
    whatsapp_number: s.whatsapp_number,
    address: s.address,
    business_hours: s.business_hours,
    facebook_url: s.facebook_url,
    instagram_url: s.instagram_url,
    currency: s.currency,
    currency_symbol: s.currency_symbol,
    tax_percentage: s.tax_percentage,
    free_shipping_threshold: s.free_shipping_threshold,
    meta_title: s.meta_title,
    meta_description: s.meta_description,
    is_active: s.is_active,
  };
}

/* ── Form Dialog ── */
function SettingFormDialog({
  open, onOpenChange, selected, onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selected: WebsiteSetting | null;
  onSuccess: () => void;
}) {
  const isEdit = !!selected;
  const createMutation = useCreateWebsiteSettingMutation();
  const updateMutation = useUpdateWebsiteSettingMutation();
  const { addToast } = useToast();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<WebsiteSettingFormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: EMPTY,
  });
  const { register, handleSubmit, control, reset, formState: { errors } } = form;

  useEffect(() => {
    if (open) {
      reset(selected ? toFormValues(selected) : EMPTY);
    }
  }, [open, selected, reset]);

  const onSubmit = (values: WebsiteSettingFormValues) => {
    // Convert empty strings to null for nullable fields
    const clean = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, v === "" ? null : v])
    ) as WebsiteSettingFormValues;

    if (isEdit && selected) {
      updateMutation.mutate({ id: selected.id, data: clean }, {
        onSuccess: () => { addToast("Settings updated.", "success"); onSuccess(); onOpenChange(false); },
        onError: (e) => addToast(e.message, "error", "Error"),
      });
    } else {
      createMutation.mutate(clean, {
        onSuccess: () => { addToast("Settings created.", "success"); onSuccess(); onOpenChange(false); },
        onError: (e) => addToast(e.message, "error", "Error"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] rounded-lg border-border p-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-4 py-3 border-b border-border bg-muted/30 shrink-0">
          <DialogTitle className="text-sm font-semibold">
            {isEdit ? "Edit Website Setting" : "New Website Setting"}
          </DialogTitle>
          <DialogDescription className="text-[11px] text-muted-foreground">
            {isEdit ? "Update the website configuration." : "Create a new website setting profile."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="general" className="w-full">
              <div className="px-4 pt-3 border-b border-border sticky top-0 bg-background z-10">
                <TabsList className="bg-muted/60 border border-border p-0.5 h-8 rounded-md gap-0.5 flex-wrap h-auto">
                  {[
                    { value: "general", label: "General", icon: Globe },
                    { value: "media", label: "Media", icon: Image },
                    { value: "theme", label: "Theme", icon: Palette },
                    { value: "contact", label: "Contact", icon: Phone },
                    { value: "social", label: "Social", icon: Share2 },
                    { value: "commerce", label: "Commerce", icon: ShoppingCart },
                    { value: "seo", label: "SEO", icon: FileText },
                  ].map(({ value, label, icon: Icon }) => (
                    <TabsTrigger key={value} value={value} className="text-xs h-7 rounded flex items-center gap-1 px-2.5">
                      <Icon className="h-3 w-3" />{label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* General */}
              <TabsContent value="general" className="p-4 space-y-3 focus-visible:outline-none">
                <Field label="Site Name *" error={errors.site_name?.message}>
                  <Input {...register("site_name")} placeholder="ModFirst Apparel" />
                </Field>
                <Field label="Site Tagline" error={errors.site_tagline?.message}>
                  <Input {...register("site_tagline")} placeholder="Premium Fashion & Custom Designs" />
                </Field>
                <Field label="Site Description" error={errors.site_description?.message}>
                  <textarea
                    {...register("site_description")}
                    placeholder="Your one-stop shop for modern apparel..."
                    rows={3}
                    className="h-auto w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm transition-all outline-none placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:opacity-50 dark:bg-input/20 resize-none"
                  />
                </Field>
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 bg-muted/20">
                  <span className="text-xs font-medium">Active</span>
                  <Controller control={control} name="is_active"
                    render={({ field }) => (
                      <Switch checked={!!field.value} onCheckedChange={field.onChange} size="sm" />
                    )}
                  />
                </div>
              </TabsContent>

              {/* Media */}
              <TabsContent value="media" className="p-4 space-y-3 focus-visible:outline-none">
                <Field label="Logo URL">
                  <Input {...register("logo_url")} placeholder="https://modfirst.com/logo.png" />
                </Field>
                <Field label="Favicon URL">
                  <Input {...register("favicon_url")} placeholder="https://modfirst.com/favicon.ico" />
                </Field>
                <Field label="Footer Logo URL">
                  <Input {...register("footer_logo_url")} placeholder="https://modfirst.com/footer-logo.png" />
                </Field>
              </TabsContent>

              {/* Theme */}
              <TabsContent value="theme" className="p-4 space-y-3 focus-visible:outline-none">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: "primary_color" as const, label: "Primary Color" },
                    { name: "secondary_color" as const, label: "Secondary Color" },
                    { name: "accent_color" as const, label: "Accent Color" },
                  ].map(({ name, label }) => (
                    <Field key={name} label={label}>
                      <div className="flex gap-2 items-center">
                        <Controller control={control} name={name}
                          render={({ field }) => (
                            <input
                              type="color"
                              value={field.value ?? "#3b82f6"}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="h-9 w-10 rounded-lg border border-input cursor-pointer p-0.5 bg-card"
                            />
                          )}
                        />
                        <Input {...register(name)} placeholder="#3b82f6" className="font-mono text-xs" />
                      </div>
                    </Field>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Primary Font">
                    <Input {...register("font_primary")} placeholder="Inter" />
                  </Field>
                  <Field label="Heading Font">
                    <Input {...register("font_heading")} placeholder="Playfair Display" />
                  </Field>
                </div>
              </TabsContent>

              {/* Contact */}
              <TabsContent value="contact" className="p-4 space-y-3 focus-visible:outline-none">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Contact Email" error={errors.contact_email?.message}>
                    <Input {...register("contact_email")} type="email" placeholder="info@modfirst.com" />
                  </Field>
                  <Field label="Support Email" error={errors.support_email?.message}>
                    <Input {...register("support_email")} type="email" placeholder="support@modfirst.com" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Contact Phone">
                    <Input {...register("contact_phone")} placeholder="+923123456789" />
                  </Field>
                  <Field label="WhatsApp Number">
                    <Input {...register("whatsapp_number")} placeholder="+923123456789" />
                  </Field>
                </div>
                <Field label="Address">
                  <Input {...register("address")} placeholder="123 Fashion Street, Karachi" />
                </Field>
                <Field label="Business Hours">
                  <Input {...register("business_hours")} placeholder="Mon-Sat: 9:00 AM - 7:00 PM" />
                </Field>
              </TabsContent>

              {/* Social */}
              <TabsContent value="social" className="p-4 space-y-3 focus-visible:outline-none">
                <Field label="Facebook URL">
                  <Input {...register("facebook_url")} placeholder="https://facebook.com/modfirst" />
                </Field>
                <Field label="Instagram URL">
                  <Input {...register("instagram_url")} placeholder="https://instagram.com/modfirst" />
                </Field>
              </TabsContent>

              {/* Commerce */}
              <TabsContent value="commerce" className="p-4 space-y-3 focus-visible:outline-none">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Currency">
                    <Input {...register("currency")} placeholder="PKR" />
                  </Field>
                  <Field label="Currency Symbol">
                    <Input {...register("currency_symbol")} placeholder="₨" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tax Percentage (%)">
                    <Input
                      type="number"
                      step="0.01"
                      {...register("tax_percentage", { valueAsNumber: true, setValueAs: (v) => v === "" ? null : Number(v) })}
                      placeholder="18"
                    />
                  </Field>
                  <Field label="Free Shipping Threshold">
                    <Input
                      type="number"
                      {...register("free_shipping_threshold", { valueAsNumber: true, setValueAs: (v) => v === "" ? null : Number(v) })}
                      placeholder="5000"
                    />
                  </Field>
                </div>
              </TabsContent>

              {/* SEO */}
              <TabsContent value="seo" className="p-4 space-y-3 focus-visible:outline-none">
                <Field label="Meta Title">
                  <Input {...register("meta_title")} placeholder="ModFirst Apparel - Best Custom Clothing" />
                </Field>
                <Field label="Meta Description">
                  <textarea
                    {...register("meta_description")}
                    placeholder="Shop premium quality clothes and custom designs..."
                    rows={3}
                    className="h-auto w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm transition-all outline-none placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:opacity-50 dark:bg-input/20 resize-none"
                  />
                </Field>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-end gap-2 px-4 py-3 border-t border-border bg-muted/20 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />{isEdit ? "Saving..." : "Creating..."}</> : isEdit ? "Save Changes" : "Create Setting"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════
   PAGE
══════════════════════════════════════ */
export default function WebsiteSettingsPage() {
  const { canCreate, canEdit } = usePermissions("website-settings");
  const { data, isLoading, isError, refetch, isFetching } = useWebsiteSettingsQuery();
  const { addToast } = useToast();

  const [isOpenForm, setIsOpenForm] = useState(false);
  const [selected, setSelected] = useState<WebsiteSetting | null>(null);

  const settings: WebsiteSetting[] = (
    Array.isArray(data?.payload) ? data.payload : (data?.payload as { data?: WebsiteSetting[] })?.data
  ) ?? [];

  const columns = useMemo<ColumnDef<WebsiteSetting>[]>(() => [
    {
      accessorKey: "site_name",
      header: "Site Name",
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-medium text-foreground">{row.original.site_name}</p>
          {row.original.site_tagline && (
            <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{row.original.site_tagline}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "contact_email",
      header: "Contact",
      cell: ({ row }) => (
        <div className="text-[11px] text-muted-foreground">
          {row.original.contact_email && <p>{row.original.contact_email}</p>}
          {row.original.contact_phone && <p>{row.original.contact_phone}</p>}
        </div>
      ),
    },
    {
      accessorKey: "currency",
      header: "Currency",
      cell: ({ row }) => row.original.currency ? (
        <span className="text-xs font-mono">
          {row.original.currency_symbol} {row.original.currency}
        </span>
      ) : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      accessorKey: "primary_color",
      header: "Colors",
      cell: ({ row }) => (
        <div className="flex gap-1">
          {[row.original.primary_color, row.original.secondary_color, row.original.accent_color]
            .filter(Boolean)
            .map((c, i) => (
              <span key={i} className="h-4 w-4 rounded-full border border-border/50 inline-block shrink-0" style={{ backgroundColor: c! }} title={c!} />
            ))}
        </div>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => row.original.is_active
        ? <Badge variant="outline" className="text-[10px] h-5 border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20">Active</Badge>
        : <Badge variant="outline" className="text-[10px] h-5 border-muted text-muted-foreground">Inactive</Badge>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => canEdit ? (
        <div className="flex justify-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost" size="icon-sm"
                  onClick={() => { setSelected(row.original); setIsOpenForm(true); }}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ) : null,
    },
  ], [canEdit]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Website Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage site configuration, branding, and contact details</p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={() => { setSelected(null); setIsOpenForm(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New Setting
          </Button>
        )}
      </div>

      {isError && (
        <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
          <AlertTriangle className="h-8 w-8 text-amber-400" />
          <p className="text-sm">Failed to load website settings.</p>
        </div>
      )}

      {!isError && (
        <DataTable
          columns={columns}
          data={settings}
          isLoading={isLoading}
          isFetching={isFetching}
          onRefetch={refetch}
          exportFilename="website-settings"
          searchPlaceholder="Search settings..."
          emptyIcon={<Settings className="h-8 w-8" />}
          emptyText="No website settings yet. Create your first one."
          pageSize={10}
        />
      )}

      <SettingFormDialog
        open={isOpenForm}
        onOpenChange={setIsOpenForm}
        selected={selected}
        onSuccess={() => { addToast(""); refetch(); }}
      />
    </div>
  );
}
