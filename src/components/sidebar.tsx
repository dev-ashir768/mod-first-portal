"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Settings, Menu, X, Sun, Moon, LogOut,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useAllPermissions } from "@/hooks/usePermissions";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const ALL_NAV_ITEMS = [
  { name: "Dashboard", href: "/",         icon: LayoutDashboard, slug: "dashboard" },
  { name: "Products",  href: "/products",  icon: Package,         slug: "products"  },
  { name: "Orders",    href: "/orders",    icon: ShoppingCart,    slug: "orders"    },
  { name: "Customers", href: "/customers", icon: Users,           slug: "customers" },
  { name: "Menus",     href: "/menus",     icon: Menu,            slug: "menus"     },
  { name: "Settings",  href: "/settings",  icon: Settings,        slug: "settings"  },
] as const;

export function Sidebar({ isCollapsed, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const allPerms = useAllPermissions();

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const navItems = ALL_NAV_ITEMS.filter((item) => {
    if (allPerms.size === 0) return true;
    const perm = allPerms.get(item.slug);
    return !perm || perm.canView;
  });

  const collapsed = isCollapsed && !isMobileOpen;

  const sidebarContent = (
    /* Shopify Polaris dark sidebar */
    <div className="flex flex-col h-full bg-[var(--sidebar)] text-[var(--sidebar-foreground)] overflow-x-hidden">

      {/* Logo row */}
      <div className={`flex items-center justify-between h-14 shrink-0 px-4 border-b border-[var(--sidebar-border)]`}>
        <Link href="/" className="flex items-center select-none shrink-0 min-w-0">
          <div className={`overflow-hidden transition-all duration-200 shrink-0 ${collapsed ? "w-6" : "w-36"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-dark.svg" alt="ModFirst" className="h-6 w-auto max-w-none brightness-0 invert" />
          </div>
        </Link>
        {isMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded hover:bg-white/10 text-[var(--sidebar-foreground)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--sidebar-foreground)]/40 select-none">
            Navigation
          </p>
        )}
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`group relative flex items-center h-8 rounded-md text-sm transition-all w-full overflow-hidden shrink-0 ${
                collapsed ? "px-2 justify-center" : "px-2.5"
              } ${
                isActive
                  ? "bg-white/15 text-white font-medium"
                  : "text-[var(--sidebar-foreground)]/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-[var(--sidebar-foreground)]/60 group-hover:text-white"}`} />

              <span className={`truncate ml-2.5 transition-all duration-200 overflow-hidden ${
                collapsed ? "opacity-0 max-w-0 ml-0 pointer-events-none" : "opacity-100 max-w-[160px]"
              }`}>
                {item.name}
              </span>

              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
              )}

              {/* Collapsed tooltip */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] border border-[var(--sidebar-border)] shadow-lg rounded-md text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all pointer-events-none z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-2 border-t border-[var(--sidebar-border)] space-y-0.5">
        <button
          onClick={toggleDarkMode}
          className={`flex items-center w-full h-8 overflow-hidden rounded-md text-sm text-[var(--sidebar-foreground)]/60 hover:text-white hover:bg-white/10 transition-colors ${
            collapsed ? "px-2 justify-center" : "px-2.5"
          }`}
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4 text-amber-400 shrink-0" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-300 shrink-0" />
          )}
          <span className={`truncate ml-2.5 transition-all duration-200 overflow-hidden ${
            collapsed ? "opacity-0 max-w-0 ml-0 pointer-events-none" : "opacity-100 max-w-[160px]"
          }`}>
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </span>
        </button>

        <button
          onClick={() => useAuthStore.getState().clearAuth()}
          className={`flex items-center w-full h-8 overflow-hidden rounded-md text-sm text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors ${
            collapsed ? "px-2 justify-center" : "px-2.5"
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className={`truncate ml-2.5 transition-all duration-200 overflow-hidden ${
            collapsed ? "opacity-0 max-w-0 ml-0 pointer-events-none" : "opacity-100 max-w-[160px]"
          }`}>
            Log Out
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className={`hidden md:block shrink-0 transition-all duration-200 ease-in-out ${isCollapsed ? "w-[52px]" : "w-56"}`}>
        <div className={`fixed top-0 bottom-0 left-0 z-20 h-full transition-all duration-200 ease-in-out overflow-hidden ${isCollapsed ? "w-[52px]" : "w-56"}`}>
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsMobileOpen(false)}
      >
        <aside
          className={`fixed top-0 bottom-0 left-0 w-56 max-w-[80vw] z-50 h-full transition-transform duration-200 ease-in-out ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
          onClick={(e) => e.stopPropagation()}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  );
}
