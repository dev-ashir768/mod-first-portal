import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  payload: T;
  pagination?: Pagination;
  message?: string;
}

function useToken() {
  return useAuthStore((s) => s.accessToken ?? "");
}

/* ── Types ── */
export interface HomeSectionItem {
  id: number;
  section_id: number;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  mobile_image_url: string | null;
  icon: string | null;
  value: string | null;
  button_text: string | null;
  button_url: string | null;
  secondary_button_text: string | null;
  secondary_button_url: string | null;
  link_url: string | null;
  badge: string | null;
  extra_data: unknown | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HomeSection {
  id: number;
  section_key: string;
  section_name: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  background_image: string | null;
  background_color: string | null;
  layout_type: string | null;
  section_settings: Record<string, unknown> | null;
  is_active: boolean;
  sort_order: number;
  items: HomeSectionItem[];
  created_at?: string;
  updated_at?: string;
}

export type HomeSectionFormValues = {
  section_key: string;
  section_name: string;
  title?: string;
  subtitle?: string;
  description?: string;
  background_image?: string;
  background_color?: string;
  layout_type?: string;
  sort_order: number;
  is_active: boolean;
  section_settings?: Record<string, unknown>;
  items?: Omit<HomeSectionItemInput, "_action">[];
};

export type HomeSectionItemInput = {
  _action: "add" | "update" | "delete";
  id?: number;
  title?: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  mobile_image_url?: string;
  badge?: string;
  button_text?: string;
  button_url?: string;
  secondary_button_text?: string;
  secondary_button_url?: string;
  link_url?: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
};

/* ── Queries ── */
export function useHomeSectionsQuery() {
  const token = useToken();
  return useQuery<ApiResponse<HomeSection[]>, ApiError>({
    queryKey: ["home-sections"],
    queryFn: () =>
      apiRequest("home-sections/list", {
        method: "POST",
        body: { page: 1, limit: 100 },
        token,
      }),
    enabled: !!token,
  });
}

export function useHomeSectionByIdQuery(id: number | null) {
  const token = useToken();
  return useQuery<ApiResponse<HomeSection>, ApiError>({
    queryKey: ["home-sections", id],
    queryFn: () => apiRequest(`home-sections/get/${id}`, { method: "GET", token }),
    enabled: !!token && !!id,
  });
}

/* ── Mutations ── */
export function useCreateHomeSectionMutation() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation<ApiResponse<HomeSection>, ApiError, Record<string, unknown>>({
    mutationFn: (body) => apiRequest("home-sections", { method: "POST", body, token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-sections"] }),
  });
}

export function useUpdateHomeSectionMutation() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation<ApiResponse<HomeSection>, ApiError, { id: number; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => apiRequest(`home-sections/${id}`, { method: "PUT", body: data, token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-sections"] }),
  });
}

export function useManageSectionItemsMutation() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation<ApiResponse<HomeSection>, ApiError, { sectionId: number; items: HomeSectionItemInput[] }>({
    mutationFn: ({ sectionId, items }) =>
      apiRequest(`home-sections/${sectionId}/items`, { method: "POST", body: { items }, token }),
    onSuccess: (_, { sectionId }) => {
      qc.invalidateQueries({ queryKey: ["home-sections"] });
      qc.invalidateQueries({ queryKey: ["home-sections", sectionId] });
    },
  });
}
