"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  X,
  Sun,
  Moon,
  LogOut
} from "lucide-react";
import { useStore } from "@/store/useStore";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Sidebar({ isCollapsed, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTimeout(() => setIsDarkMode(isDark), 0);
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Products", href: "/products", icon: Package },
    { name: "Orders", href: "/orders", icon: ShoppingCart },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const collapsed = isCollapsed && !isMobileOpen;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border text-card-foreground overflow-x-hidden">
      {/* Logo */}
      <div className={`flex items-center justify-between border-b border-border shrink-0 h-14 ${collapsed ? "px-4" : "px-4"}`}>
        <Link href="/" className="flex items-center select-none shrink-0">
          <div className={`overflow-hidden transition-all duration-200 shrink-0 ${collapsed ? "w-5" : "w-[136px]"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo-dark.svg"
              alt="ModFirst"
              className="h-6 w-auto max-w-none"
            />
          </div>
        </Link>
        {isMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1 rounded text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {/* Section label */}
        {!collapsed && (
          <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground select-none">
            Menu
          </p>
        )}
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center transition-colors group relative rounded h-8 text-sm w-full overflow-hidden shrink-0 ${
                collapsed ? "px-2 justify-center" : "px-2.5"
              } ${
                isActive
                  ? "bg-primary/15 text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />

              <span className={`truncate transition-all duration-200 overflow-hidden ${
                collapsed
                  ? "opacity-0 max-w-0 ml-0 pointer-events-none"
                  : "opacity-100 max-w-[160px] ml-2.5"
              }`}>
                {item.name}
              </span>

              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary" />
              )}

              {/* Collapsed tooltip */}
              {collapsed && (
                <div className="absolute left-full ml-2.5 px-2 py-1 bg-popover text-popover-foreground border border-border shadow rounded text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all pointer-events-none z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-2 border-t border-border space-y-0.5">
        <button
          onClick={toggleDarkMode}
          className={`flex items-center transition-colors w-full h-8 overflow-hidden rounded text-sm text-muted-foreground hover:text-foreground hover:bg-muted ${
            collapsed ? "px-2 justify-center" : "px-2.5"
          }`}
        >
          {isDarkMode ? (
            <>
              <Sun className="h-4 w-4 text-amber-500 shrink-0" />
              <span className={`truncate transition-all duration-200 overflow-hidden ${collapsed ? "opacity-0 max-w-0 ml-0 pointer-events-none" : "opacity-100 max-w-[160px] ml-2.5"}`}>
                Light Mode
              </span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-indigo-400 shrink-0" />
              <span className={`truncate transition-all duration-200 overflow-hidden ${collapsed ? "opacity-0 max-w-0 ml-0 pointer-events-none" : "opacity-100 max-w-[160px] ml-2.5"}`}>
                Dark Mode
              </span>
            </>
          )}
        </button>

        <button
          onClick={() => useStore.getState().logout()}
          className={`flex items-center transition-colors w-full h-8 overflow-hidden rounded text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 ${
            collapsed ? "px-2 justify-center" : "px-2.5"
          }`}
        >
          <LogOut className="h-4 w-4 text-rose-500 shrink-0" />
          <span className={`truncate transition-all duration-200 overflow-hidden ${collapsed ? "opacity-0 max-w-0 ml-0 pointer-events-none" : "opacity-100 max-w-[160px] ml-2.5"}`}>
            Log Out
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className={`hidden md:block shrink-0 transition-all duration-200 ease-in-out ${isCollapsed ? "w-14" : "w-56"}`}>
        <div className={`fixed top-0 bottom-0 left-0 z-20 h-full transition-all duration-200 ease-in-out overflow-hidden ${isCollapsed ? "w-14" : "w-56"}`}>
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed inset-0 z-50 bg-black/30 transition-opacity duration-200 ${isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
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
