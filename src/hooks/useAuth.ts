import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, ApiError } from "@/lib/api";
import { useAuthStore, AuthUser } from "@/store/useAuthStore";

/* ── Types ── */
interface LoginPayload {
  message: string;
}

interface VerifyOtpPayload {
  user: AuthUser;
  menuRights: unknown[];
  accessToken: string;
  refreshToken: string;
}

interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  payload: T;
}

/* ── Step 1: Send credentials → server sends OTP to email ── */
export function useLoginMutation() {
  return useMutation<ApiResponse<LoginPayload>, ApiError, { email: string; password: string }>({
    mutationFn: (body) =>
      apiRequest<ApiResponse<LoginPayload>>("auth/login", { method: "POST", body }),
  });
}

/* ── Step 2: Submit OTP → receive tokens ── */
export function useVerifyOtpMutation() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation<ApiResponse<VerifyOtpPayload>, ApiError, { email: string; otp: string }>({
    mutationFn: (body) =>
      apiRequest<ApiResponse<VerifyOtpPayload>>("auth/verify-otp", { method: "POST", body }),
    onSuccess: (data) => {
      const { user, accessToken, refreshToken } = data.payload;
      setAuth(user, accessToken, refreshToken);
    },
  });
}

/* ── Resend OTP ── */
export function useResendOtpMutation() {
  return useMutation<ApiResponse<{ message: string }>, ApiError, { email: string }>({
    mutationFn: (body) =>
      apiRequest<ApiResponse<{ message: string }>>("auth/send-otp", { method: "POST", body }),
  });
}

/* ── Forgot Password: send OTP to email ── */
export function useForgotPasswordMutation() {
  return useMutation<ApiResponse<{ message: string }>, ApiError, { email: string }>({
    mutationFn: (body) =>
      apiRequest<ApiResponse<{ message: string }>>("auth/forgot-password", { method: "POST", body }),
  });
}

/* ── Reset Password: email + otp + newPassword + confirmPassword ── */
export function useResetPasswordMutation() {
  return useMutation<
    ApiResponse<{ message: string }>,
    ApiError,
    { email: string; otp: string; newPassword: string; confirmPassword: string }
  >({
    mutationFn: (body) =>
      apiRequest<ApiResponse<{ message: string }>>("auth/reset-password", { method: "POST", body }),
  });
}

/* ── Get Profile (authenticated) ── */
export function useProfileQuery() {
  const token = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const updateUser = useAuthStore((s) => s.updateUser);

  return useQuery<AuthUser, ApiError>({
    queryKey: ["profile"],
    enabled: isAuthenticated && !!token,
    staleTime: 5 * 60 * 1000, // 5 min — re-fetch on window focus after that
    queryFn: async () => {
      const res = await apiRequest<ApiResponse<AuthUser>>("auth/profile", {
        token: token ?? undefined,
      });
      updateUser(res.payload);
      return res.payload;
    },
  });
}

/* ── Change Password (authenticated) ── */
export function useChangePasswordMutation() {
  const token = useAuthStore((s) => s.accessToken);
  return useMutation<
    ApiResponse<{ message: string }>,
    ApiError,
    { currentPassword: string; newPassword: string; confirmPassword: string }
  >({
    mutationFn: (body) =>
      apiRequest<ApiResponse<{ message: string }>>("auth/change-password", {
        method: "POST",
        body,
        token: token ?? undefined,
      }),
  });
}
