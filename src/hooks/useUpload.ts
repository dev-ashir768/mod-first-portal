import { useMutation } from "@tanstack/react-query";
import { apiRequest, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

interface UploadResponse {
  success: boolean;
  status: number;
  message: string;
  payload: {
    url: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
  };
}

interface MultiUploadResponse {
  success: boolean;
  status: number;
  message: string;
  payload: Array<{
    url: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
  }>;
}

/* ── Single Image ── */
export function useUploadImageMutation() {
  const token = useAuthStore((s) => s.accessToken);
  return useMutation<UploadResponse, ApiError, { file: File; folder?: string }>({
    mutationFn: ({ file, folder }) => {
      const fd = new FormData();
      fd.append("file", file);
      const path = folder ? `upload/image?folder=${encodeURIComponent(folder)}` : "upload/image";
      return apiRequest<UploadResponse>(path, { method: "POST", body: fd, token: token ?? undefined });
    },
  });
}

/* ── Multiple Images ── */
export function useUploadImagesMutation() {
  const token = useAuthStore((s) => s.accessToken);
  return useMutation<MultiUploadResponse, ApiError, { files: File[]; folder?: string }>({
    mutationFn: ({ files, folder }) => {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const path = folder ? `upload/images?folder=${encodeURIComponent(folder)}` : "upload/images";
      return apiRequest<MultiUploadResponse>(path, { method: "POST", body: fd, token: token ?? undefined });
    },
  });
}

/* ── Single Video ── */
export function useUploadVideoMutation() {
  const token = useAuthStore((s) => s.accessToken);
  return useMutation<UploadResponse, ApiError, { file: File; folder?: string }>({
    mutationFn: ({ file, folder }) => {
      const fd = new FormData();
      fd.append("file", file);
      const path = folder ? `upload/video?folder=${encodeURIComponent(folder)}` : "upload/video";
      return apiRequest<UploadResponse>(path, { method: "POST", body: fd, token: token ?? undefined });
    },
  });
}

/* ── Multiple Videos ── */
export function useUploadVideosMutation() {
  const token = useAuthStore((s) => s.accessToken);
  return useMutation<MultiUploadResponse, ApiError, { files: File[] }>({
    mutationFn: ({ files }) => {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      return apiRequest<MultiUploadResponse>("upload/videos", { method: "POST", body: fd, token: token ?? undefined });
    },
  });
}

/* ── Delete File ── */
export function useDeleteFileMutation() {
  const token = useAuthStore((s) => s.accessToken);
  return useMutation<{ success: boolean; message: string }, ApiError, { path: string }>({
    mutationFn: ({ path }) =>
      apiRequest(`upload?path=${encodeURIComponent(path)}`, {
        method: "DELETE",
        token: token ?? undefined,
      }),
  });
}
