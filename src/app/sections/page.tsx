"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  LayoutDashboard, Plus, Edit2, Trash2, Loader2, AlertTriangle,
  Layers, Palette, ListOrdered, GripVertical, X, ChevronDown, ChevronUp,
  ImageIcon, Link2, Tag, ArrowUpDown,
} from "lucide-react";
import {
  useHomeSectionsQuery, useCreateHomeSectionMutation,
  useUpdateHomeSectionMutation, useManageSectionItemsMutation,
  HomeSection, HomeSectionItem, HomeSectionItemInput,
} from "@/hooks/useHomeSections";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/store/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ReactSelect } from "@/components/ui/react-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/* ── Layout types ── */
const LAYOUT_TYPES = [
  { value: "hero", label: "Hero" },
  { value: "carousel", label: "Carousel" },
  { value: "grid", label: "Grid" },
  { value: "banner", label: "Banner" },
  { value: "list", label: "List" },
  { value: "feature", label: "Feature" },
  { value: "testimonial", label: "Testimonial" },
  { value: "custom", label: "Custom" },
];

/* ── Schema ── */
const sectionSchema = z.object({
  section_key: z.string().min(1, "Section key is required").regex(/^[a-z0-9_]+$/, "Lowercase, numbers, underscores only"),
  section_name: z.string().min(1, "Section name is required"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  background_image: z.string().optional(),
  background_color: z.string().optional(),
  layout_type: z.string().optional(),
  sort_order: z.number().min(0),
  is_active: z.boolean(),
  section_settings_raw: z.string().optional(), // JSON string for section_settings
});

type SectionFormValues = z.infer<typeof sectionSchema>;

const itemSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().optional(),
  mobile_image_url: z.string().optional(),
  badge: z.string().optional(),
  button_text: z.string().optional(),
  button_url: z.string().optional(),
  secondary_button_text: z.string().optional(),
  secondary_button_url: z.string().optional(),
  link_url: z.string().optional(),
  icon: z.string().optional(),
  sort_order: z.number().min(0),
  is_active: z.boolean(),
});

type ItemFormValues = z.infer<typeof itemSchema>;

/* ── Helpers ── */
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

function autoKey(name: string) {
  return name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function cleanObj(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === "" || v === undefined || v === null) continue;
    out[k] = v;
  }
  return out;
}

const SECTION_NAV = [
  { id: "general", label: "General", icon: Layers },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "items", label: "Items", icon: ListOrdered },
] as const;
type SectionNav = (typeof SECTION_NAV)[number]["id"];

const EMPTY_SECTION: SectionFormValues = {
  section_key: "", section_name: "", title: "", subtitle: "", description: "",
  background_image: "", background_color: "#1e40af",
  layout_type: "hero", sort_order: 1, is_active: true, section_settings_raw: "",
};

function toFormValues(s: HomeSection): SectionFormValues {
  return {
    section_key: s.section_key,
    section_name: s.section_name,
    title: s.title ?? "",
    subtitle: s.subtitle ?? "",
    description: s.description ?? "",
    background_image: s.background_image ?? "",
    background_color: s.background_color ?? "#1e40af",
    layout_type: s.layout_type ?? "hero",
    sort_order: s.sort_order ?? 1,
    is_active: s.is_active,
    section_settings_raw: s.section_settings ? JSON.stringify(s.section_settings, null, 2) : "",
  };
}

/* ══════════════════════════════════════
   ITEM FORM (inline accordion)
══════════════════════════════════════ */
function ItemForm({
  item,
  index,
  onSave,
  onDelete,
  isNew = false,
  isPending,
}: {
  item: Partial<HomeSectionItem> & { _tempId?: string };
  index: number;
  onSave: (values: ItemFormValues) => void;
  onDelete: () => void;
  isNew?: boolean;
  isPending?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(isNew);

  const { register, handleSubmit, control, formState: { errors } } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: item.title ?? "",
      subtitle: item.subtitle ?? "",
      description: item.description ?? "",
      image_url: item.image_url ?? "",
      mobile_image_url: item.mobile_image_url ?? "",
      badge: item.badge ?? "",
      button_text: item.button_text ?? "",
      button_url: item.button_url ?? "",
      secondary_button_text: item.secondary_button_text ?? "",
      secondary_button_url: item.secondary_button_url ?? "",
      link_url: item.link_url ?? "",
      icon: item.icon ?? "",
      sort_order: item.sort_order ?? index + 1,
      is_active: item.is_active ?? true,
    },
  });

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Accordion header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors select-none"
        onClick={() => setIsOpen((o) => !o)}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{item.title || `Item ${index + 1}`}</p>
          {item.badge && (
            <span className="text-[10px] text-muted-foreground">{item.badge}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {item.is_active !== false
            ? <Badge variant="outline" className="text-[9px] h-4 border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20">Active</Badge>
            : <Badge variant="outline" className="text-[9px] h-4 text-muted-foreground">Inactive</Badge>
          }
          <Button
            type="button" variant="ghost" size="icon-xs"
            className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <X className="h-3 w-3" />
          </Button>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </div>

      {/* Accordion body */}
      {isOpen && (
        <form onSubmit={handleSubmit(onSave)} className="border-t border-border p-3 space-y-3 bg-muted/10">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title" error={errors.title?.message}>
              <Input {...register("title")} placeholder="Summer Collection" />
            </Field>
            <Field label="Subtitle">
              <Input {...register("subtitle")} placeholder="Flat 50% Off" />
            </Field>
          </div>
          <Field label="Description">
            <Input {...register("description")} placeholder="Limited time deal" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Image URL">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Input {...register("image_url")} placeholder="https://..." className="text-xs" />
              </div>
            </Field>
            <Field label="Mobile Image URL">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Input {...register("mobile_image_url")} placeholder="https://..." className="text-xs" />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Badge">
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Input {...register("badge")} placeholder="HOT" className="text-xs" />
              </div>
            </Field>
            <Field label="Button Text">
              <Input {...register("button_text")} placeholder="Shop Now" />
            </Field>
            <Field label="Button URL">
              <div className="flex items-center gap-2">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Input {...register("button_url")} placeholder="/shop" className="text-xs" />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Secondary Button Text">
              <Input {...register("secondary_button_text")} placeholder="Learn More" />
            </Field>
            <Field label="Secondary Button URL">
              <Input {...register("secondary_button_url")} placeholder="/about" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Link URL">
              <Input {...register("link_url")} placeholder="/page" />
            </Field>
            <Field label="Icon">
              <Input {...register("icon")} placeholder="star" />
            </Field>
            <Field label="Sort Order">
              <Input type="number" {...register("sort_order", { valueAsNumber: true })} />
            </Field>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Active</span>
              <Controller control={control} name="is_active"
                render={({ field }) => (
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} size="sm" />
                )}
              />
            </div>
            <Button type="submit" size="xs" disabled={isPending}>
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {isNew ? "Add Item" : "Save Item"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   SECTION FORM DIALOG
══════════════════════════════════════ */
type LocalItem = Partial<HomeSectionItem> & { _tempId: string; _isNew?: boolean };

function SectionFormDialog({
  open, onOpenChange, selected,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selected: HomeSection | null;
}) {
  const isEdit = !!selected;
  const createMutation = useCreateHomeSectionMutation();
  const updateMutation = useUpdateHomeSectionMutation();
  const manageItemsMutation = useManageSectionItemsMutation();
  const { addToast } = useToast();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [activeNav, setActiveNav] = useState<SectionNav>("general");
  const [localItems, setLocalItems] = useState<LocalItem[]>([]);
  const [settingsError, setSettingsError] = useState<string>("");

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);

  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: EMPTY_SECTION,
  });

  const isActive = useWatch({ control, name: "is_active" });

  useEffect(() => {
    if (open) {
      reset(selected ? toFormValues(selected) : EMPTY_SECTION);
    }
  }, [open, selected, reset]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      setLocalItems(
        selected?.items.map((it) => ({ ...it, _tempId: String(it.id) })) ?? []
      );
      setSettingsError("");
    });
    return () => cancelAnimationFrame(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reset active nav
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => setActiveNav("general"));
    return () => cancelAnimationFrame(id);
  }, [open]);

  // Scroll spy
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const container = scrollRef.current;
      if (!container) return;
      const onScroll = () => {
        if (isProgrammaticScroll.current) return;
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollTop + clientHeight >= scrollHeight - 8) {
          setActiveNav(SECTION_NAV[SECTION_NAV.length - 1].id);
          return;
        }
        let current: SectionNav = SECTION_NAV[0].id;
        for (const { id } of SECTION_NAV) {
          const el = sectionRefs.current[id];
          if (el && el.offsetTop <= scrollTop + clientHeight * 0.3) current = id;
        }
        setActiveNav(current);
      };
      container.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => container.removeEventListener("scroll", onScroll);
    }, 100);
    return () => clearTimeout(timer);
  }, [open]);

  const scrollToNav = (id: SectionNav) => {
    const container = scrollRef.current;
    const el = sectionRefs.current[id];
    if (!container || !el) return;
    setActiveNav(id);
    isProgrammaticScroll.current = true;
    container.scrollTo({ top: el.offsetTop - 16, behavior: "smooth" });
    setTimeout(() => { isProgrammaticScroll.current = false; }, 700);
  };

  // Add new empty item slot
  const addItem = () => {
    setLocalItems((prev) => [
      ...prev,
      { _tempId: `new_${Date.now()}`, _isNew: true, is_active: true, sort_order: prev.length + 1 },
    ]);
  };

  // Save item (create mode: just update local state; edit mode: call API)
  const saveItem = (tempId: string, values: ItemFormValues) => {
    const existingItem = localItems.find((it) => it._tempId === tempId);
    const clean = cleanObj(values as unknown as Record<string, unknown>);

    if (isEdit && selected) {
      const action: HomeSectionItemInput = existingItem?.id
        ? { _action: "update", id: existingItem.id, ...clean }
        : { _action: "add", ...clean };

      manageItemsMutation.mutate(
        { sectionId: selected.id, items: [action] },
        {
          onSuccess: (res) => {
            addToast("Item saved.", "success");
            // Refresh local items from response
            setLocalItems(
              res.payload.items?.map((it) => ({ ...it, _tempId: String(it.id) })) ?? []
            );
          },
          onError: (e) => addToast(e.message, "error", "Error"),
        }
      );
    } else {
      // Create mode: update local state
      setLocalItems((prev) =>
        prev.map((it) =>
          it._tempId === tempId ? { ...it, ...values, _isNew: false } : it
        )
      );
    }
  };

  // Delete item
  const deleteItem = (tempId: string) => {
    const item = localItems.find((it) => it._tempId === tempId);
    if (isEdit && selected && item?.id) {
      manageItemsMutation.mutate(
        { sectionId: selected.id, items: [{ _action: "delete", id: item.id }] },
        {
          onSuccess: () => {
            addToast("Item removed.", "success");
            setLocalItems((prev) => prev.filter((it) => it._tempId !== tempId));
          },
          onError: (e) => addToast(e.message, "error", "Error"),
        }
      );
    } else {
      setLocalItems((prev) => prev.filter((it) => it._tempId !== tempId));
    }
  };

  const onSubmit = (values: SectionFormValues) => {
    // Validate JSON settings
    let section_settings: Record<string, unknown> | undefined;
    if (values.section_settings_raw?.trim()) {
      try {
        section_settings = JSON.parse(values.section_settings_raw);
        setSettingsError("");
      } catch {
        setSettingsError("Invalid JSON in section settings");
        return;
      }
    }

    const base = cleanObj({
      section_key: values.section_key,
      section_name: values.section_name,
      title: values.title,
      subtitle: values.subtitle,
      description: values.description,
      background_image: values.background_image,
      background_color: values.background_color,
      layout_type: values.layout_type,
      sort_order: values.sort_order,
      is_active: values.is_active,
    });
    if (section_settings) base.section_settings = section_settings;

    if (isEdit && selected) {
      updateMutation.mutate(
        { id: selected.id, data: base },
        {
          onSuccess: () => { addToast("Section updated.", "success"); onOpenChange(false); },
          onError: (e) => addToast(e.message, "error", "Error"),
        }
      );
    } else {
      // Include items for create
      const items = localItems
        .filter((it) => it.title || it.image_url)
        .map((it) => cleanObj({
          title: it.title,
          subtitle: it.subtitle,
          description: it.description,
          image_url: it.image_url,
          mobile_image_url: it.mobile_image_url,
          badge: it.badge,
          button_text: it.button_text,
          button_url: it.button_url,
          secondary_button_text: it.secondary_button_text,
          secondary_button_url: it.secondary_button_url,
          link_url: it.link_url,
          icon: it.icon,
          sort_order: it.sort_order ?? 1,
          is_active: it.is_active ?? true,
        }));
      if (items.length) base.items = items;

      createMutation.mutate(base, {
        onSuccess: () => { addToast("Section created.", "success"); onOpenChange(false); },
        onError: (e) => addToast(e.message, "error", "Error"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] w-full rounded-xl border-border p-0 max-h-[88vh] overflow-hidden flex flex-col gap-0">
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-sm font-semibold">
                {isEdit ? "Edit Home Section" : "New Home Section"}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                {isEdit ? `Editing: ${selected?.section_name}` : "Create a new homepage section with items."}
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

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 overflow-hidden min-h-0">
          {/* Left nav */}
          <nav className="w-40 shrink-0 border-r border-border bg-muted/10 py-3 px-2 flex flex-col gap-0.5">
            {SECTION_NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToNav(id)}
                className={cn(
                  "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-xs font-medium transition-all text-left",
                  activeNav === id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
                {id === "items" && localItems.length > 0 && (
                  <span className="ml-auto text-[10px] bg-muted rounded px-1 text-muted-foreground">{localItems.length}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Right content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 space-y-8">

              {/* General */}
              <div ref={(el) => { sectionRefs.current["general"] = el; }} data-section="general">
                <SectionHeader icon={Layers} label="General" />
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Section Name *" error={errors.section_name?.message}>
                      <Input
                        {...register("section_name", {
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                            setValue("section_key", autoKey(e.target.value), { shouldValidate: false }),
                        })}
                        placeholder="Hero Banner"
                      />
                    </Field>
                    <Field label="Section Key *" error={errors.section_key?.message}>
                      <Input {...register("section_key")} placeholder="hero_banner" className="font-mono text-xs" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Layout Type">
                      <Controller control={control} name="layout_type"
                        render={({ field }) => (
                          <ReactSelect
                            options={LAYOUT_TYPES}
                            value={LAYOUT_TYPES.find((o) => o.value === field.value) ?? null}
                            onChange={(opt) => field.onChange((opt as { value: string })?.value)}
                            isSearchable={false}
                            placeholder="Select layout..."
                          />
                        )}
                      />
                    </Field>
                    <Field label="Sort Order">
                      <Input type="number" min={0} {...register("sort_order", { valueAsNumber: true })} />
                    </Field>
                  </div>
                  <Field label="Title">
                    <Input {...register("title")} placeholder="Welcome to ModFirst Apparel" />
                  </Field>
                  <Field label="Subtitle">
                    <Input {...register("subtitle")} placeholder="Premium Custom Fashion" />
                  </Field>
                  <Field label="Description">
                    <textarea
                      {...register("description")}
                      rows={3}
                      placeholder="Discover the best clothing collection..."
                      className="w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm transition-all outline-none placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:opacity-50 dark:bg-input/20 resize-none"
                    />
                  </Field>
                </div>
              </div>

              <Divider />

              {/* Appearance */}
              <div ref={(el) => { sectionRefs.current["appearance"] = el; }} data-section="appearance">
                <SectionHeader icon={Palette} label="Appearance" />
                <div className="space-y-4 mt-4">
                  <Field label="Background Image URL">
                    <Input {...register("background_image")} placeholder="https://modfirst.com/hero-bg.jpg" />
                  </Field>
                  <Field label="Background Color">
                    <Controller control={control} name="background_color"
                      render={({ field }) => (
                        <div className="flex gap-2 items-center">
                          <label className="relative cursor-pointer shrink-0">
                            <span
                              className="h-9 w-9 rounded-lg border border-input flex items-center justify-center overflow-hidden shadow-sm"
                              style={{ backgroundColor: field.value || "#1e40af" }}
                            />
                            <input
                              type="color"
                              value={field.value || "#1e40af"}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                          </label>
                          <Input
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder="#1e40af"
                            className="font-mono text-xs"
                          />
                        </div>
                      )}
                    />
                  </Field>
                  <Field
                    label="Section Settings (JSON)"
                    hint="Additional configuration as JSON object"
                    error={settingsError}
                  >
                    <textarea
                      {...register("section_settings_raw")}
                      rows={5}
                      placeholder={'{\n  "autoplay": true,\n  "interval": 5000,\n  "show_arrows": true\n}'}
                      className="w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 text-xs font-mono shadow-sm transition-all outline-none placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:opacity-50 dark:bg-input/20 resize-none"
                    />
                  </Field>
                </div>
              </div>

              <Divider />

              {/* Items */}
              <div ref={(el) => { sectionRefs.current["items"] = el; }} data-section="items">
                <div className="flex items-center justify-between">
                  <SectionHeader icon={ListOrdered} label="Items" />
                  <Button type="button" size="xs" variant="outline" onClick={addItem}>
                    <Plus className="h-3 w-3 mr-1" /> Add Item
                  </Button>
                </div>

                {localItems.length === 0 ? (
                  <div className="mt-4 border border-dashed border-border rounded-lg py-8 text-center">
                    <ListOrdered className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No items yet. Click &ldquo;Add Item&rdquo; to start.</p>
                  </div>
                ) : (
                  <div className="space-y-2 mt-4">
                    {localItems.map((item, idx) => (
                      <ItemForm
                        key={item._tempId}
                        item={item}
                        index={idx}
                        isNew={item._isNew}
                        isPending={manageItemsMutation.isPending}
                        onSave={(values) => saveItem(item._tempId, values)}
                        onDelete={() => deleteItem(item._tempId)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="h-2" />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/10 shrink-0">
          <p className="text-[11px] text-muted-foreground">
            {isEdit
              ? "Section details saved on Save. Item changes are applied immediately."
              : "Items will be created together with the section."}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending} onClick={handleSubmit(onSubmit)}>
              {isPending
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />{isEdit ? "Saving..." : "Creating..."}</>
                : isEdit ? "Save Section" : <><Plus className="h-3.5 w-3.5" />Create Section</>
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
export default function HomeSectionsPage() {
  const { canCreate, canEdit, canDelete } = usePermissions("home-sections");
  const { data, isLoading, isError, refetch, isFetching } = useHomeSectionsQuery();
  const { addToast } = useToast();

  const [isOpenForm, setIsOpenForm] = useState(false);
  const [selected, setSelected] = useState<HomeSection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HomeSection | null>(null);

  const sections: HomeSection[] = Array.isArray(data?.payload) ? data.payload : [];

  const LAYOUT_COLORS: Record<string, string> = {
    hero: "border-violet-200 text-violet-700 bg-violet-50 dark:bg-violet-950/20",
    carousel: "border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-950/20",
    grid: "border-indigo-200 text-indigo-700 bg-indigo-50 dark:bg-indigo-950/20",
    banner: "border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950/20",
    feature: "border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20",
    testimonial: "border-pink-200 text-pink-700 bg-pink-50 dark:bg-pink-950/20",
  };

  const columns = useMemo<ColumnDef<HomeSection>[]>(() => [
    {
      accessorKey: "sort_order",
      header: () => <div className="flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Order</div>,
      size: 70,
      cell: ({ row }) => (
        <span className="text-xs font-mono text-muted-foreground">{row.original.sort_order}</span>
      ),
    },
    {
      accessorKey: "section_name",
      header: "Section",
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-medium text-foreground">{row.original.section_name}</p>
          <code className="text-[10px] text-muted-foreground bg-muted px-1 rounded">{row.original.section_key}</code>
        </div>
      ),
    },
    {
      accessorKey: "layout_type",
      header: "Layout",
      cell: ({ row }) => {
        const type = row.original.layout_type ?? "custom";
        return (
          <Badge variant="outline" className={cn("text-[10px] h-5 capitalize", LAYOUT_COLORS[type] ?? "border-muted text-muted-foreground")}>
            {type}
          </Badge>
        );
      },
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <p className="text-xs text-muted-foreground truncate max-w-[160px]">
          {row.original.title ?? <span className="opacity-40">—</span>}
        </p>
      ),
    },
    {
      id: "items_count",
      header: "Items",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium">{row.original.items?.length ?? 0}</span>
          <span className="text-[10px] text-muted-foreground">items</span>
        </div>
      ),
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
      cell: ({ row }) => (
        <div className="flex justify-end">
          <TooltipProvider>
            <div className="flex items-center gap-1">
              {canEdit && (
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
              )}
              {canDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost" size="icon-sm"
                      className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20"
                      onClick={() => setDeleteTarget(row.original)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canEdit, canDelete]);

  void addToast; // used inside dialog
  void deleteTarget; // delete dialog TODO

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Sections</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage page sections and their content items</p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={() => { setSelected(null); setIsOpenForm(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New Section
          </Button>
        )}
      </div>

      {isError && (
        <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
          <AlertTriangle className="h-8 w-8 text-amber-400" />
          <p className="text-sm">Failed to load home sections.</p>
        </div>
      )}

      {!isError && (
        <DataTable
          columns={columns}
          data={sections}
          isLoading={isLoading}
          isFetching={isFetching}
          onRefetch={refetch}
          exportFilename="home-sections"
          searchPlaceholder="Search sections..."
          emptyIcon={<LayoutDashboard className="h-8 w-8" />}
          emptyText="No home sections yet. Create your first one."
          pageSize={10}
        />
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-[360px] rounded-lg border-border p-0">
          <div className="p-5 flex flex-col items-center text-center gap-3">
            <div className="h-11 w-11 rounded-full bg-rose-100 dark:bg-rose-950/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Delete section?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                <strong className="text-foreground">{deleteTarget?.section_name}</strong> and all its items will be permanently removed.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-border bg-muted/20">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => {
              // TODO: wire delete API (common/delete) when needed
              setDeleteTarget(null);
            }}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SectionFormDialog
        open={isOpenForm}
        onOpenChange={setIsOpenForm}
        selected={selected}
      />
    </div>
  );
}
