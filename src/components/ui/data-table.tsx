"use client";

import React, { useState, useCallback } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Table as TanstackTable,
} from "@tanstack/react-table";
import * as XLSX from "xlsx";
import {
  Search, Download, RefreshCw, Columns3,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ── Export helpers ── */
function flattenRow(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined) { out[k] = ""; continue; }
    if (typeof v === "object") { out[k] = JSON.stringify(v); continue; }
    out[k] = String(v);
  }
  return out;
}

function exportCSV<TData>(table: TanstackTable<TData>, filename: string) {
  const visibleCols = table.getVisibleLeafColumns().filter((c) => c.id !== "actions");
  const headers = visibleCols.map((c) =>
    typeof c.columnDef.header === "string" ? c.columnDef.header : c.id.replace(/_/g, " ")
  );
  const rows = table.getFilteredRowModel().rows.map((row) =>
    visibleCols.map((col) => {
      const val = row.getValue(col.id);
      if (val === null || val === undefined) return "";
      if (typeof val === "object") return JSON.stringify(val);
      return String(val);
    })
  );
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${filename}.csv`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportExcel<TData>(table: TanstackTable<TData>, filename: string) {
  const visibleCols = table.getVisibleLeafColumns().filter((c) => c.id !== "actions");
  const headers = visibleCols.map((c) =>
    typeof c.columnDef.header === "string" ? c.columnDef.header : c.id.replace(/_/g, " ")
  );
  const rows = table.getFilteredRowModel().rows.map((row) =>
    visibleCols.map((col) => {
      const val = row.getValue(col.id);
      if (val === null || val === undefined) return "";
      if (typeof val === "object") return JSON.stringify(val);
      return val;
    })
  );
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  // Auto column widths
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 2, 12) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/* ── Props ── */
export interface DataTableProps<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  exportFilename?: string;
  searchPlaceholder?: string;
  onRefetch?: () => void;
  isFetching?: boolean;
  emptyIcon?: React.ReactNode;
  emptyText?: string;
  toolbar?: React.ReactNode;        // extra slot for custom toolbar items (left side)
  toolbarRight?: React.ReactNode;   // extra slot for toolbar items (right side, before export)
  pageSize?: number;
}

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  isLoading = false,
  exportFilename = "export",
  searchPlaceholder = "Search...",
  onRefetch,
  isFetching = false,
  emptyIcon,
  emptyText = "No results found.",
  toolbar,
  toolbarRight,
  pageSize: initialPageSize = 10,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
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
    initialState: { pagination: { pageSize: initialPageSize } },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalFiltered = table.getFilteredRowModel().rows.length;
  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalFiltered);

  const hideable = table.getAllLeafColumns().filter(
    (c) => c.id !== "actions" && c.getCanHide()
  );

  const onExportCSV = useCallback(() => exportCSV(table, exportFilename), [table, exportFilename]);
  const onExportExcel = useCallback(() => exportExcel(table, exportFilename), [table, exportFilename]);

  return (
    <div className="space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Global search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Custom left slot */}
        {toolbar}

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {toolbarRight}

          {/* Refetch */}
          {onRefetch && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefetch}
              disabled={isFetching}
              className="gap-1.5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
              Refresh
            </Button>
          )}

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Columns3 className="h-3.5 w-3.5" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1 h-px bg-border" />
              {hideable.map((col) => (
                <DropdownMenuItem
                  key={col.id}
                  onClick={() => col.toggleVisibility(!col.getIsVisible())}
                  className="gap-2 cursor-pointer"
                >
                  <span
                    className={cn(
                      "h-3.5 w-3.5 rounded-sm border border-border flex items-center justify-center shrink-0",
                      col.getIsVisible() ? "bg-primary border-primary" : "bg-transparent"
                    )}
                  >
                    {col.getIsVisible() && (
                      <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="capitalize text-xs">
                    {typeof col.columnDef.header === "string"
                      ? col.columnDef.header
                      : col.id.replace(/_/g, " ")}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onExportCSV} className="gap-2 cursor-pointer text-xs">
                <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-muted border border-border">CSV</span>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportExcel} className="gap-2 cursor-pointer text-xs">
                <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400">XLS</span>
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-lg overflow-hidden polaris-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap"
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: initialPageSize }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {columns.map((_, j) => (
                    <TableCell key={j} className="px-3 py-2.5">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-36 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    {emptyIcon && <div className="opacity-30">{emptyIcon}</div>}
                    <p className="text-sm">{emptyText}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-b border-border last:border-0">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-2.5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ── */}
      {!isLoading && totalFiltered > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">{from}</span>
              {" – "}
              <span className="font-medium text-foreground">{to}</span>
              {" of "}
              <span className="font-medium text-foreground">{totalFiltered}</span>
              {totalFiltered !== data.length && (
                <span className="ml-1 text-muted-foreground/70">(filtered from {data.length})</span>
              )}
            </span>
            <div className="flex items-center gap-1.5 border-l border-border pl-3">
              <span>Rows</span>
              <select
                value={pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="h-6 bg-card border border-border rounded px-1.5 text-foreground focus:outline-none text-xs cursor-pointer"
              >
                {[5, 10, 20, 50, 100].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="icon-sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="gap-0.5 px-2 h-7"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            <span className="text-xs text-muted-foreground px-2 select-none">
              {pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button
              variant="outline" size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="gap-0.5 px-2 h-7"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline" size="icon-sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
