"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Menu, Search, Bell } from "lucide-react";
import { ToastContainer } from "./toast-container";
import { useAuthStore } from "@/store/useAuthStore";
import { LoginScreen } from "./login-screen";
import { UserMenu } from "./user-menu";
import { useProfileQuery } from "@/hooks/useAuth";

const PUBLIC_ROUTES = ["/forgot-password"];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const pathname = usePathname();

  // Keep profile fresh — silently syncs store; no UI dependency here
  useProfileQuery();

  /* Public routes render without auth check */
  if (PUBLIC_ROUTES.includes(pathname)) {
    return (
      <div className="min-h-screen bg-background relative">
        {children}
        <ToastContainer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background relative">
        <LoginScreen />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header — Shopify-style: white, flat, h-14, compact */}
        <header className="sticky top-0 z-10 flex h-14 w-full items-center justify-between border-b border-border bg-card px-4 md:px-5 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth >= 768) {
                  setIsCollapsed(!isCollapsed);
                } else {
                  setIsMobileOpen(true);
                }
              }}
              className="p-1.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="hidden sm:block leading-none">
              <p className="text-sm font-semibold text-foreground">ModFirst DTF Transfers</p>
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-2">
            <div className="relative max-w-xs hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
              </span>
              <input
                type="text"
                placeholder="Search..."
                className="h-8 w-44 lg:w-56 rounded border border-border bg-muted/50 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
              />
            </div>

            <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground relative transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
            </button>

            <div className="h-6 w-px bg-border mx-1" />

            <UserMenu />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-5 lg:p-6 w-full">
          {children}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
