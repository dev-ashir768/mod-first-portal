"use client";

import React, { useState, useMemo } from "react";
import { useCustomers, useSettings } from "@/hooks/useMockData";
import { ColumnDef } from "@tanstack/react-table";
import { Users, Calendar, Mail, DollarSign, Award, Sparkles, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";

export default function CustomersPage() {
  const { data: customers = [], isLoading, refetch, isFetching } = useCustomers();
  const { data: settings } = useSettings();

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<ColumnDef<any>[]>(() => [ // eslint-disable-line react-hooks/exhaustive-deps
    {
      accessorKey: "name",
      header: "Customer",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-[10px] flex items-center justify-center select-none shrink-0">
            {getInitials(row.original.name)}
          </div>
          <span className="text-sm font-medium text-foreground">{row.original.name}</span>
        </div>
      )
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Mail className="h-3 w-3 shrink-0" />{row.original.email}
        </div>
      )
    },
    {
      accessorKey: "ordersCount",
      header: "Orders",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ShoppingBag className="h-3 w-3 shrink-0" />{row.original.ordersCount}
        </div>
      )
    },
    {
      accessorKey: "totalSpent",
      header: "Total Spent",
      cell: ({ row }) => <span className="text-sm font-semibold text-foreground">{formatCurrency(row.original.totalSpent)}</span>
    },
    {
      accessorKey: "joinedDate",
      header: "Member Since",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 shrink-0" />
          {new Date(row.original.joinedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      )
    },
    {
      id: "segment",
      header: () => <span className="text-right block">Segment</span>,
      cell: ({ row }) => {
        const isLoyal = row.original.totalSpent >= 250;
        return (
          <div className="text-right">
            {isLoyal ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/40">
                <Sparkles className="h-2.5 w-2.5" />VIP
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                Shopper
              </span>
            )}
          </div>
        );
      }
    }
  ], [formatCurrency]);

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

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        isFetching={isFetching}
        onRefetch={refetch}
        exportFilename="customers"
        searchPlaceholder="Search by name or email..."
        emptyIcon={<Users className="h-8 w-8" />}
        emptyText="No customers found."
      />
    </div>
  );
}
