"use client";

import React, { useState, useMemo } from "react";
import { useCustomers, useSettings } from "@/hooks/useMockData";
import {
  Search,
  Users,
  Calendar,
  Mail,
  Loader2,
  DollarSign,
  Award,
  Sparkles,
  ShoppingBag
} from "lucide-react";
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: settings?.currency || "USD"
    }).format(val);
  };

  // Helper to get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Metrics
  const avgSpending = useMemo(() => {
    if (customers.length === 0) return 0;
    const total = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    return total / customers.length;
  }, [customers]);

  const topCustomer = useMemo(() => {
    if (customers.length === 0) return null;
    return [...customers].sort((a, b) => b.totalSpent - a.totalSpent)[0];
  }, [customers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/20">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Customers
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Browse registered shoppers, order counts, and lifetime value.
          </p>
        </div>
      </div>

      {/* Customer Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Accounts</CardTitle>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <>
                <div className="text-2xl font-black">{customers.length}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Active shopper profiles</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Avg. Lifetime Spent</CardTitle>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <>
                <div className="text-2xl font-black">{formatCurrency(avgSpending)}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Value per registered account</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-indigo-500/20 bg-indigo-500/5 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Award className="h-4 w-4 text-indigo-500" />
              Top Customer
            </CardTitle>
            <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-32" />
            ) : topCustomer ? (
              <>
                <div className="text-xl font-black text-foreground truncate">{topCustomer.name}</div>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1">
                  Spent {formatCurrency(topCustomer.totalSpent)} total
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">None</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </span>
        <Input
          type="text"
          placeholder="Search shoppers by name or email address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 rounded-xl border-border/50 bg-card/40 backdrop-blur-sm focus-visible:ring-1"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-md overflow-hidden shadow-lg shadow-black/5">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span>Fetching shopper index...</span>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <h3 className="font-bold text-lg text-foreground mb-1">No customers found</h3>
              <p className="text-sm">No shoppers match your current search.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-semibold">
                  <th className="p-4 pl-6">Profile</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Orders Placed</th>
                  <th className="p-4">Total Spending</th>
                  <th className="p-4">Member Since</th>
                  <th className="p-4 pr-6 text-right">Segment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredCustomers.map((c) => {
                  const initials = getInitials(c.name);
                  const isLoyal = c.totalSpent >= 250;
                  return (
                    <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 pl-6 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center select-none shadow-md shadow-indigo-500/10">
                            {initials}
                          </div>
                          <span className="font-bold text-foreground">{c.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground align-middle">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {c.email}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-foreground align-middle">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                          {c.ordersCount} checkouts
                        </div>
                      </td>
                      <td className="p-4 font-black text-foreground align-middle">
                        {formatCurrency(c.totalSpent)}
                      </td>
                      <td className="p-4 text-muted-foreground text-xs align-middle">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {new Date(c.joinedDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-right align-middle">
                        {isLoyal ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/30">
                            <Sparkles className="h-3 w-3" />
                            Loyal VIP
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold bg-muted text-muted-foreground border border-border/30">
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
      </div>
    </div>
  );
}
