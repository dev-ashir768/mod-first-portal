"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Menu as MenuIcon, Plus, Edit2, Trash2, Loader2, AlertTriangle,
  ChevronDown, ChevronRight, Shield, Eye, PenLine, FilePlus, ShieldOff,
  ExternalLink, Globe, Layout,
} from "lucide-react";
import {
  useMenusQuery, useCreateMenuMutation, useUpdateMenuMutation,
  useDeleteMenuMutation, useToggleMenuStatusMutation,
  useMenuRightsQuery, useCreateMenuRightMutation,
  useUpdateMenuRightMutation, useDeleteMenuRightMutation,
  Menu, MenuRight, MenuFormValues, MenuRightFormValues,
  MenuType, LinkType,
} from "@/hooks/useMenus";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/store/useToast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactSelect } from "@/components/ui/react-select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

/* ── Constants ── */
const ROLES = [
  "super_admin", "customer", "admin", "manager", "designer",
  "sales", "support", "content_writer", "production", "accountant",
] as const;

const MENU_TYPES: { value: MenuType; label: string }[] = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
];

const LINK_TYPES: { value: LinkType; label: string }[] = [
  { value: "page", label: "Page" },
  { value: "external_url", label: "External URL" },
  { value: "category", label: "Category" },
  { value: "product", label: "Product" },
  { value: "collection", label: "Collection" },
  { value: "custom", label: "Custom" },
];

/* ── Zod Schemas ── */
const menuSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  menu_type: z.enum(["frontend", "backend"]),
  parent_id: z.number().nullable(),
  sort_order: z.number().min(0),
  icon: z.string(),
  link_type: z.enum(["page", "external_url", "category", "product", "collection", "custom"]),
  link_value: z.string(),
  external_url: z.string(),
  open_in_new_tab: z.boolean(),
  visibility: z.boolean(),
  is_active: z.boolean(),
});

const menuRightSchema = z.object({
  menu_id: z.number().min(1, "Select a menu"),
  role: z.string().min(1, "Select a role"),
  can_view: z.boolean(),
  can_create: z.boolean(),
  can_edit: z.boolean(),
  can_delete: z.boolean(),
});

/* ── Small helpers ── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

function PermToggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <Switch
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      size="sm"
    />
  );
}

/* ══════════════════════════════════════
   MENUS TAB
══════════════════════════════════════ */
function MenusTab() {
  const { canCreate, canEdit, canDelete } = usePermissions("menus");
  const { data, isLoading, isError, refetch, isFetching } = useMenusQuery();
  const createMutation = useCreateMenuMutation();
  const updateMutation = useUpdateMenuMutation();
  const deleteMutation = useDeleteMenuMutation();
  const toggleMutation = useToggleMenuStatusMutation();
  const { addToast } = useToast();

  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [selected, setSelected] = useState<Menu | null>(null);

  const menus: Menu[] = data?.payload?.data ?? [];

  const addForm = useForm<MenuFormValues>({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      name: "", slug: "", menu_type: "backend", parent_id: null, sort_order: 0,
      icon: "", link_type: "page", link_value: "", external_url: "",
      open_in_new_tab: false, visibility: true, is_active: true,
    },
  });

  const editForm = useForm<MenuFormValues>({ resolver: zodResolver(menuSchema) });

  useEffect(() => {
    if (selected && isOpenEdit) {
      editForm.reset({
        name: selected.name,
        slug: selected.slug,
        menu_type: selected.menu_type,
        parent_id: selected.parent_id,
        sort_order: selected.sort_order,
        icon: selected.icon ?? "",
        link_type: selected.link_type,
        link_value: selected.link_value ?? "",
        external_url: selected.external_url ?? "",
        open_in_new_tab: selected.open_in_new_tab,
        visibility: selected.visibility,
        is_active: selected.is_active,
      });
    }
  }, [selected, isOpenEdit, editForm]);

  const onAdd = (values: MenuFormValues) => {
    createMutation.mutate(values, {
      onSuccess: () => { addToast("Menu created.", "success"); setIsOpenAdd(false); addForm.reset(); },
      onError: (e) => addToast(e.message, "error", "Error"),
    });
  };

  const onEdit = (values: MenuFormValues) => {
    if (!selected) return;
    updateMutation.mutate({ id: selected.id, data: values }, {
      onSuccess: () => { addToast("Menu updated.", "success"); setIsOpenEdit(false); },
      onError: (e) => addToast(e.message, "error", "Error"),
    });
  };

  const onDelete = () => {
    if (!selected) return;
    deleteMutation.mutate(selected.id, {
      onSuccess: () => { addToast("Menu deleted.", "success"); setIsOpenDelete(false); setSelected(null); },
      onError: (e) => addToast(e.message, "error", "Error"),
    });
  };

  const onToggle = (menu: Menu) => {
    toggleMutation.mutate({ id: menu.id, is_active: !menu.is_active }, {
      onSuccess: () => addToast(`Menu ${!menu.is_active ? "activated" : "deactivated"}.`, "success"),
      onError: (e) => addToast(e.message, "error", "Error"),
    });
  };

  const menuColumns = useMemo<ColumnDef<Menu>[]>(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.parent_id && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          <div>
            <p className="font-medium text-xs text-foreground">{row.original.name}</p>
            {row.original.icon && <p className="text-[10px] text-muted-foreground">{row.original.icon}</p>}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{row.original.slug}</code>,
    },
    {
      accessorKey: "menu_type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className={`text-[10px] h-5 capitalize ${row.original.menu_type === "backend" ? "border-indigo-200 text-indigo-700 bg-indigo-50 dark:bg-indigo-950/20" : "border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20"}`}>
          {row.original.menu_type === "backend" ? <Layout className="h-2.5 w-2.5 mr-1" /> : <Globe className="h-2.5 w-2.5 mr-1" />}
          {row.original.menu_type}
        </Badge>
      ),
    },
    {
      accessorKey: "link_type",
      header: "Link",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          {row.original.link_type === "external_url" ? <ExternalLink className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          <span className="capitalize">{row.original.link_type.replace("_", " ")}</span>
          {row.original.link_value && <span className="text-foreground">· {row.original.link_value}</span>}
        </div>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <button onClick={() => onToggle(row.original)} disabled={toggleMutation.isPending} className="focus:outline-none">
          {row.original.is_active
            ? <Badge variant="outline" className="text-[10px] h-5 border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 cursor-pointer">Active</Badge>
            : <Badge variant="outline" className="text-[10px] h-5 border-muted text-muted-foreground cursor-pointer">Inactive</Badge>}
        </button>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <TooltipProvider>
          <div className="flex items-center justify-end gap-1">
            {canEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={() => { setSelected(row.original); setIsOpenEdit(true); }}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
            )}
            {canDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20" onClick={() => { setSelected(row.original); setIsOpenDelete(true); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canEdit, canDelete, toggleMutation.isPending]);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">{menus.length} menus total</p>
        {canCreate && (
          <Button size="sm" onClick={() => setIsOpenAdd(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Menu
          </Button>
        )}
      </div>

      {isError && (
        <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
          <AlertTriangle className="h-8 w-8 text-amber-400" />
          <p className="text-sm">Failed to load menus.</p>
        </div>
      )}

      {!isError && (
        <DataTable
          columns={menuColumns}
          data={menus}
          isLoading={isLoading}
          isFetching={isFetching}
          onRefetch={refetch}
          exportFilename="menus"
          searchPlaceholder="Search menus..."
          emptyIcon={<MenuIcon className="h-8 w-8" />}
          emptyText="No menus yet. Create your first menu."
          pageSize={10}
        />
      )}

      {/* ── Add Dialog ── */}
      <MenuFormDialog
        open={isOpenAdd}
        onOpenChange={(v) => { setIsOpenAdd(v); if (!v) addForm.reset(); }}
        title="Add Menu"
        description="Create a new navigation menu item."
        form={addForm}
        onSubmit={onAdd}
        isPending={createMutation.isPending}
        menus={menus}
        submitLabel="Create Menu"
      />

      {/* ── Edit Dialog ── */}
      <MenuFormDialog
        open={isOpenEdit}
        onOpenChange={setIsOpenEdit}
        title="Edit Menu"
        description="Update the menu details below."
        form={editForm}
        onSubmit={onEdit}
        isPending={updateMutation.isPending}
        menus={menus.filter((m) => m.id !== selected?.id)}
        submitLabel="Save Changes"
      />

      {/* ── Delete Dialog ── */}
      <Dialog open={isOpenDelete} onOpenChange={setIsOpenDelete}>
        <DialogContent className="sm:max-w-[360px] rounded-lg border-border p-0">
          <div className="p-5 flex flex-col items-center text-center gap-3">
            <div className="h-11 w-11 rounded-full bg-rose-100 dark:bg-rose-950/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Delete menu?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                <strong className="text-foreground">&quot;{selected?.name}&quot;</strong> will be permanently removed.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-border bg-muted/20">
            <Button variant="outline" size="sm" onClick={() => setIsOpenDelete(false)} disabled={deleteMutation.isPending}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={onDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Deleting...</> : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ── Menu Form Dialog (shared for Add/Edit) ── */
function MenuFormDialog({ open, onOpenChange, title, description, form, onSubmit, isPending, menus, submitLabel }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  onSubmit: (v: MenuFormValues) => void;
  isPending: boolean;
  menus: Menu[];
  submitLabel: string;
}) {
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = form;
  const linkType: LinkType = watch("link_type");
  const menuType: MenuType = watch("menu_type");

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-lg border-border p-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-4 py-3 border-b border-border bg-muted/30 shrink-0">
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-[11px] text-muted-foreground">{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Menu Name *" error={errors.name?.message}>
                <Input {...register("name")} placeholder="e.g. Dashboard"
                  onChange={(e) => {
                    register("name").onChange(e);
                    setValue("slug", autoSlug(e.target.value));
                  }}
                />
              </Field>
              <Field label="Slug *" error={errors.slug?.message}>
                <Input {...register("slug")} placeholder="e.g. dashboard" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Menu Type *" error={errors.menu_type?.message}>
                <Controller control={control} name="menu_type"
                  render={({ field }) => (
                    <ReactSelect
                      options={MENU_TYPES}
                      value={MENU_TYPES.find((o) => o.value === field.value) ?? null}
                      onChange={(opt) => field.onChange((opt as { value: string })?.value)}
                      isSearchable={false}
                    />
                  )}
                />
              </Field>
              <Field label="Sort Order">
                <Input type="number" {...register("sort_order", { valueAsNumber: true })} placeholder="0" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Link Type *" error={errors.link_type?.message}>
                <Controller control={control} name="link_type"
                  render={({ field }) => (
                    <ReactSelect
                      options={LINK_TYPES}
                      value={LINK_TYPES.find((o) => o.value === field.value) ?? null}
                      onChange={(opt) => field.onChange((opt as { value: string })?.value)}
                      isSearchable={false}
                    />
                  )}
                />
              </Field>
              <Field label="Icon (Lucide name)">
                <Input {...register("icon")} placeholder="e.g. home" />
              </Field>
            </div>

            {(linkType === "page" || linkType === "custom" || linkType === "collection") && (
              <Field label="Link Value">
                <Input {...register("link_value")} placeholder="e.g. /home" />
              </Field>
            )}

            {linkType === "external_url" && (
              <Field label="External URL">
                <Input {...register("external_url")} placeholder="https://..." />
              </Field>
            )}

            {menus.length > 0 && (
              <Field label="Parent Menu">
                <Controller control={control} name="parent_id"
                  render={({ field }) => (
                    <ReactSelect
                      options={[{ value: null, label: "None (top-level)" }, ...menus.map((m) => ({ value: m.id, label: m.name }))]}
                      value={field.value === null
                        ? { value: null, label: "None (top-level)" }
                        : menus.find((m) => m.id === field.value)
                          ? { value: field.value, label: menus.find((m) => m.id === field.value)!.name }
                          : null}
                      onChange={(opt) => field.onChange((opt as { value: number | null })?.value ?? null)}
                      isSearchable
                    />
                  )}
                />
              </Field>
            )}

            {/* Toggles */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              {[
                { name: "is_active" as const, label: "Active" },
                { name: "visibility" as const, label: "Visible" },
                { name: "open_in_new_tab" as const, label: "New Tab" },
              ].map(({ name, label }) => (
                <Controller key={name} control={control} name={name}
                  render={({ field }) => (
                    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 bg-muted/20">
                      <span className="text-xs font-medium">{label}</span>
                      <PermToggle checked={!!field.value} onChange={field.onChange} />
                    </div>
                  )}
                />
              ))}
            </div>

            {/* Hidden — menuType just tracked to show conditional fields */}
            {menuType && null}
          </div>

          <div className="flex justify-end gap-2 px-4 py-3 border-t border-border bg-muted/20 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />{submitLabel === "Create Menu" ? "Creating..." : "Saving..."}</> : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════
   MENU RIGHTS TAB
══════════════════════════════════════ */
function MenuRightsTab() {
  const { canCreate, canEdit, canDelete } = usePermissions("menus");
  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [selectedRight, setSelectedRight] = useState<MenuRight | null>(null);

  const { data: menuData, isLoading: menusLoading } = useMenusQuery();
  const { data: rightsData, isLoading: rightsLoading } = useMenuRightsQuery(selectedRole);
  const createMutation = useCreateMenuRightMutation();
  const updateMutation = useUpdateMenuRightMutation();
  const deleteMutation = useDeleteMenuRightMutation();
  const { addToast } = useToast();

  const menus: Menu[] = menuData?.payload?.data ?? [];
  const rights: MenuRight[] = rightsData?.payload?.data ?? [];

  const addForm = useForm<MenuRightFormValues>({
    resolver: zodResolver(menuRightSchema),
    defaultValues: { menu_id: 0, role: selectedRole, can_view: true, can_create: false, can_edit: false, can_delete: false },
  });

  useEffect(() => {
    addForm.setValue("role", selectedRole);
  }, [selectedRole, addForm]);

  // Map rights by menu_id for quick lookup
  const rightsMap = new Map<number, MenuRight>(rights.map((r) => [r.menu_id, r]));

  const onPermChange = (right: MenuRight, key: keyof Pick<MenuRight, "can_view" | "can_create" | "can_edit" | "can_delete">, value: boolean) => {
    updateMutation.mutate(
      { id: right.id, data: { [key]: value } },
      { onError: (e) => addToast(e.message, "error", "Error") }
    );
  };

  const onAdd = (values: MenuRightFormValues) => {
    createMutation.mutate(values, {
      onSuccess: () => { addToast("Menu right created.", "success"); setIsOpenAdd(false); addForm.reset(); },
      onError: (e) => addToast(e.message, "error", "Error"),
    });
  };

  const onDelete = () => {
    if (!selectedRight) return;
    deleteMutation.mutate(selectedRight.id, {
      onSuccess: () => { addToast("Menu right removed.", "success"); setIsOpenDelete(false); setSelectedRight(null); },
      onError: (e) => addToast(e.message, "error", "Error"),
    });
  };

  const roleOptions = ROLES.map((r) => ({ value: r, label: r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) }));

  const isLoading = menusLoading || rightsLoading;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 flex-1 max-w-xs">
          <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <ReactSelect
              options={roleOptions}
              value={roleOptions.find((o) => o.value === selectedRole) ?? null}
              onChange={(opt) => setSelectedRole((opt as { value: string })?.value ?? "admin")}
              isSearchable={false}
              placeholder="Select role..."
            />
          </div>
        </div>
        {canCreate && (
          <Button size="sm" onClick={() => setIsOpenAdd(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Right
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      )}

      {!isLoading && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="px-4 text-xs font-semibold text-muted-foreground">Menu</TableHead>
                    <TableHead className="px-3 text-xs font-semibold text-muted-foreground text-center">
                      <div className="flex items-center justify-center gap-1"><Eye className="h-3 w-3" />View</div>
                    </TableHead>
                    <TableHead className="px-3 text-xs font-semibold text-muted-foreground text-center">
                      <div className="flex items-center justify-center gap-1"><FilePlus className="h-3 w-3" />Create</div>
                    </TableHead>
                    <TableHead className="px-3 text-xs font-semibold text-muted-foreground text-center">
                      <div className="flex items-center justify-center gap-1"><PenLine className="h-3 w-3" />Edit</div>
                    </TableHead>
                    <TableHead className="px-3 text-xs font-semibold text-muted-foreground text-center">
                      <div className="flex items-center justify-center gap-1"><Trash2 className="h-3 w-3" />Delete</div>
                    </TableHead>
                    <TableHead className="px-3 text-xs font-semibold text-muted-foreground text-right">Remove</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rights.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                        <ShieldOff className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        No rights assigned to <strong>{selectedRole.replace(/_/g, " ")}</strong> yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {rights.map((right, idx) => {
                    const menu = menus.find((m) => m.id === right.menu_id);
                    const isPending = updateMutation.isPending && updateMutation.variables?.id === right.id;
                    return (
                      <TableRow key={right.id} className={`last:border-0 ${idx % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <TableCell className="px-4 py-2.5">
                          <div>
                            <p className="text-xs font-medium text-foreground">{menu?.name ?? `Menu #${right.menu_id}`}</p>
                            {menu && <p className="text-[10px] text-muted-foreground capitalize">{menu.menu_type}</p>}
                          </div>
                        </TableCell>
                        {(["can_view", "can_create", "can_edit", "can_delete"] as const).map((key) => (
                          <TableCell key={key} className="px-3 py-2.5 text-center">
                            <div className="flex justify-center">
                              <PermToggle
                                checked={right[key]}
                                onChange={(v) => onPermChange(right, key, v)}
                                disabled={isPending || !canEdit}
                              />
                            </div>
                          </TableCell>
                        ))}
                        <TableCell className="px-3 py-2.5 text-right">
                          {canDelete && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost" size="icon-sm"
                                    className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20"
                                    onClick={() => { setSelectedRight(right); setIsOpenDelete(true); }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remove right</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Add Right Dialog ── */}
      <Dialog open={isOpenAdd} onOpenChange={(v) => { setIsOpenAdd(v); if (!v) addForm.reset(); }}>
        <DialogContent className="sm:max-w-[400px] rounded-lg border-border p-0">
          <DialogHeader className="px-4 py-3 border-b border-border bg-muted/30">
            <DialogTitle className="text-sm font-semibold">Add Menu Right</DialogTitle>
            <DialogDescription className="text-[11px] text-muted-foreground">
              Assign menu access permissions to a role.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={addForm.handleSubmit(onAdd)}>
            <div className="p-4 space-y-3">
              <Field label="Menu *" error={addForm.formState.errors.menu_id?.message}>
                <Controller control={addForm.control} name="menu_id"
                  render={({ field }) => (
                    <ReactSelect
                      options={menus
                        .filter((m) => !rightsMap.has(m.id))
                        .map((m) => ({ value: m.id, label: m.name }))}
                      value={field.value ? { value: field.value, label: menus.find((m) => m.id === field.value)?.name ?? "" } : null}
                      onChange={(opt) => field.onChange((opt as { value: number })?.value)}
                      placeholder="Select menu..."
                      isSearchable
                    />
                  )}
                />
              </Field>

              <Field label="Role *" error={addForm.formState.errors.role?.message}>
                <Controller control={addForm.control} name="role"
                  render={({ field }) => (
                    <ReactSelect
                      options={roleOptions}
                      value={roleOptions.find((o) => o.value === field.value) ?? null}
                      onChange={(opt) => field.onChange((opt as { value: string })?.value)}
                      isSearchable={false}
                    />
                  )}
                />
              </Field>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { name: "can_view" as const, label: "Can View", icon: Eye },
                  { name: "can_create" as const, label: "Can Create", icon: FilePlus },
                  { name: "can_edit" as const, label: "Can Edit", icon: PenLine },
                  { name: "can_delete" as const, label: "Can Delete", icon: Trash2 },
                ].map(({ name, label, icon: Icon }) => (
                  <Controller key={name} control={addForm.control} name={name}
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 bg-muted/20">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Icon className="h-3 w-3 text-muted-foreground" />{label}
                        </div>
                        <PermToggle checked={!!field.value} onChange={field.onChange} />
                      </div>
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 px-4 py-3 border-t border-border bg-muted/20">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsOpenAdd(false)} disabled={createMutation.isPending}>Cancel</Button>
              <Button type="submit" size="sm" disabled={createMutation.isPending}>
                {createMutation.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Adding...</> : "Add Right"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <Dialog open={isOpenDelete} onOpenChange={setIsOpenDelete}>
        <DialogContent className="sm:max-w-[340px] rounded-lg border-border p-0">
          <div className="p-5 flex flex-col items-center text-center gap-3">
            <div className="h-11 w-11 rounded-full bg-rose-100 dark:bg-rose-950/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Remove menu right?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                This will revoke all permissions for this menu from <strong>{selectedRole.replace(/_/g, " ")}</strong>.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-border bg-muted/20">
            <Button variant="outline" size="sm" onClick={() => setIsOpenDelete(false)} disabled={deleteMutation.isPending}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={onDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Removing...</> : "Remove"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ══════════════════════════════════════
   PAGE
══════════════════════════════════════ */
export default function MenusPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Menus & Access Rights</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage navigation menus and role-based access permissions</p>
        </div>
      </div>

      <Tabs defaultValue="menus" className="w-full">
        <TabsList className="bg-muted/60 border border-border p-0.5 h-8 rounded-md">
          <TabsTrigger value="menus" className="text-xs h-7 rounded flex items-center gap-1.5 px-3">
            <MenuIcon className="h-3.5 w-3.5" /> Menus
          </TabsTrigger>
          <TabsTrigger value="rights" className="text-xs h-7 rounded flex items-center gap-1.5 px-3">
            <Shield className="h-3.5 w-3.5" /> Menu Rights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="menus" className="mt-4 focus-visible:outline-none">
          <MenusTab />
        </TabsContent>

        <TabsContent value="rights" className="mt-4 focus-visible:outline-none">
          <MenuRightsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
