"use client";

import { useToast, ToastMessage } from "@/store/useToast";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => dismissToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  const iconMap = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-500 shrink-0" />
  };

  const bgMap = {
    success: "bg-emerald-50/90 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30",
    error: "bg-rose-50/90 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-800/30",
    info: "bg-blue-50/90 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/30"
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg transition-all duration-300 animate-slide-in-up ${bgMap[toast.type]}`}
    >
      {iconMap[toast.type]}
      <div className="flex-1 min-w-0">
        {toast.title && <h4 className="font-semibold text-sm text-foreground mb-0.5">{toast.title}</h4>}
        <p className="text-sm text-muted-foreground leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground hover:bg-muted p-1 rounded-lg transition-colors shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
