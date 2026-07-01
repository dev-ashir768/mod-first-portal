"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { AlignLeft, Bell } from "lucide-react";
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

  useProfileQuery();

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
        {/* Topbar — Shopify Polaris style */}
        <header className="sticky top-0 z-10 flex h-14 w-full items-center justify-between border-b border-border bg-card px-4 gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth >= 768) {
                  setIsCollapsed(!isCollapsed);
                } else {
                  setIsMobileOpen(true);
                }
              }}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Toggle sidebar"
            >
              <AlignLeft className="h-[18px] w-[18px]" />
            </button>

            <span className="hidden sm:block text-sm font-semibold text-foreground tracking-tight">
              ModFirst Portal
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button className="relative p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            </button>

            <div className="h-5 w-px bg-border mx-1" />

            <UserMenu />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 w-full">
          {children}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
