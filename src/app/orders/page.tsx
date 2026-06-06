"use client";

import React, { useState, useMemo } from "react";
import { useOrders, useUpdateOrderStatus, useSettings } from "@/hooks/useMockData";
import { Order } from "@/store/useStore";
import { useToast } from "@/store/useToast";
import {
  Search,
  Eye,
  ShoppingCart,
  Calendar,
  User,
  Mail,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FilterStatus = "all" | Order["status"];

export default function OrdersPage() {
  const { data: orders = [], isLoading: isLoadingOrders } = useOrders();
  const { data: settings } = useSettings();
  const updateStatusMutation = useUpdateOrderStatus();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOpenDetails, setIsOpenDetails] = useState(false);

  // Filter & Search Logic
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
          addToast(`Order ${selectedOrder.id} status updated to "${status}".`, "success", "Status Updated");
          // Refresh details dialog view
          setSelectedOrder((prev) => (prev ? { ...prev, status } : null));
        },
        onError: () => {
          addToast("Failed to update order status.", "error", "Operation Failed");
        }
      }
    );
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: settings?.currency || "USD"
    }).format(val);
  };

  const statusIcons = {
    pending: <Clock className="h-4 w-4 text-amber-500" />,
    processing: <Clock className="h-4 w-4 text-indigo-500" />,
    completed: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    cancelled: <XCircle className="h-4 w-4 text-rose-500" />
  };

  const statusColors = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50",
    processing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-200/50",
    completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50",
    cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200/50"
  };

  // Tax breakdowns based on order items
  const taxRate = settings?.taxRate || 8.25;
  
  const orderDetailsBreakdown = useMemo(() => {
    if (!selectedOrder) return { subtotal: 0, tax: 0, total: 0 };
    const subtotal = selectedOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [selectedOrder, taxRate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/20">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Orders
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track customer checkouts, update processing states, and view billing details.
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex overflow-x-auto pb-1 gap-1 border-b border-border/20 max-w-full">
        {(["all", "pending", "processing", "completed", "cancelled"] as FilterStatus[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-xl capitalize transition-all shrink-0 ${
              activeTab === tab
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </span>
        <Input
          type="text"
          placeholder="Search by order ID or customer details..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 rounded-xl border-border/50 bg-card/40 backdrop-blur-sm focus-visible:ring-1"
        />
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-md overflow-hidden shadow-lg shadow-black/5">
        <div className="overflow-x-auto">
          {isLoadingOrders ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span>Fetching transaction index...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <h3 className="font-bold text-lg text-foreground mb-1">No orders found</h3>
              <p className="text-sm">No transactions match your current query.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-semibold">
                  <th className="p-4 pl-6">ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Order Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredOrders.map((order) => {
                  const qtySum = order.items.reduce((sum, item) => sum + item.quantity, 0);
                  return (
                    <tr key={order.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 pl-6 font-mono font-medium text-xs text-indigo-500">{order.id}</td>
                      <td className="p-4">
                        <div className="font-semibold text-foreground">{order.customerName}</div>
                        <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                      </td>
                      <td className="p-4 text-muted-foreground font-medium">
                        {qtySum} {qtySum === 1 ? "item" : "items"}
                      </td>
                      <td className="p-4 font-bold text-foreground">{formatCurrency(order.totalAmount)}</td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            statusColors[order.status]
                          }`}
                        >
                          {statusIcons[order.status]}
                          <span className="capitalize">{order.status}</span>
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetails(order)}
                          className="h-8 rounded-lg text-xs"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- ORDER DETAILS DIALOG --- */}
      <Dialog open={isOpenDetails} onOpenChange={setIsOpenDetails}>
        <DialogContent className="sm:max-w-[540px] rounded-2xl border-border/50 overflow-hidden p-0 max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 pb-4 border-b border-border/20 bg-muted/20">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-mono text-xs text-indigo-500 font-semibold">{selectedOrder?.id}</span>
                <DialogTitle className="font-black text-xl">Order Receipt</DialogTitle>
              </div>
              {selectedOrder && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                    statusColors[selectedOrder.status]
                  }`}
                >
                  {statusIcons[selectedOrder.status]}
                  <span className="capitalize">{selectedOrder.status}</span>
                </span>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Customer metadata Card */}
            <div className="grid gap-3 p-4 rounded-xl border border-border/40 bg-card/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Customer Details
              </h4>
              <div className="text-sm font-semibold text-foreground">{selectedOrder?.customerName}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 leading-none">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {selectedOrder?.customerEmail}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 leading-none mt-1">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Placed:{" "}
                {selectedOrder &&
                  new Date(selectedOrder.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
              </div>
            </div>

            {/* Receipt Item List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Purchased Items
              </h4>
              <div className="divide-y divide-border/20 border border-border/40 rounded-xl overflow-hidden bg-card/30">
                {selectedOrder?.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3.5 hover:bg-muted/5">
                    <div className="min-w-0 pr-4">
                      <div className="font-semibold text-sm text-foreground truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {item.quantity} x {formatCurrency(item.price)}
                      </div>
                    </div>
                    <div className="font-bold text-sm text-foreground shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial breakdown */}
            <div className="p-4 rounded-xl border border-border/40 bg-muted/10 space-y-2.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(orderDetailsBreakdown.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tax Rate ({taxRate}%)</span>
                <span>{formatCurrency(orderDetailsBreakdown.tax)}</span>
              </div>
              <div className="h-px bg-border/40 my-1" />
              <div className="flex justify-between text-sm font-bold text-foreground">
                <span>Order Total</span>
                <span>{formatCurrency(selectedOrder?.totalAmount || 0)}</span>
              </div>
            </div>

            {/* Administrative Update selector */}
            <div className="space-y-2.5 p-4 border border-indigo-500/20 bg-indigo-500/5 rounded-xl">
              <Label htmlFor="order-status-update" className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Administrative State Controls
              </Label>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex-1">
                  <Select
                    value={selectedOrder?.status}
                    onValueChange={(val) => {
                      if (val) handleStatusChange(val as Order["status"]);
                    }}
                    disabled={updateStatusMutation.isPending}
                  >
                    <SelectTrigger id="order-status-update" className="rounded-lg bg-card border-border/50">
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {updateStatusMutation.isPending && (
                  <Loader2 className="h-5 w-5 text-indigo-500 animate-spin shrink-0" />
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border/20 bg-muted/10 flex justify-end">
            <Button onClick={() => setIsOpenDetails(false)} className="rounded-xl font-medium">
              Close Receipt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
