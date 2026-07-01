import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  image: string;
  role: string;
  is_admin: boolean;
  is_active: boolean;
  email_verified: boolean;
  last_login_date: string | null;
  is_locked: boolean;
}

export interface MenuRightMenu {
  id: number;
  name: string;
  slug: string;
  menu_type: string;
  link_value: string | null;
  link_type: string;
  icon: string | null;
  is_active: boolean;
}

export interface StoredMenuRight {
  id: number;
  menu_id: number;
  role: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  menu: MenuRightMenu;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  menuRights: StoredMenuRight[];

  setAuth: (user: AuthUser, accessToken: string, refreshToken: string, menuRights?: StoredMenuRight[]) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      menuRights: [],

      setAuth: (user, accessToken, refreshToken, menuRights = []) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true, menuRights }),

      updateUser: (patch) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...patch } });
      },

      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, menuRights: [] }),
    }),
    {
      name: "modfirst-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        menuRights: state.menuRights,
      }),
    }
  )
);
