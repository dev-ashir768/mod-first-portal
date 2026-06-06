import { create } from "zustand";

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastState {
  toasts: ToastMessage[];
  addToast: (message: string, type?: ToastMessage["type"], title?: string) => void;
  dismissToast: (id: string) => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = "info", title) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, title }]
    }));
    
    // Auto dismiss after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, 4000);
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }))
}));
