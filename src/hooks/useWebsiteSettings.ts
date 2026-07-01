import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

interface ApiResponse<T> {
  success: boolean;
  payload: T;
  message?: string;
}

function useToken() {
  return useAuthStore((s) => s.accessToken ?? "");
}

/* ── Types ── */
export interface WebsiteSetting {
  id: number;
  site_name: string;
  site_tagline: string | null;
  site_description: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  footer_logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  font_primary: string | null;
  font_heading: string | null;
  contact_email: string | null;
  support_email: string | null;
  contact_phone: string | null;
  whatsapp_number: string | null;
  address: string | null;
  business_hours: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  currency: string | null;
  currency_symbol: string | null;
  tax_percentage: number | null;
  free_shipping_threshold: number | null;
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type WebsiteSettingFormValues = Omit<WebsiteSetting, "id" | "created_at" | "updated_at">;

/* ── Queries ── */
export function useWebsiteSettingsQuery() {
  const token = useToken();
  return useQuery<ApiResponse<WebsiteSetting[]>, ApiError>({
    queryKey: ["website-settings"],
    queryFn: () =>
      apiRequest("website-settings/list", {
        method: "POST",
        body: { page: 1, limit: 100 },
        token,
      }),
    enabled: !!token,
  });
}

export function useWebsiteSettingByIdQuery(id: number | null) {
  const token = useToken();
  return useQuery<ApiResponse<WebsiteSetting>, ApiError>({
    queryKey: ["website-settings", id],
    queryFn: () => apiRequest(`website-settings/get/${id}`, { method: "GET", token }),
    enabled: !!token && !!id,
  });
}

/* ── Mutations ── */
export function useCreateWebsiteSettingMutation() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation<ApiResponse<WebsiteSetting>, ApiError, Record<string, unknown>>({
    mutationFn: (body) => apiRequest("website-settings/", { method: "POST", body, token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["website-settings"] }),
  });
}

export function useUpdateWebsiteSettingMutation() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation<ApiResponse<WebsiteSetting>, ApiError, { id: number; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => apiRequest(`website-settings/${id}`, { method: "PUT", body: data, token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["website-settings"] }),
  });
}
