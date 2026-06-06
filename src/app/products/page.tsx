"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  useProducts,
  useAddProduct,
  useUpdateProduct,
  useDeleteProduct
} from "@/hooks/useMockData";
import { Product } from "@/store/useStore";
import { productSchema, ProductFormValues } from "@/lib/schema";
import { useToast } from "@/store/useToast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState
} from "@tanstack/react-table";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Package,
  FolderOpen,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function ProductsPage() {
  const { data: products = [], isLoading } = useProducts();
  const addMutation = useAddProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();
  const { addToast } = useToast();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Dialog States
  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form Hooks
  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    setValue: setValueAdd,
    formState: { errors: errorsAdd }
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      price: 0,
      stock: 0,
      category: "",
      status: "active",
      image: ""
    }
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    watch: watchEdit,
    formState: { errors: errorsEdit }
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema)
  });

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return Array.from(set);
  }, [products]);

  // Filter products by category (done before table processing)
  const filteredProducts = useMemo(() => {
    if (categoryFilter === "all") return products;
    return products.filter((p) => p.category.toLowerCase() === categoryFilter.toLowerCase());
  }, [products, categoryFilter]);

  // Handlers
  const handleOpenAdd = () => {
    resetAdd();
    setValueAdd("status", "active");
    setValueAdd("category", "");
    setIsOpenAdd(true);
  };

  const handleOpenEdit = useCallback((product: Product) => {
    setSelectedProduct(product);
    resetEdit({
      name: product.name,
      description: product.description,
      sku: product.sku,
      price: product.price,
      stock: product.stock,
      category: product.category,
      status: product.status,
      image: product.image || ""
    });
    setIsOpenEdit(true);
  }, [resetEdit]);

  const handleOpenDelete = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsOpenDelete(true);
  }, []);

  const onAddSubmit = (values: ProductFormValues) => {
    addMutation.mutate(values, {
      onSuccess: () => {
        addToast(`Product "${values.name}" created successfully.`, "success", "Product Created");
        setIsOpenAdd(false);
        resetAdd();
      },
      onError: () => {
        addToast("Failed to create product. Please try again.", "error", "Operation Failed");
      }
    });
  };

  const onEditSubmit = (values: ProductFormValues) => {
    if (!selectedProduct) return;
    updateMutation.mutate(
      { id: selectedProduct.id, fields: values },
      {
        onSuccess: () => {
          addToast(`Product "${values.name}" updated successfully.`, "success", "Product Updated");
          setIsOpenEdit(false);
        },
        onError: () => {
          addToast("Failed to update product.", "error", "Operation Failed");
        }
      }
    );
  };

  const onDeleteConfirm = () => {
    if (!selectedProduct) return;
    deleteMutation.mutate(selectedProduct.id, {
      onSuccess: () => {
        addToast(`Product "${selectedProduct.name}" has been deleted.`, "success", "Product Deleted");
        setIsOpenDelete(false);
      },
      onError: () => {
        addToast("Failed to delete product.", "error", "Operation Failed");
      }
    });
  };

  // Tanstack Table Config
  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: "image",
        header: "",
        cell: ({ row }) => {
          const imgUrl = row.original.image;
          return (
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-muted border border-border/50 shrink-0 flex items-center justify-center">
              {imgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgUrl} alt={row.original.name} className="h-full w-full object-cover" />
              ) : (
                <Package className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          );
        },
        enableSorting: false
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-foreground font-semibold"
          >
            Name
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="max-w-[200px] sm:max-w-xs">
            <div className="font-bold text-foreground truncate">{row.original.name}</div>
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
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-lg bg-muted border border-border/30">
            <FolderOpen className="h-3 w-3 text-muted-foreground" />
            {row.original.category}
          </span>
        )
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-foreground font-semibold"
          >
            Price
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => {
          const price = parseFloat(row.getValue("price"));
          return <span className="font-bold text-foreground">${price.toFixed(2)}</span>;
        }
      },
      {
        accessorKey: "stock",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-foreground font-semibold"
          >
            Stock
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => {
          const stock = row.original.stock;
          return (
            <div>
              <span className={`font-semibold ${stock === 0 ? "text-rose-500 font-bold" : "text-foreground"}`}>
                {stock} units
              </span>
              {stock === 0 && <span className="text-[10px] block text-rose-500 font-semibold leading-none mt-0.5">Out of Stock</span>}
            </div>
          );
        }
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const map = {
            active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50",
            draft: "bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50",
            archived: "bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200/50"
          };
          return (
            <Badge variant="outline" className={`capitalize font-semibold border ${map[status]}`}>
              {status}
            </Badge>
          );
        }
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2 pr-2">
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-indigo-600 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleOpenDelete(row.original)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-rose-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
        enableSorting: false
      }
    ],
    [handleOpenEdit, handleOpenDelete]
  );

  const table = useReactTable({
    data: filteredProducts,
    columns,
    state: {
      sorting,
      globalFilter
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/20">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Products
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your store products, pricing, stock levels, and status.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="rounded-xl font-medium shadow-md shadow-primary/10">
          <Plus className="h-4.5 w-4.5 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </span>
          <Input
            type="text"
            placeholder="Search products by name or SKU..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 rounded-xl border-border/50 bg-card/40 backdrop-blur-sm focus-visible:ring-1"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || "all")}>
            <SelectTrigger className="w-48 rounded-xl border-border/50 bg-card/40 backdrop-blur-sm">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c.toLowerCase()}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid Container */}
      <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-md overflow-hidden shadow-lg shadow-black/5">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span>Fetching product index...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <Package className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <h3 className="font-bold text-lg text-foreground mb-1">No products found</h3>
              <p className="text-sm">Try relaxing your search terms or filters.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-border/40 bg-muted/20 text-muted-foreground font-semibold">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="p-4 pl-6 first:pl-6 last:pr-6">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border/20">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/10 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4 pl-6 first:pl-6 last:pr-6 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Toolbar */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-border/30 bg-muted/5">
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to{" "}
              <span className="font-semibold text-foreground">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  filteredProducts.length
                )}
              </span>{" "}
              of <span className="font-semibold text-foreground">{filteredProducts.length}</span> products
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8 rounded-lg"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* --- ADD PRODUCT DIALOG --- */}
      <Dialog open={isOpenAdd} onOpenChange={setIsOpenAdd}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl border-border/50">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">Create New Product</DialogTitle>
            <DialogDescription>Input product specifics. Click save to persist.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-4 py-2">
            <div className="grid gap-3">
              <div>
                <Label htmlFor="add-name" className="font-bold">Product Title</Label>
                <Input id="add-name" {...registerAdd("name")} placeholder="e.g. Leather Wallet" className="mt-1" />
                {errorsAdd.name && <p className="text-xs text-rose-500 font-medium mt-1">{errorsAdd.name.message}</p>}
              </div>

              <div>
                <Label htmlFor="add-desc" className="font-bold">Description</Label>
                <Input id="add-desc" {...registerAdd("description")} placeholder="Short description of core features..." className="mt-1" />
                {errorsAdd.description && <p className="text-xs text-rose-500 font-medium mt-1">{errorsAdd.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="add-sku" className="font-bold">SKU Code</Label>
                  <Input id="add-sku" {...registerAdd("sku")} placeholder="e.g. BG-LTH-02" className="mt-1" />
                  {errorsAdd.sku && <p className="text-xs text-rose-500 font-medium mt-1">{errorsAdd.sku.message}</p>}
                </div>
                <div>
                  <Label htmlFor="add-cat" className="font-bold">Category</Label>
                  <Input id="add-cat" {...registerAdd("category")} placeholder="e.g. Accessories" className="mt-1" />
                  {errorsAdd.category && <p className="text-xs text-rose-500 font-medium mt-1">{errorsAdd.category.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="add-price" className="font-bold">Unit Price ($)</Label>
                  <Input id="add-price" type="number" step="0.01" {...registerAdd("price", { valueAsNumber: true })} placeholder="0.00" className="mt-1" />
                  {errorsAdd.price && <p className="text-xs text-rose-500 font-medium mt-1">{errorsAdd.price.message}</p>}
                </div>
                <div>
                  <Label htmlFor="add-stock" className="font-bold">Stock Count</Label>
                  <Input id="add-stock" type="number" {...registerAdd("stock", { valueAsNumber: true })} placeholder="0" className="mt-1" />
                  {errorsAdd.stock && <p className="text-xs text-rose-500 font-medium mt-1">{errorsAdd.stock.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="add-status" className="font-bold">Status</Label>
                  <Select
                    onValueChange={(val) => {
                      if (val) setValueAdd("status", val as "active" | "draft" | "archived");
                    }}
                    defaultValue="active"
                  >
                    <SelectTrigger id="add-status" className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="add-img" className="font-bold">Image URL (Optional)</Label>
                  <Input id="add-img" {...registerAdd("image")} placeholder="https://images..." className="mt-1" />
                  {errorsAdd.image && <p className="text-xs text-rose-500 font-medium mt-1">{errorsAdd.image.message}</p>}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/30 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpenAdd(false)} disabled={addMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending} className="shadow-md shadow-primary/10">
                {addMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Create Product"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- EDIT PRODUCT DIALOG --- */}
      <Dialog open={isOpenEdit} onOpenChange={setIsOpenEdit}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl border-border/50">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">Modify Product</DialogTitle>
            <DialogDescription>Modify fields and click save to apply updates.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4 py-2">
            <div className="grid gap-3">
              <div>
                <Label htmlFor="edit-name" className="font-bold">Product Title</Label>
                <Input id="edit-name" {...registerEdit("name")} placeholder="e.g. Leather Wallet" className="mt-1" />
                {errorsEdit.name && <p className="text-xs text-rose-500 font-medium mt-1">{errorsEdit.name.message}</p>}
              </div>

              <div>
                <Label htmlFor="edit-desc" className="font-bold">Description</Label>
                <Input id="edit-desc" {...registerEdit("description")} placeholder="Short description of core features..." className="mt-1" />
                {errorsEdit.description && <p className="text-xs text-rose-500 font-medium mt-1">{errorsEdit.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-sku" className="font-bold">SKU Code</Label>
                  <Input id="edit-sku" {...registerEdit("sku")} placeholder="e.g. BG-LTH-02" className="mt-1" />
                  {errorsEdit.sku && <p className="text-xs text-rose-500 font-medium mt-1">{errorsEdit.sku.message}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-cat" className="font-bold">Category</Label>
                  <Input id="edit-cat" {...registerEdit("category")} placeholder="e.g. Accessories" className="mt-1" />
                  {errorsEdit.category && <p className="text-xs text-rose-500 font-medium mt-1">{errorsEdit.category.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-price" className="font-bold">Unit Price ($)</Label>
                  <Input id="edit-price" type="number" step="0.01" {...registerEdit("price", { valueAsNumber: true })} placeholder="0.00" className="mt-1" />
                  {errorsEdit.price && <p className="text-xs text-rose-500 font-medium mt-1">{errorsEdit.price.message}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-stock" className="font-bold">Stock Count</Label>
                  <Input id="edit-stock" type="number" {...registerEdit("stock", { valueAsNumber: true })} placeholder="0" className="mt-1" />
                  {errorsEdit.stock && <p className="text-xs text-rose-500 font-medium mt-1">{errorsEdit.stock.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-status" className="font-bold">Status</Label>
                  <Select
                    onValueChange={(val) => {
                      if (val) setValueEdit("status", val as "active" | "draft" | "archived");
                    }}
                    value={watchEdit("status") || "active"}
                  >
                    <SelectTrigger id="edit-status" className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-img" className="font-bold">Image URL (Optional)</Label>
                  <Input id="edit-img" {...registerEdit("image")} placeholder="https://images..." className="mt-1" />
                  {errorsEdit.image && <p className="text-xs text-rose-500 font-medium mt-1">{errorsEdit.image.message}</p>}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/30 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpenEdit(false)} disabled={updateMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} className="shadow-md shadow-primary/10">
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DELETE CONFIRMATION DIALOG --- */}
      <Dialog open={isOpenDelete} onOpenChange={setIsOpenDelete}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-border/50">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="font-black text-lg text-foreground">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to permanently delete{" "}
              <span className="font-bold text-foreground">&quot;{selectedProduct?.name}&quot;</span>? This action is permanent.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2 pt-2 border-t border-border/20 mt-4">
            <Button variant="outline" onClick={() => setIsOpenDelete(false)} disabled={deleteMutation.isPending} className="rounded-lg">
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDeleteConfirm} disabled={deleteMutation.isPending} className="rounded-lg">
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
