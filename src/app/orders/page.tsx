"use client";

import React, { useState, useMemo } from "react";
import { useOrders, useUpdateOrderStatus, useSettings } from "@/hooks/useMockData";
import { Order } from "@/store/useStore";
import { useToast } from "@/store/useToast";
import {
  useReactTable, getCoreRowModel, ColumnDef, flexRender
} from "@tanstack/react-table";
import {
  Search, Eye, ShoppingCart, Calendar, User, Mail,
  Loader2, Clock, CheckCircle2, XCircle, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePermissions } from "@/hooks/usePermissions";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReactSelect } from "@/components/ui/react-select";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FilterStatus = "all" | Order["status"];

const statusColors = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200/50",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200/50"
};

const statusIcons = {
  pending: <Clock className="h-3 w-3 text-amber-500" />,
  processing: <Clock className="h-3 w-3 text-blue-500" />,
  completed: <CheckCircle2 className="h-3 w-3 text-emerald-500" />,
  cancelled: <XCircle className="h-3 w-3 text-rose-500" />
};

export default function OrdersPage() {
  const { canView, canEdit } = usePermissions("orders");
  const { data: orders = [], isLoading } = useOrders();
  const { data: settings } = useSettings();
  const updateStatusMutation = useUpdateOrderStatus();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOpenDetails, setIsOpenDetails] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesTab = activeTab === "all" || o.status === activeTab;
      const matchesSearch =
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, searchQuery]);

  const handleOpenDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsOpenDetails(true);
  };

  const handleStatusChange = (status: Order["status"]) => {
    if (!selectedOrder) return;
    updateStatusMutation.mutate(
      { id: selectedOrder.id, status },
      {
        onSuccess: () => {
          addToast(`Order ${selectedOrder.id} updated to "${status}".`, "success", "Status Updated");
          setSelectedOrder((prev) => (prev ? { ...prev, status } : null));
        },
        onError: () => addToast("Failed to update order status.", "error", "Error")
      }
    );
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: settings?.currency || "USD" }).format(val);

  const taxRate = settings?.taxRate || 8.25;

  const columns = useMemo<ColumnDef<Order>[]>(() => [
    {
      accessorKey: "id",
      header: "Order",
      cell: ({ row }) => <span className="font-mono text-xs text-blue-600">{row.original.id}</span>
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <div className="text-sm font-medium text-foreground">{row.original.customerName}</div>
          <div className="text-xs text-muted-foreground">{row.original.customerEmail}</div>
        </div>
      )
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => {
        const qtySum = row.original.items.reduce((sum, item) => sum + item.quantity, 0);
        return <span className="text-xs text-muted-foreground">{qtySum} item{qtySum !== 1 ? "s" : ""}</span>;
      }
    },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }) => <span className="text-sm font-semibold text-foreground">{formatCurrency(row.original.totalAmount)}</span>
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${statusColors[row.original.status]}`}>
          {statusIcons[row.original.status]}
          <span className="capitalize">{row.original.status}</span>
        </span>
      )
    },
    {
      id: "actions",
      header: () => <span className="text-right block">Action</span>,
      cell: ({ row }) => canView ? (
        <div className="flex justify-end">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:bg-blue-50 hover:text-blue-600" onClick={() => handleOpenDetails(row.original)}>
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">View order</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ) : null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canView, formatCurrency]);

  const table = useReactTable({
    data: filteredOrders,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const orderDetailsBreakdown = useMemo(() => {
    if (!selectedOrder) return { subtotal: 0, tax: 0, total: 0 };
    const subtotal = selectedOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * (taxRate / 100);
    return { subtotal, tax, total: subtotal + tax };
  }, [selectedOrder, taxRate]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Orders</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track and manage customer orders</p>
        </div>
      </div>

      {/* Status tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterStatus)}>
        <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 gap-0.5">
          {(["all", "pending", "processing", "completed", "cancelled"] as FilterStatus[]).map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="px-3 py-2 text-xs font-medium capitalize rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent text-muted-foreground"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="relative max-w-sm">
        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
        <Input
          placeholder="Search by order ID or customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm">Loading orders...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <ShoppingCart className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium text-foreground">No orders found</p>
                <p className="text-xs mt-0.5">Try a different filter or search term.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id} className="bg-muted/40 hover:bg-muted/40">
                      {hg.headers.map((header) => (
                        <TableHead key={header.id} className="px-3 text-xs font-medium text-muted-foreground">
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-3 py-2.5">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isOpenDetails} onOpenChange={setIsOpenDetails}>
        <DialogContent className="sm:max-w-[480px] rounded-lg border-border p-0 max-h-[90vh] flex flex-col">
          <DialogHeader className="px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="font-mono text-[10px] text-blue-600 font-semibold">{selectedOrder?.id}</span>
                <DialogTitle className="text-base font-semibold mt-0.5">Order Details</DialogTitle>
              </div>
              {selectedOrder && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${statusColors[selectedOrder.status]}`}>
                  {statusIcons[selectedOrder.status]}
                  <span className="capitalize">{selectedOrder.status}</span>
                </span>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Customer info */}
            <div className="p-3 rounded-md border border-border bg-muted/20">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2">
                <User className="h-3 w-3" /> Customer
              </p>
              <p className="text-sm font-semibold text-foreground">{selectedOrder?.customerName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Mail className="h-3 w-3" />{selectedOrder?.customerEmail}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                {selectedOrder && new Date(selectedOrder.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            {/* Items */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2">
                <FileText className="h-3 w-3" /> Items
              </p>
              <div className="divide-y divide-border border border-border rounded-md overflow-hidden">
                {selectedOrder?.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center px-3 py-2.5 hover:bg-muted/20">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.quantity} × {formatCurrency(item.price)}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1.5 text-sm">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal</span><span>{formatCurrency(orderDetailsBreakdown.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tax ({taxRate}%)</span><span>{formatCurrency(orderDetailsBreakdown.tax)}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between text-sm font-semibold text-foreground">
                <span>Total</span><span>{formatCurrency(selectedOrder?.totalAmount || 0)}</span>
              </div>
            </div>

            {/* Status update — only for users with edit permission */}
            {canEdit && (
              <div className="p-3 border border-border rounded-md space-y-2">
                <Label htmlFor="order-status" className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Update Status
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <ReactSelect
                    className="flex-1"
                    options={[
                      { value: "pending", label: "Pending" },
                      { value: "processing", label: "Processing" },
                      { value: "completed", label: "Completed" },
                      { value: "cancelled", label: "Cancelled" },
                    ]}
                    value={selectedOrder ? { value: selectedOrder.status, label: selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1) } : null}
                    onChange={(opt) => { if (opt) handleStatusChange((opt as { value: string }).value as Order["status"]); }}
                    isDisabled={updateStatusMutation.isPending}
                    isSearchable={false}
                    inputId="order-status"
                  />
                  {updateStatusMutation.isPending && <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />}
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-border bg-muted/20 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsOpenDetails(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
