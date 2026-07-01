"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Settings, Plus, Edit2, Loader2, AlertTriangle,
  Globe, Palette, Phone, Share2, ShoppingCart, FileText, ImageIcon,
  Building2, CheckCircle2,
} from "lucide-react";
import {
  useWebsiteSettingsQuery, useCreateWebsiteSettingMutation,
  useUpdateWebsiteSettingMutation, WebsiteSetting,
} from "@/hooks/useWebsiteSettings";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/store/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/* ── Schema ── */
const schema = z.object({
  site_name: z.string().min(1, "Site name is required"),
  site_tagline: z.string().optional(),
  site_description: z.string().optional(),
  logo_url: z.string().optional(),
  favicon_url: z.string().optional(),
  footer_logo_url: z.string().optional(),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
  accent_color: z.string().optional(),
  font_primary: z.string().optional(),
  font_heading: z.string().optional(),
  contact_email: z.union([z.string().email("Invalid email"), z.literal(""), z.undefined()]),
  support_email: z.union([z.string().email("Invalid email"), z.literal(""), z.undefined()]),
  contact_phone: z.string().optional(),
  whatsapp_number: z.string().optional(),
  address: z.string().optional(),
  business_hours: z.string().optional(),
  facebook_url: z.string().optional(),
  instagram_url: z.string().optional(),
  currency: z.string().optional(),
  currency_symbol: z.string().optional(),
  tax_percentage: z.number().nullable().optional(),
  free_shipping_threshold: z.number().nullable().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
  site_name: "", site_tagline: "", site_description: "",
  logo_url: "", favicon_url: "", footer_logo_url: "",
  primary_color: "#3b82f6", secondary_color: "#1e40af", accent_color: "#eab308",
  font_primary: "Inter", font_heading: "Playfair Display",
  contact_email: "", support_email: "",
  contact_phone: "", whatsapp_number: "",
  address: "", business_hours: "",
  facebook_url: "", instagram_url: "",
  currency: "PKR", currency_symbol: "₨",
  tax_percentage: null, free_shipping_threshold: null,
  meta_title: "", meta_description: "",
  is_active: true,
};

function toFormValues(s: WebsiteSetting): FormValues {
  return {
    site_name: s.site_name ?? "",
    site_tagline: s.site_tagline ?? "",
    site_description: s.site_description ?? "",
    logo_url: s.logo_url ?? "",
    favicon_url: s.favicon_url ?? "",
    footer_logo_url: s.footer_logo_url ?? "",
    primary_color: s.primary_color ?? "#3b82f6",
    secondary_color: s.secondary_color ?? "#1e40af",
    accent_color: s.accent_color ?? "#eab308",
    font_primary: s.font_primary ?? "",
    font_heading: s.font_heading ?? "",
    contact_email: s.contact_email ?? "",
    support_email: s.support_email ?? "",
    contact_phone: s.contact_phone ?? "",
    whatsapp_number: s.whatsapp_number ?? "",
    address: s.address ?? "",
    business_hours: s.business_hours ?? "",
    facebook_url: s.facebook_url ?? "",
    instagram_url: s.instagram_url ?? "",
    currency: s.currency ?? "PKR",
    currency_symbol: s.currency_symbol ?? "₨",
    tax_percentage: s.tax_percentage ?? null,
    free_shipping_threshold: s.free_shipping_threshold ?? null,
    meta_title: s.meta_title ?? "",
    meta_description: s.meta_description ?? "",
    is_active: s.is_active ?? true,
  };
}

// Fields the API requires even when empty
const REQUIRED_STRING_FIELDS = new Set(["font_primary", "font_heading"]);

// Strip empty strings, null, and undefined — except required string fields
function cleanPayload(values: FormValues): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (v === null || v === undefined) continue;
    if (v === "" && !REQUIRED_STRING_FIELDS.has(k)) continue;
    out[k] = v;
  }
  return out;
}

/* ── Field ── */
function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div>
        <Label className="text-xs font-medium text-foreground">{label}</Label>
        {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      {children}
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

/* ── Color Field — picker + text synced ── */
function ColorField({ label, name, control, register }: {
  label: string;
  name: "primary_color" | "secondary_color" | "accent_color";
  control: ReturnType<typeof useForm<FormValues>>["control"];
  register: ReturnType<typeof useForm<FormValues>>["register"];
}) {
  return (
    <Controller control={control} name={name}
      render={({ field }) => (
        <Field label={label}>
          <div className="flex gap-2 items-center">
            <label className="relative cursor-pointer shrink-0">
              <span
                className="h-9 w-9 rounded-lg border border-input flex items-center justify-center overflow-hidden shadow-sm"
                style={{ backgroundColor: field.value || "#3b82f6" }}
              />
              <input
                type="color"
                value={field.value || "#3b82f6"}
                onChange={(e) => field.onChange(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>
            <Input
              {...register(name)}
              value={field.value || ""}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder="#3b82f6"
              className="font-mono text-xs"
            />
          </div>
        </Field>
      )}
    />
  );
}

/* ── Section nav ── */
const SECTIONS = [
  { id: "general", label: "General", icon: Globe },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "theme", label: "Theme & Fonts", icon: Palette },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "social", label: "Social Media", icon: Share2 },
  { id: "commerce", label: "Commerce", icon: ShoppingCart },
  { id: "seo", label: "SEO", icon: FileText },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/* ── Form Dialog ── */
function SettingFormDialog({
  open, onOpenChange, selected,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selected: WebsiteSetting | null;
}) {
  const isEdit = !!selected;
  const createMutation = useCreateWebsiteSettingMutation();
  const updateMutation = useUpdateWebsiteSettingMutation();
  const { addToast } = useToast();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const [activeSection, setActiveSection] = useState<SectionId>("general");

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: EMPTY,
  });

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);

  useEffect(() => {
    if (open) {
      reset(selected ? toFormValues(selected) : EMPTY);
      setActiveSection("general");
    }
  }, [open, selected, reset]);

  // Scroll spy via scroll event on the container
  useEffect(() => {
    if (!open) return;
    // Wait one tick for dialog to fully render
    const timer = setTimeout(() => {
      const container = scrollRef.current;
      if (!container) return;

      const onScroll = () => {
        if (isProgrammaticScroll.current) return;
        const { scrollTop, scrollHeight, clientHeight } = container;

        // At the very bottom → force last section active
        if (scrollTop + clientHeight >= scrollHeight - 8) {
          setActiveSection(SECTIONS[SECTIONS.length - 1].id);
          return;
        }

        const threshold = clientHeight * 0.3;
        let current: SectionId = SECTIONS[0].id;
        for (const { id } of SECTIONS) {
          const el = sectionRefs.current[id];
          if (el && el.offsetTop <= scrollTop + threshold) {
            current = id;
          }
        }
        setActiveSection(current);
      };

      container.addEventListener("scroll", onScroll, { passive: true });
      // Run once to set initial state
      onScroll();
      return () => container.removeEventListener("scroll", onScroll);
    }, 100);

    return () => clearTimeout(timer);
  }, [open]);

  const scrollToSection = (id: SectionId) => {
    const container = scrollRef.current;
    const el = sectionRefs.current[id];
    if (!container || !el) return;
    setActiveSection(id);
    isProgrammaticScroll.current = true;
    container.scrollTo({ top: el.offsetTop - 16, behavior: "smooth" });
    setTimeout(() => { isProgrammaticScroll.current = false; }, 700);
  };

  const onSubmit = (values: FormValues) => {
    const body = cleanPayload(values);
    if (isEdit && selected) {
      updateMutation.mutate({ id: selected.id, data: body as never }, {
        onSuccess: () => { addToast("Settings updated.", "success"); onOpenChange(false); },
        onError: (e) => addToast(e.message, "error", "Error"),
      });
    } else {
      createMutation.mutate(body as never, {
        onSuccess: () => { addToast("Settings created.", "success"); onOpenChange(false); },
        onError: (e) => addToast(e.message, "error", "Error"),
      });
    }
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const isActive = watch("is_active");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[780px] w-full rounded-xl border-border p-0 max-h-[88vh] overflow-hidden flex flex-col gap-0">
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-sm font-semibold">
                {isEdit ? "Edit Website Setting" : "New Website Setting"}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                {isEdit ? `Editing: ${selected?.site_name}` : "Configure your website branding, contact, and commerce settings."}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 mr-6">
              <span className="text-xs text-muted-foreground">Active</span>
              <Controller control={control} name="is_active"
                render={({ field }) => (
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} size="sm" />
                )}
              />
              {isActive
                ? <Badge variant="outline" className="text-[10px] h-5 border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20">Live</Badge>
                : <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground">Inactive</Badge>
              }
            </div>
          </div>
        </DialogHeader>

        {/* Body: left nav + right content */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 overflow-hidden min-h-0">
          {/* Left nav */}
          <nav className="w-44 shrink-0 border-r border-border bg-muted/10 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                className={cn(
                  "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-xs font-medium transition-all text-left",
                  activeSection === id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          {/* Right scrollable content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 space-y-8">

              {/* General */}
              <div ref={(el) => { sectionRefs.current["general"] = el; }} data-section="general">
                <SectionHeader icon={Globe} label="General" />
                <div className="space-y-4 mt-4">
                  <Field label="Site Name *" error={errors.site_name?.message}>
                    <Input {...register("site_name")} placeholder="ModFirst Apparel" />
                  </Field>
                  <Field label="Tagline" hint="Short marketing phrase shown under the logo">
                    <Input {...register("site_tagline")} placeholder="Premium Fashion & Custom Designs" />
                  </Field>
                  <Field label="Description" hint="Used in about pages and meta fallbacks">
                    <textarea
                      {...register("site_description")}
                      rows={3}
                      placeholder="Your one-stop shop for modern apparel and custom designs."
                      className="w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm transition-all outline-none placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:opacity-50 dark:bg-input/20 resize-none"
                    />
                  </Field>
                </div>
              </div>

              <Divider />

              {/* Media */}
              <div ref={(el) => { sectionRefs.current["media"] = el; }} data-section="media">
                <SectionHeader icon={ImageIcon} label="Media" />
                <div className="space-y-4 mt-4">
                  <Field label="Logo URL" hint="Main header logo (SVG or PNG recommended)">
                    <Input {...register("logo_url")} placeholder="https://modfirst.com/logo.png" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Favicon URL">
                      <Input {...register("favicon_url")} placeholder="https://modfirst.com/favicon.ico" />
                    </Field>
                    <Field label="Footer Logo URL">
                      <Input {...register("footer_logo_url")} placeholder="https://modfirst.com/footer-logo.png" />
                    </Field>
                  </div>
                </div>
              </div>

              <Divider />

              {/* Theme */}
              <div ref={(el) => { sectionRefs.current["theme"] = el; }} data-section="theme">
                <SectionHeader icon={Palette} label="Theme & Fonts" />
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-3 gap-3">
                    <ColorField label="Primary Color" name="primary_color" control={control} register={register} />
                    <ColorField label="Secondary Color" name="secondary_color" control={control} register={register} />
                    <ColorField label="Accent Color" name="accent_color" control={control} register={register} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Body Font" hint="Used for body text">
                      <Input {...register("font_primary")} placeholder="Inter" />
                    </Field>
                    <Field label="Heading Font" hint="Used for headings">
                      <Input {...register("font_heading")} placeholder="Playfair Display" />
                    </Field>
                  </div>
                </div>
              </div>

              <Divider />

              {/* Contact */}
              <div ref={(el) => { sectionRefs.current["contact"] = el; }} data-section="contact">
                <SectionHeader icon={Phone} label="Contact" />
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Contact Email" error={errors.contact_email?.message}>
                      <Input {...register("contact_email")} type="email" placeholder="info@modfirst.com" />
                    </Field>
                    <Field label="Support Email" error={errors.support_email?.message}>
                      <Input {...register("support_email")} type="email" placeholder="support@modfirst.com" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Phone Number">
                      <Input {...register("contact_phone")} placeholder="+923123456789" />
                    </Field>
                    <Field label="WhatsApp Number">
                      <Input {...register("whatsapp_number")} placeholder="+923123456789" />
                    </Field>
                  </div>
                  <Field label="Address">
                    <Input {...register("address")} placeholder="123 Fashion Street, Karachi, Pakistan" />
                  </Field>
                  <Field label="Business Hours">
                    <Input {...register("business_hours")} placeholder="Mon–Sat: 9:00 AM – 7:00 PM" />
                  </Field>
                </div>
              </div>

              <Divider />

              {/* Social */}
              <div ref={(el) => { sectionRefs.current["social"] = el; }} data-section="social">
                <SectionHeader icon={Share2} label="Social Media" />
                <div className="space-y-4 mt-4">
                  <Field label="Facebook Page URL">
                    <Input {...register("facebook_url")} placeholder="https://facebook.com/modfirst" />
                  </Field>
                  <Field label="Instagram Profile URL">
                    <Input {...register("instagram_url")} placeholder="https://instagram.com/modfirst" />
                  </Field>
                </div>
              </div>

              <Divider />

              {/* Commerce */}
              <div ref={(el) => { sectionRefs.current["commerce"] = el; }} data-section="commerce">
                <SectionHeader icon={ShoppingCart} label="Commerce" />
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Currency Code">
                      <Input {...register("currency")} placeholder="PKR" />
                    </Field>
                    <Field label="Currency Symbol">
                      <Input {...register("currency_symbol")} placeholder="₨" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Tax Rate (%)" hint="Applied at checkout">
                      <Input
                        type="number" step="0.01" min="0" max="100"
                        {...register("tax_percentage", {
                          setValueAs: (v) => (v === "" || v === null) ? null : Number(v),
                        })}
                        placeholder="18"
                      />
                    </Field>
                    <Field label="Free Shipping Threshold" hint="Order total to qualify">
                      <Input
                        type="number" min="0"
                        {...register("free_shipping_threshold", {
                          setValueAs: (v) => (v === "" || v === null) ? null : Number(v),
                        })}
                        placeholder="5000"
                      />
                    </Field>
                  </div>
                </div>
              </div>

              <Divider />

              {/* SEO */}
              <div ref={(el) => { sectionRefs.current["seo"] = el; }} data-section="seo">
                <SectionHeader icon={FileText} label="SEO" />
                <div className="space-y-4 mt-4">
                  <Field label="Meta Title" hint="Shown in browser tab and search results (50–60 chars)">
                    <Input {...register("meta_title")} placeholder="ModFirst Apparel – Best Custom Clothing" />
                  </Field>
                  <Field label="Meta Description" hint="Search snippet description (120–160 chars)">
                    <textarea
                      {...register("meta_description")}
                      rows={3}
                      placeholder="Shop premium quality clothes and custom designs at ModFirst Apparel."
                      className="w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm transition-all outline-none placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:opacity-50 dark:bg-input/20 resize-none"
                    />
                  </Field>
                </div>
              </div>

              {/* Bottom padding */}
              <div className="h-2" />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/10 shrink-0">
          <p className="text-[11px] text-muted-foreground">
            {isEdit ? "Changes will update immediately after saving." : "All fields except Site Name are optional."}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              onClick={handleSubmit(onSubmit)}
            >
              {isPending
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />{isEdit ? "Saving..." : "Creating..."}</>
                : isEdit
                  ? <><CheckCircle2 className="h-3.5 w-3.5" />Save Changes</>
                  : <><Plus className="h-3.5 w-3.5" />Create Setting</>
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">{label}</h3>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border" />;
}

/* ══════════════════════════════════════
   PAGE
══════════════════════════════════════ */
export default function WebsiteSettingsPage() {
  const { canCreate, canEdit } = usePermissions("website-settings");
  const { data, isLoading, isError, refetch, isFetching } = useWebsiteSettingsQuery();

  const [isOpenForm, setIsOpenForm] = useState(false);
  const [selected, setSelected] = useState<WebsiteSetting | null>(null);

  const payload = data?.payload as WebsiteSetting[] | { data?: WebsiteSetting[] } | undefined;
  const settings: WebsiteSetting[] = (
    Array.isArray(payload) ? payload : (payload as { data?: WebsiteSetting[] } | undefined)?.data
  ) ?? [];

  const columns = useMemo<ColumnDef<WebsiteSetting>[]>(() => [
    {
      accessorKey: "site_name",
      header: "Site",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-muted border border-border flex items-center justify-center shrink-0">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">{row.original.site_name}</p>
            {row.original.site_tagline && (
              <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{row.original.site_tagline}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "contact_email",
      header: "Contact",
      cell: ({ row }) => (
        <div className="text-[11px] text-muted-foreground space-y-0.5">
          {row.original.contact_email && <p>{row.original.contact_email}</p>}
          {row.original.contact_phone && <p>{row.original.contact_phone}</p>}
          {!row.original.contact_email && !row.original.contact_phone && <span className="text-muted-foreground/40">—</span>}
        </div>
      ),
    },
    {
      accessorKey: "currency",
      header: "Currency",
      cell: ({ row }) => row.original.currency ? (
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-foreground">{row.original.currency_symbol}</span>
          <span className="text-xs font-mono text-muted-foreground">{row.original.currency}</span>
        </div>
      ) : <span className="text-muted-foreground/40 text-xs">—</span>,
    },
    {
      accessorKey: "primary_color",
      header: "Brand Colors",
      cell: ({ row }) => {
        const colors = [row.original.primary_color, row.original.secondary_color, row.original.accent_color].filter(Boolean);
        return colors.length > 0 ? (
          <div className="flex items-center gap-1.5">
            {colors.map((c, i) => (
              <span
                key={i}
                className="h-5 w-5 rounded-full border border-border/60 shadow-sm inline-block"
                style={{ backgroundColor: c! }}
                title={c!}
              />
            ))}
          </div>
        ) : <span className="text-muted-foreground/40 text-xs">—</span>;
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => row.original.is_active
        ? <Badge variant="outline" className="text-[10px] h-5 border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20">Active</Badge>
        : <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground">Inactive</Badge>,
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
          <p className="text-xs text-muted-foreground mt-0.5">Manage site branding, contact info, and commerce configuration</p>
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
      />
    </div>
  );
}
