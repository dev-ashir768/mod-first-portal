"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useOrders, useCustomers, useProducts } from "@/hooks/useMockData";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { startOfMonth, endOfMonth, isWithinInterval, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/date-range-picker";

export default function DashboardPage() {
  const { data: orders, isLoading: isLoadingOrders } = useOrders();
  const { data: customers, isLoading: isLoadingCustomers } = useCustomers();
  const { data: products, isLoading: isLoadingProducts } = useProducts();

  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  }));

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  const filteredOrders = useMemo(() => {
    return (
      orders?.filter((o) => {
        if (!dateRange || !dateRange.from) return true;
        const orderDate = new Date(o.createdAt);
        const fromDate = dateRange.from;
        const toDate = dateRange.to || dateRange.from;
        return isWithinInterval(orderDate, { start: fromDate, end: toDate });
      }) || []
    );
  }, [orders, dateRange]);

  const completedOrders = useMemo(() => filteredOrders.filter((o) => o.status === "completed"), [filteredOrders]);
  const totalRevenue = useMemo(() => completedOrders.reduce((sum, o) => sum + o.totalAmount, 0), [completedOrders]);
  const totalOrdersCount = filteredOrders.length;
  const totalCustomersCount = customers?.length || 0;
  const averageOrderValue = useMemo(() => (completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0), [completedOrders, totalRevenue]);

  const salesChartData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) {
      return [
        { date: "May 31", revenue: 500 }, { date: "Jun 01", revenue: 1200 },
        { date: "Jun 02", revenue: 1750 }, { date: "Jun 03", revenue: 2130 },
        { date: "Jun 04", revenue: 2480 }, { date: "Jun 05", revenue: 2610 },
        { date: "Jun 06", revenue: 2610 + totalRevenue }
      ];
    }
    const days: Record<string, number> = {};
    completedOrders.forEach((o) => {
      const dayStr = format(new Date(o.createdAt), "MMM dd");
      days[dayStr] = (days[dayStr] || 0) + o.totalAmount;
    });
    if (Object.keys(days).length === 0) {
      return [
        { date: format(dateRange.from, "MMM dd"), revenue: 0 },
        { date: format(dateRange.to!, "MMM dd"), revenue: 0 }
      ];
    }
    return Object.entries(days)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [completedOrders, dateRange, totalRevenue]);

  const categoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    products?.forEach((p) => {
      const revenue = completedOrders
        .flatMap((o) => o.items)
        .filter((item) => item.id === p.id)
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
      categoryMap[p.category] = (categoryMap[p.category] || 0) + (revenue || p.price * 2);
    });
    return Object.entries(categoryMap).map(([name, value]) => ({ name, sales: parseFloat(value.toFixed(2)) }));
  }, [completedOrders, products]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  const statusColors = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50",
    processing: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50",
    completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50",
    cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50"
  };

  if (isLoadingOrders || isLoadingCustomers || isLoadingProducts) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-72 md:col-span-2 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Analytics and transaction overview</p>
        </div>
        <div className="shrink-0">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Revenue", value: formatCurrency(totalRevenue), sub: "+12.4% from last week", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20", up: true },
          { label: "Sales Orders", value: `+${totalOrdersCount}`, sub: "+8.2% in selected range", icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20", up: true },
          { label: "Active Customers", value: `${totalCustomersCount}`, sub: "+4 new registrations", icon: Users, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/20", up: true },
          { label: "Avg. Order Value", value: formatCurrency(averageOrderValue), sub: "-1.2% checkout size", icon: TrendingUp, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/20", up: false },
        ].map(({ label, value, sub, icon: Icon, color, bg, up }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              <div className={`p-1.5 rounded ${bg} ${color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">{value}</div>
              <div className={`flex items-center gap-0.5 mt-1 text-xs font-medium ${up ? "text-emerald-600" : "text-rose-500"}`}>
                {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span>{sub}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-blue-500" />
              Revenue Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="h-60">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--popover)", borderColor: "var(--border)", color: "var(--foreground)", borderRadius: "6px", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-full w-full rounded" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Package className="h-4 w-4 text-purple-500" />
              Sales by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="h-60">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--popover)", borderColor: "var(--border)", color: "var(--foreground)", borderRadius: "6px", fontSize: "12px" }} />
                  <Bar dataKey="sales" fill="var(--color-primary)" radius={[3, 3, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-full w-full rounded" />}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <ShoppingCart className="h-4 w-4 text-blue-500" />
            Recent Orders
          </CardTitle>
          <Badge variant="outline" className="text-[10px] h-5">Filtered</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                  <th className="px-4 py-2.5 text-xs font-medium">ID</th>
                  <th className="px-3 py-2.5 text-xs font-medium">Customer</th>
                  <th className="px-3 py-2.5 text-xs font-medium">Date</th>
                  <th className="px-3 py-2.5 text-xs font-medium">Amount</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-blue-600">{order.id}</td>
                    <td className="px-3 py-2.5">
                      <div className="text-sm font-medium text-foreground">{order.customerName}</div>
                      <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-3 py-2.5 text-sm font-semibold">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
