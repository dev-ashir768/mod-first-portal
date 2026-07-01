import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

/* ── Types ── */
export type MenuType = "frontend" | "backend";
export type LinkType = "page" | "external_url" | "category" | "product" | "collection" | "custom";

export interface Menu {
  id: number;
  name: string;
  slug: string;
  menu_type: MenuType;
  parent_id: number | null;
  sort_order: number;
  icon: string | null;
  link_type: LinkType;
  link_value: string | null;
  target_category_id: number | null;
  target_product_id: number | null;
  target_page_id: number | null;
  external_url: string | null;
  open_in_new_tab: boolean;
  visibility: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuRight {
  id: number;
  menu_id: number;
  role: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
  menu?: Menu;
}

export type MenuFormValues = {
  name: string;
  slug: string;
  menu_type: MenuType;
  parent_id: number | null;
  sort_order: number;
  icon: string;
  link_type: LinkType;
  link_value: string;
  external_url: string;
  open_in_new_tab: boolean;
  visibility: boolean;
  is_active: boolean;
};

export type MenuRightFormValues = {
  menu_id: number;
  role: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  payload: T;
}

interface ListPayload<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

function useToken() {
  return useAuthStore((s) => s.accessToken) ?? undefined;
}

/* ─────────────────────────────────
   MENUS
───────────────────────────────── */

export function useMenusQuery(page = 1, limit = 50, filters?: Record<string, unknown>) {
  const token = useToken();
  return useQuery<ApiResponse<ListPayload<Menu>>, ApiError>({
    queryKey: ["menus", page, limit, filters],
    enabled: !!token,
    staleTime: 30_000,
    queryFn: () =>
      apiRequest("menus/list", {
        method: "POST",
        body: { page, limit, ...(filters ? { filters } : {}) },
        token,
      }),
  });
}

export function useCreateMenuMutation() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation<ApiResponse<Menu>, ApiError, MenuFormValues>({
    mutationFn: (body) => apiRequest("menus", { method: "POST", body, token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menus"] }),
  });
}

export function useUpdateMenuMutation() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation<ApiResponse<Menu>, ApiError, { id: number; data: Partial<MenuFormValues> }>({
    mutationFn: ({ id, data }) => apiRequest(`menus/${id}`, { method: "PUT", body: data, token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menus"] }),
  });
}

export function useDeleteMenuMutation() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation<ApiResponse<unknown>, ApiError, number>({
    mutationFn: (id) =>
      apiRequest("common/delete", { method: "DELETE", body: { id, table: "menu" }, token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menus"] }),
  });
}

export function useToggleMenuStatusMutation() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation<ApiResponse<unknown>, ApiError, { id: number; is_active: boolean }>({
    mutationFn: ({ id, is_active }) =>
      apiRequest("common/update-status", { method: "PATCH", body: { id, is_active, table: "menu" }, token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menus"] }),
  });
}

/* ─────────────────────────────────
   MENU RIGHTS
───────────────────────────────── */

export function useMenuRightsQuery(role?: string) {
  const token = useToken();
  return useQuery<ApiResponse<ListPayload<MenuRight>>, ApiError>({
    queryKey: ["menu-rights", role],
    enabled: !!token,
    staleTime: 30_000,
    queryFn: () =>
      apiRequest("menu-rights/list", {
        method: "POST",
        body: { page: 1, limit: 100, ...(role ? { filters: { role } } : {}) },
        token,
      }),
  });
}

export function useCreateMenuRightMutation() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation<ApiResponse<MenuRight>, ApiError, MenuRightFormValues>({
    mutationFn: (body) => apiRequest("menu-rights", { method: "POST", body, token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-rights"] }),
  });
}

export function useUpdateMenuRightMutation() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation<ApiResponse<MenuRight>, ApiError, { id: number; data: Partial<MenuRightFormValues> }>({
    mutationFn: ({ id, data }) => apiRequest(`menu-rights/${id}`, { method: "PUT", body: data, token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-rights"] }),
  });
}

export function useDeleteMenuRightMutation() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation<ApiResponse<unknown>, ApiError, number>({
    mutationFn: (id) =>
      apiRequest("common/delete", { method: "DELETE", body: { id, table: "menuRight" }, token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-rights"] }),
  });
}
