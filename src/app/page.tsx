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
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  // Filter orders by date range
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

  const completedOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status === "completed");
  }, [filteredOrders]);

  // Dynamic calculations
  const totalRevenue = useMemo(() => {
    return completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  }, [completedOrders]);

  const totalOrdersCount = filteredOrders.length;
  const totalCustomersCount = customers?.length || 0;
  
  const averageOrderValue = useMemo(() => {
    return completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
  }, [completedOrders, totalRevenue]);

  // Chart Data 1: Dynamic Sales Revenue Over Time grouped by day in interval
  const salesChartData = useMemo(() => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      // Fallback
      return [
        { date: "May 31", revenue: 500 },
        { date: "Jun 01", revenue: 1200 },
        { date: "Jun 02", revenue: 1750 },
        { date: "Jun 03", revenue: 2130 },
        { date: "Jun 04", revenue: 2480 },
        { date: "Jun 05", revenue: 2610 },
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
        { date: format(dateRange.to, "MMM dd"), revenue: 0 }
      ];
    }

    return Object.entries(days)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [completedOrders, dateRange, totalRevenue]);

  // Chart Data 2: Sales by Category
  const categoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    products?.forEach((p) => {
      const revenue = completedOrders
        .flatMap((o) => o.items)
        .filter((item) => item.id === p.id)
        .reduce((sum, item) => sum + item.price * item.quantity, 0);

      categoryMap[p.category] = (categoryMap[p.category] || 0) + (revenue || p.price * 2);
    });

    return Object.entries(categoryMap).map(([name, value]) => ({
      name,
      sales: parseFloat(value.toFixed(2))
    }));
  }, [completedOrders, products]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(val);
  };

  const statusColors = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50",
    processing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200/50",
    completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50",
    cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50"
  };

  if (isLoadingOrders || isLoadingCustomers || isLoadingProducts) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[350px] md:col-span-2 rounded-2xl" />
          <Skeleton className="h-[350px] rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/20">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time analytics and transaction overviews.
          </p>
        </div>
        <div className="shrink-0">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-border/40 bg-card/40 backdrop-blur-md hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{formatCurrency(totalRevenue)}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-500 font-semibold">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>+12.4% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-card/40 backdrop-blur-md hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sales Orders</CardTitle>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">+{totalOrdersCount}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-indigo-500 font-semibold">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>+8.2% in selected range</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-card/40 backdrop-blur-md hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Customers</CardTitle>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{totalCustomersCount}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-purple-500 font-semibold">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>+4 new registrations</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-card/40 backdrop-blur-md hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Order Value</CardTitle>
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{formatCurrency(averageOrderValue)}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-rose-500 font-semibold">
              <ArrowDownRight className="h-3.5 w-3.5" />
              <span>-1.2% checkout size</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphs Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Sales Area Chart */}
        <Card className="rounded-2xl border-border/40 bg-card/40 backdrop-blur-md md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              Revenue Growth Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      borderRadius: "12px"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-primary, #6366f1)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-full w-full rounded-xl" />
            )}
          </CardContent>
        </Card>

        {/* Category breakdown Bar Chart */}
        <Card className="rounded-2xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-500" />
              Sales by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      borderRadius: "12px"
                    }}
                  />
                  <Bar dataKey="sales" fill="var(--color-primary, #8b5cf6)" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-full w-full rounded-xl" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity / Orders Table */}
      <Card className="rounded-2xl border-border/40 bg-card/40 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-indigo-500" />
            Recent Orders
          </CardTitle>
          <Badge variant="outline" className="border-border/60">
            Filtered List
          </Badge>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-semibold">
                <th className="p-4 pl-6">ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Date</th>
                <th className="p-4">Amount</th>
                <th className="p-4 pr-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredOrders.slice(0, 4).map((order) => (
                <tr key={order.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 pl-6 font-mono font-medium text-xs text-indigo-500">{order.id}</td>
                  <td className="p-4">
                    <div className="font-semibold text-foreground">{order.customerName}</div>
                    <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                  </td>
                  <td className="p-4 text-muted-foreground text-xs">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </td>
                  <td className="p-4 font-bold text-foreground">{formatCurrency(order.totalAmount)}</td>
                  <td className="p-4 pr-6 text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        statusColors[order.status]
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
