"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Menu, Search, Bell } from "lucide-react";
import { ToastContainer } from "./toast-container";
import { useStore } from "@/store/useStore";
import { LoginScreen } from "./login-screen";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const settings = useStore((state) => state.settings);
  const isAuthenticated = useStore((state) => state.isAuthenticated);

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
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-border/40 bg-background/60 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.innerWidth >= 768) {
                  setIsCollapsed(!isCollapsed);
                } else {
                  setIsMobileOpen(true);
                }
              }}
              className="p-2 rounded-xl text-muted-foreground hover:bg-muted/85 hover:text-foreground transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Store title for context */}
            <div className="hidden sm:block">
              <h1 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">DTF Printing Portal</h1>
              <p className="text-sm text-foreground font-bold leading-tight mt-0.5">{settings.storeName}</p>
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-3">
            <div className="relative max-w-xs hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </span>
              <input
                type="text"
                placeholder="Search portal..."
                className="h-9 w-48 lg:w-64 rounded-xl border border-border/50 bg-muted/40 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <button className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground relative transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            </button>
            
            <div className="h-8 w-px bg-border" />

            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs select-none shadow-md shadow-indigo-500/10">
                AD
              </div>
              <div className="hidden md:block text-left select-none">
                <p className="text-xs font-bold leading-none text-foreground">Admin User</p>
                <p className="text-[10px] leading-none text-muted-foreground mt-1">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content main viewport */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full">
          {children}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
