"use client";

import React, { useState, useMemo } from "react";
import { useCustomers, useSettings } from "@/hooks/useMockData";
import { Search, Users, Calendar, Mail, Loader2, DollarSign, Award, Sparkles, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomersPage() {
  const { data: customers = [], isLoading } = useCustomers();
  const { data: settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: settings?.currency || "USD" }).format(val);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase();

  const avgSpending = useMemo(() => {
    if (!customers.length) return 0;
    return customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length;
  }, [customers]);

  const topCustomer = useMemo(() => {
    if (!customers.length) return null;
    return [...customers].sort((a, b) => b.totalSpent - a.totalSpent)[0];
  }, [customers]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Customers</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Browse registered shoppers and lifetime value</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Customers</CardTitle>
            <div className="p-1.5 rounded bg-purple-50 dark:bg-purple-950/20 text-purple-600">
              <Users className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-6 w-16" /> : (
              <>
                <div className="text-xl font-bold">{customers.length}</div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Active shopper profiles</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg. Lifetime Spent</CardTitle>
            <div className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-600">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-6 w-20" /> : (
              <>
                <div className="text-xl font-bold">{formatCurrency(avgSpending)}</div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Per registered account</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-200/60 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/10">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
            <CardTitle className="text-xs font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1">
              <Award className="h-3.5 w-3.5" /> Top Customer
            </CardTitle>
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-6 w-28" /> : topCustomer ? (
              <>
                <div className="text-base font-bold truncate">{topCustomer.name}</div>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                  {formatCurrency(topCustomer.totalSpent)} total
                </p>
              </>
            ) : <div className="text-sm text-muted-foreground">None</div>}
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
        <Input
          placeholder="Search by name or email..."
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
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm">Loading customers...</span>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium text-foreground">No customers found</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                    <th className="px-4 py-2.5 text-xs font-medium">Customer</th>
                    <th className="px-3 py-2.5 text-xs font-medium">Email</th>
                    <th className="px-3 py-2.5 text-xs font-medium">Orders</th>
                    <th className="px-3 py-2.5 text-xs font-medium">Total Spent</th>
                    <th className="px-3 py-2.5 text-xs font-medium">Member Since</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-right">Segment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCustomers.map((c) => {
                    const isLoyal = c.totalSpent >= 250;
                    return (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-[10px] flex items-center justify-center select-none shrink-0">
                              {getInitials(c.name)}
                            </div>
                            <span className="text-sm font-medium text-foreground">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />{c.email}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ShoppingBag className="h-3 w-3 shrink-0" />{c.ordersCount}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-sm font-semibold text-foreground">{formatCurrency(c.totalSpent)}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 shrink-0" />
                            {new Date(c.joinedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {isLoyal ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/40">
                              <Sparkles className="h-2.5 w-2.5" />VIP
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                              Shopper
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
