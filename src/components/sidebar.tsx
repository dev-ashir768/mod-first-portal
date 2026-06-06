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
    // Sync dark mode state from document element class list
    const isDark = document.documentElement.classList.contains("dark");
    setTimeout(() => {
      setIsDarkMode(isDark);
    }, 0);
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
    { name: "Settings", href: "/settings", icon: Settings }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card/60 backdrop-blur-xl border-r border-border/50 text-card-foreground overflow-x-hidden">
      {/* Header / Logo */}
      <div className={`flex items-center justify-between border-b border-border/40 shrink-0 transition-all duration-300 ${
        isCollapsed && !isMobileOpen ? "px-5 py-4 h-16" : "px-4 py-4 h-16"
      }`}>
        <Link href="/" className="flex items-center select-none shrink-0">
          <div className={`overflow-hidden transition-all duration-300 shrink-0 ${isCollapsed && !isMobileOpen ? "w-6" : "w-[146px]"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo-dark.svg"
              alt="ModFirst Logo"
              className="h-7 w-auto max-w-none transition-transform duration-300"
            />
          </div>
        </Link>
        {isMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center transition-all duration-300 group relative rounded-xl text-sm font-medium w-full h-10 overflow-hidden shrink-0 ${
                isCollapsed && !isMobileOpen
                  ? "px-[10px]"
                  : "px-3"
              } ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
              }`} />
              
              <span className={`truncate transition-all duration-300 overflow-hidden ${
                isCollapsed && !isMobileOpen
                  ? "opacity-0 max-w-0 ml-0 pointer-events-none"
                  : "opacity-100 max-w-[150px] ml-3"
              }`}>
                {item.name}
              </span>

              {/* Tooltip for collapsed sidebar */}
              {isCollapsed && !isMobileOpen && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-popover text-popover-foreground border border-border shadow-md rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all pointer-events-none z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Controls */}
      <div className="p-3 border-t border-border/40 space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className={`flex items-center transition-all duration-300 w-full h-10 overflow-hidden rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 ${
            isCollapsed && !isMobileOpen
              ? "px-[10px]"
              : "px-3"
          }`}
        >
          {isDarkMode ? (
            <>
              <Sun className="h-5 w-5 text-amber-500 shrink-0" />
              <span className={`truncate transition-all duration-300 overflow-hidden ${
                isCollapsed && !isMobileOpen
                  ? "opacity-0 max-w-0 ml-0 pointer-events-none"
                  : "opacity-100 max-w-[150px] ml-3"
              }`}>
                Light Mode
              </span>
            </>
          ) : (
            <>
              <Moon className="h-5 w-5 text-indigo-400 shrink-0" />
              <span className={`truncate transition-all duration-300 overflow-hidden ${
                isCollapsed && !isMobileOpen
                  ? "opacity-0 max-w-0 ml-0 pointer-events-none"
                  : "opacity-100 max-w-[150px] ml-3"
              }`}>
                Dark Mode
              </span>
            </>
          )}
        </button>

        {/* Log Out */}
        <button
          onClick={() => useStore.getState().logout()}
          className={`flex items-center transition-all duration-300 w-full h-10 overflow-hidden rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-500/10 ${
            isCollapsed && !isMobileOpen
              ? "px-[10px]"
              : "px-3"
          }`}
        >
          <LogOut className="h-5 w-5 text-rose-500 shrink-0" />
          <span className={`truncate transition-all duration-300 overflow-hidden text-rose-500 ${
            isCollapsed && !isMobileOpen
              ? "opacity-0 max-w-0 ml-0 pointer-events-none"
              : "opacity-100 max-w-[150px] ml-3"
          }`}>
            Log Out
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar container */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div
          className={`fixed top-0 bottom-0 left-0 z-20 h-full transition-all duration-300 ease-in-out border-r border-border/40 bg-background/50 overflow-hidden ${
            isCollapsed ? "w-16" : "w-64"
          }`}
        >
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileOpen(false)}
      >
        <aside
          className={`fixed top-0 bottom-0 left-0 w-64 max-w-[80vw] z-50 h-full transition-transform duration-300 ease-in-out transform ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  );
}
