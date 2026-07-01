"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useProducts, useAddProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useMockData";
import { Product } from "@/store/useStore";
import { productSchema, ProductFormValues } from "@/lib/schema";
import { useToast } from "@/store/useToast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import {
  Plus, Edit2, Trash2, Package, FolderOpen, ArrowUpDown,
  Loader2, AlertTriangle,
} from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReactSelect } from "@/components/ui/react-select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileUpload } from "@/components/ui/file-upload";
import { usePermissions } from "@/hooks/usePermissions";
import { DataTable } from "@/components/ui/data-table";

const statusMap = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50",
  draft: "bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50",
  archived: "bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200/50"
};

export default function ProductsPage() {
  const { canCreate, canEdit, canDelete } = usePermissions("products");
  const { data: products = [], isLoading } = useProducts();
  const addMutation = useAddProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();
  const { addToast } = useToast();

  const [categoryFilter, setCategoryFilter] = useState("all");

  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { register: registerAdd, handleSubmit: handleSubmitAdd, reset: resetAdd, setValue: setValueAdd, watch: watchAdd, formState: { errors: errorsAdd } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", description: "", sku: "", price: 0, stock: 0, category: "", status: "active", image: "" }
  });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setValueEdit, watch: watchEdit, formState: { errors: errorsEdit } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema)
  });

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);

  const filteredProducts = useMemo(() => {
    if (categoryFilter === "all") return products;
    return products.filter((p) => p.category.toLowerCase() === categoryFilter.toLowerCase());
  }, [products, categoryFilter]);

  const handleOpenAdd = () => {
    resetAdd();
    setValueAdd("status", "active");
    setValueAdd("category", "");
    setIsOpenAdd(true);
  };

  const handleOpenEdit = useCallback((product: Product) => {
    setSelectedProduct(product);
    resetEdit({ name: product.name, description: product.description, sku: product.sku, price: product.price, stock: product.stock, category: product.category, status: product.status, image: product.image || "" });
    setIsOpenEdit(true);
  }, [resetEdit]);

  const handleOpenDelete = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsOpenDelete(true);
  }, []);

  const onAddSubmit = (values: ProductFormValues) => {
    addMutation.mutate(values, {
      onSuccess: () => { addToast(`"${values.name}" created.`, "success", "Product Created"); setIsOpenAdd(false); resetAdd(); },
      onError: () => addToast("Failed to create product.", "error", "Error")
    });
  };

  const onEditSubmit = (values: ProductFormValues) => {
    if (!selectedProduct) return;
    updateMutation.mutate({ id: selectedProduct.id, fields: values }, {
      onSuccess: () => { addToast(`"${values.name}" updated.`, "success", "Updated"); setIsOpenEdit(false); },
      onError: () => addToast("Failed to update product.", "error", "Error")
    });
  };

  const onDeleteConfirm = () => {
    if (!selectedProduct) return;
    deleteMutation.mutate(selectedProduct.id, {
      onSuccess: () => { addToast(`"${selectedProduct.name}" deleted.`, "success", "Deleted"); setIsOpenDelete(false); },
      onError: () => addToast("Failed to delete product.", "error", "Error")
    });
  };

  const columns = useMemo<ColumnDef<Product>[]>(() => [
    {
      accessorKey: "image",
      header: "",
      cell: ({ row }) => {
        const imgUrl = row.original.image;
        return (
          <div className="h-8 w-8 rounded overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
            {imgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgUrl} alt={row.original.name} className="h-full w-full object-cover" />
            ) : (
              <Package className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        );
      },
      enableSorting: false
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="h-auto p-0 font-medium text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name <ArrowUpDown className="h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="max-w-[180px]">
          <div className="text-sm font-medium text-foreground truncate">{row.original.name}</div>
          <div className="text-xs text-muted-foreground truncate">{row.original.description}</div>
        </div>
      )
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.sku}</span>
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground">
          <FolderOpen className="h-2.5 w-2.5" />{row.original.category}
        </span>
      )
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="h-auto p-0 font-medium text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Price <ArrowUpDown className="h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => <span className="text-sm font-semibold">${parseFloat(row.getValue("price")).toFixed(2)}</span>
    },
    {
      accessorKey: "stock",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="h-auto p-0 font-medium text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Stock <ArrowUpDown className="h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const stock = row.original.stock;
        return (
          <div>
            <span className={`text-sm font-medium ${stock === 0 ? "text-rose-500" : "text-foreground"}`}>{stock}</span>
            {stock === 0 && <span className="block text-[10px] text-rose-500 font-semibold leading-none">Out of stock</span>}
          </div>
        );
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={`capitalize text-[10px] border h-5 ${statusMap[row.original.status]}`}>
          {row.original.status}
        </Badge>
      )
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center justify-end gap-0.5 pr-1">
            {canEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={() => handleOpenEdit(row.original)} className="text-muted-foreground hover:bg-blue-50 hover:text-blue-600">
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Edit product</TooltipContent>
              </Tooltip>
            )}
            {canDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={() => handleOpenDelete(row.original)} className="text-muted-foreground hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Delete product</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      ),
      enableSorting: false
    }
  ], [handleOpenEdit, handleOpenDelete, canEdit, canDelete]);


  /* ---- compact form fields shared helper ---- */
  const Field = ({ error, label, children }: { error?: string; label: string; children: React.ReactNode }) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Products</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage pricing, stock levels, and status</p>
        </div>
        {canCreate && (
          <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 shrink-0">
            <Plus className="h-3.5 w-3.5" /> Add Product
          </Button>
        )}
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        isLoading={isLoading}
        exportFilename="products"
        searchPlaceholder="Search products..."
        emptyIcon={<Package className="h-8 w-8" />}
        emptyText="No products found. Try a different category."
        pageSize={10}
        toolbar={
          <ReactSelect
            className="w-44"
            options={[
              { value: "all", label: "All Categories" },
              ...categories.map((c) => ({ value: c.toLowerCase(), label: c }))
            ]}
            value={{ value: categoryFilter, label: categoryFilter === "all" ? "All Categories" : categories.find(c => c.toLowerCase() === categoryFilter) || categoryFilter }}
            onChange={(opt) => setCategoryFilter((opt as { value: string })?.value || "all")}
            placeholder="All Categories"
            isSearchable={false}
          />
        }
      />

      {/* ADD Dialog */}
      <Dialog open={isOpenAdd} onOpenChange={setIsOpenAdd}>
        <DialogContent className="sm:max-w-[440px] rounded-lg border-border p-0">
          <DialogHeader className="px-4 py-3 border-b border-border bg-muted/30">
            <DialogTitle className="text-base font-semibold">Add Product</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Fill in the product details below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAdd(onAddSubmit)} className="p-4 space-y-3">
            <Field label="Product Name" error={errorsAdd.name?.message}>
              <Input {...registerAdd("name")} placeholder="e.g. DTF Transfer Sheet" />
            </Field>
            <Field label="Description" error={errorsAdd.description?.message}>
              <Input {...registerAdd("description")} placeholder="Short product description" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="SKU" error={errorsAdd.sku?.message}>
                <Input {...registerAdd("sku")} placeholder="SKU-001" />
              </Field>
              <Field label="Category" error={errorsAdd.category?.message}>
                <Input {...registerAdd("category")} placeholder="e.g. DTF" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price ($)" error={errorsAdd.price?.message}>
                <Input type="number" step="0.01" {...registerAdd("price", { valueAsNumber: true })} placeholder="0.00" />
              </Field>
              <Field label="Stock" error={errorsAdd.stock?.message}>
                <Input type="number" {...registerAdd("stock", { valueAsNumber: true })} placeholder="0" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Status">
                <ReactSelect
                  options={[
                    { value: "active", label: "Active" },
                    { value: "draft", label: "Draft" },
                    { value: "archived", label: "Archived" },
                  ]}
                  defaultValue={{ value: "active", label: "Active" }}
                  onChange={(opt) => { if (opt) setValueAdd("status", (opt as { value: string }).value as "active" | "draft" | "archived"); }}
                  isSearchable={false}
                />
              </Field>
              <Field label="Product Image" error={errorsAdd.image?.message}>
                <FileUpload
                  value={watchAdd("image")}
                  onChange={(url) => setValueAdd("image", url, { shouldValidate: true })}
                  folder="products"
                  disabled={addMutation.isPending}
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 -mx-4 -mb-4 border-t border-border bg-muted/20 mt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsOpenAdd(false)} disabled={addMutation.isPending}>Cancel</Button>
              <Button type="submit" size="sm" disabled={addMutation.isPending}>
                {addMutation.isPending ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</> : "Create Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT Dialog */}
      <Dialog open={isOpenEdit} onOpenChange={setIsOpenEdit}>
        <DialogContent className="sm:max-w-[440px] rounded-lg border-border p-0">
          <DialogHeader className="px-4 py-3 border-b border-border bg-muted/30">
            <DialogTitle className="text-base font-semibold">Edit Product</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Update the product details below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onEditSubmit)} className="p-4 space-y-3">
            <Field label="Product Name" error={errorsEdit.name?.message}>
              <Input {...registerEdit("name")} placeholder="e.g. DTF Transfer Sheet" />
            </Field>
            <Field label="Description" error={errorsEdit.description?.message}>
              <Input {...registerEdit("description")} placeholder="Short product description" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="SKU" error={errorsEdit.sku?.message}>
                <Input {...registerEdit("sku")} placeholder="SKU-001" />
              </Field>
              <Field label="Category" error={errorsEdit.category?.message}>
                <Input {...registerEdit("category")} placeholder="e.g. DTF" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price ($)" error={errorsEdit.price?.message}>
                <Input type="number" step="0.01" {...registerEdit("price", { valueAsNumber: true })} placeholder="0.00" />
              </Field>
              <Field label="Stock" error={errorsEdit.stock?.message}>
                <Input type="number" {...registerEdit("stock", { valueAsNumber: true })} placeholder="0" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Status">
                <ReactSelect
                  options={[
                    { value: "active", label: "Active" },
                    { value: "draft", label: "Draft" },
                    { value: "archived", label: "Archived" },
                  ]}
                  value={{ value: watchEdit("status") || "active", label: watchEdit("status") ? watchEdit("status").charAt(0).toUpperCase() + watchEdit("status").slice(1) : "Active" }}
                  onChange={(opt) => { if (opt) setValueEdit("status", (opt as { value: string }).value as "active" | "draft" | "archived"); }}
                  isSearchable={false}
                />
              </Field>
              <Field label="Product Image" error={errorsEdit.image?.message}>
                <FileUpload
                  value={watchEdit("image")}
                  onChange={(url) => setValueEdit("image", url, { shouldValidate: true })}
                  folder="products"
                  disabled={updateMutation.isPending}
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 -mx-4 -mb-4 border-t border-border bg-muted/20 mt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsOpenEdit(false)} disabled={updateMutation.isPending}>Cancel</Button>
              <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</> : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE Dialog */}
      <Dialog open={isOpenDelete} onOpenChange={setIsOpenDelete}>
        <DialogContent className="sm:max-w-[360px] rounded-lg border-border p-0">
          <div className="p-4 flex flex-col items-center text-center">
            <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-950/20 flex items-center justify-center text-rose-600 mb-3">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Delete product?</h3>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">
              <strong className="text-foreground">&quot;{selectedProduct?.name}&quot;</strong> will be permanently removed. This cannot be undone.
            </p>
          </div>
          <DialogFooter className="px-4 py-3 border-t border-border bg-muted/20 flex gap-2 sm:justify-center">
            <Button variant="outline" size="sm" onClick={() => setIsOpenDelete(false)} disabled={deleteMutation.isPending}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={onDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Deleting...</> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
