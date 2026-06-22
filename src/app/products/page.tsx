"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useProducts, useAddProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useMockData";
import { Product } from "@/store/useStore";
import { productSchema, ProductFormValues } from "@/lib/schema";
import { useToast } from "@/store/useToast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel,
  getPaginationRowModel, ColumnDef, flexRender, SortingState, ColumnFiltersState, VisibilityState
} from "@tanstack/react-table";
import {
  Search, Plus, Edit2, Trash2, Package, FolderOpen, ArrowUpDown,
  ChevronLeft, ChevronRight, Loader2, AlertTriangle, Download, RefreshCw, Filter
} from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const statusMap = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50",
  draft: "bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50",
  archived: "bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200/50"
};

export default function ProductsPage() {
  const { data: products = [], isLoading } = useProducts();
  const addMutation = useAddProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();
  const { addToast } = useToast();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [showColumnFilters, setShowColumnFilters] = useState(false);

  const isFiltered = globalFilter !== "" || categoryFilter !== "all" || columnFilters.length > 0;

  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { register: registerAdd, handleSubmit: handleSubmitAdd, reset: resetAdd, setValue: setValueAdd, formState: { errors: errorsAdd } } = useForm<ProductFormValues>({
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
        <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="flex items-center gap-1 hover:text-foreground font-medium">
          Name <ArrowUpDown className="h-3 w-3" />
        </button>
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
        <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="flex items-center gap-1 hover:text-foreground font-medium">
          Price <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => <span className="text-sm font-semibold">${parseFloat(row.getValue("price")).toFixed(2)}</span>
    },
    {
      accessorKey: "stock",
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="flex items-center gap-1 hover:text-foreground font-medium">
          Stock <ArrowUpDown className="h-3 w-3" />
        </button>
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
        <div className="flex items-center justify-end gap-1 pr-1">
          <button onClick={() => handleOpenEdit(row.original)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-blue-600 transition-colors">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => handleOpenDelete(row.original)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-rose-600 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
      enableSorting: false
    }
  ], [handleOpenEdit, handleOpenDelete]);

  const exportToCSV = () => {
    const headers = ["ID", "Name", "SKU", "Category", "Price", "Stock", "Status"];
    const rows = table.getFilteredRowModel().rows.map(row => {
      const p = row.original;
      return [p.id, p.name, p.sku, p.category, p.price, p.stock, p.status];
    });
    const csvContent = [headers.join(","), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `products_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const table = useReactTable({
    data: filteredProducts,
    columns,
    state: { sorting, globalFilter, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } }
  });

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
        <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 shrink-0">
          <Plus className="h-3.5 w-3.5" /> Add Product
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
          <Input placeholder="Search products..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-8" />
        </div>

        <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || "all")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => setShowColumnFilters(!showColumnFilters)} className={`gap-1.5 ${showColumnFilters ? "bg-primary/10 border-primary/40 text-foreground" : ""}`}>
          <Filter className="h-3.5 w-3.5" />Filters
        </Button>

        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={() => { setGlobalFilter(""); setCategoryFilter("all"); setColumnFilters([]); }} className="gap-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20">
            <RefreshCw className="h-3.5 w-3.5" />Clear
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-1.5 ml-auto">
          <Download className="h-3.5 w-3.5" />Export
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm">Loading products...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <Package className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium text-foreground">No products found</p>
                <p className="text-xs mt-0.5">Try relaxing your filters.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <React.Fragment key={hg.id}>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                        {hg.headers.map((header) => (
                          <th key={header.id} className="px-3 py-2.5 text-xs font-medium first:pl-4 last:pr-4 select-none">
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                      {showColumnFilters && (
                        <tr className="border-b border-border bg-muted/20">
                          {hg.headers.map((header) => {
                            const colId = header.column.id;
                            return (
                              <th key={`f-${colId}`} className="px-3 py-1.5 first:pl-4 last:pr-4">
                                {colId === "image" || colId === "actions" ? null : colId === "category" || colId === "status" ? (
                                  <select
                                    value={(header.column.getFilterValue() as string) ?? ""}
                                    onChange={(e) => header.column.setFilterValue(e.target.value || undefined)}
                                    className="h-7 w-full text-xs bg-card border border-border rounded px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                  >
                                    <option value="">All</option>
                                    {colId === "category"
                                      ? categories.map((c) => <option key={c} value={c}>{c}</option>)
                                      : ["active", "draft", "archived"].map((s) => <option key={s} value={s}>{s}</option>)
                                    }
                                  </select>
                                ) : (
                                  <Input
                                    placeholder={`Filter...`}
                                    value={(header.column.getFilterValue() as string) ?? ""}
                                    onChange={(e) => header.column.setFilterValue(e.target.value)}
                                    className="h-7 text-xs"
                                  />
                                )}
                              </th>
                            );
                          })}
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </thead>
                <tbody className="divide-y divide-border">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-2.5 first:pl-4 last:pr-4 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && filteredProducts.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-border bg-muted/20">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  <span className="font-medium text-foreground">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span>–
                  <span className="font-medium text-foreground">{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredProducts.length)}</span>
                  {" "}of <span className="font-medium text-foreground">{filteredProducts.length}</span>
                </span>
                <div className="flex items-center gap-1.5 border-l border-border pl-3">
                  Show
                  <select
                    value={table.getState().pagination.pageSize}
                    onChange={(e) => table.setPageSize(Number(e.target.value))}
                    className="h-6 bg-card border border-border rounded px-1.5 text-foreground focus:outline-none text-xs cursor-pointer"
                  >
                    {[8, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="h-7 gap-0.5 px-2">
                  <ChevronLeft className="h-3.5 w-3.5" />Prev
                </Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="h-7 gap-0.5 px-2">
                  Next<ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                <Select onValueChange={(val) => { if (val) setValueAdd("status", val as "active" | "draft" | "archived"); }} defaultValue="active">
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Image URL" error={errorsAdd.image?.message}>
                <Input {...registerAdd("image")} placeholder="https://..." />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
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
                <Select onValueChange={(val) => { if (val) setValueEdit("status", val as "active" | "draft" | "archived"); }} value={watchEdit("status") || "active"}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Image URL" error={errorsEdit.image?.message}>
                <Input {...registerEdit("image")} placeholder="https://..." />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
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
