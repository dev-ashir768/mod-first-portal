"use client";

import React, { useRef, useState, useCallback } from "react";
import { Upload, X, FileImage, FileVideo, Loader2, CheckCircle2 } from "lucide-react";
import { useUploadImageMutation, useUploadVideoMutation } from "@/hooks/useUpload";
import { useToast } from "@/store/useToast";
import { cn } from "@/lib/utils";

type AcceptType = "image" | "video" | "any";

const ACCEPT_MAP: Record<AcceptType, string> = {
  image: "image/jpeg,image/png,image/webp,image/gif,image/svg+xml",
  video: "video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska",
  any: "image/*,video/*",
};

const MAX_SIZE: Record<AcceptType, number> = {
  image: 10 * 1024 * 1024,   // 10 MB
  video: 200 * 1024 * 1024,  // 200 MB
  any: 200 * 1024 * 1024,
};

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface FileUploadProps {
  value?: string;           // current URL (controlled)
  onChange?: (url: string) => void;
  accept?: AcceptType;
  folder?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function FileUpload({
  value,
  onChange,
  accept = "image",
  folder,
  disabled,
  className,
  placeholder,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { addToast } = useToast();

  const uploadImage = useUploadImageMutation();
  const uploadVideo = useUploadVideoMutation();

  const isPending = uploadImage.isPending || uploadVideo.isPending;

  const upload = useCallback(
    async (file: File) => {
      const maxBytes = MAX_SIZE[accept];
      if (file.size > maxBytes) {
        addToast(`File too large. Max ${humanSize(maxBytes)}.`, "error", "Upload Error");
        return;
      }

      try {
        const isVideo = file.type.startsWith("video/");
        const res = isVideo
          ? await uploadVideo.mutateAsync({ file, folder })
          : await uploadImage.mutateAsync({ file, folder });

        onChange?.(res.payload.url);
        addToast("File uploaded successfully.", "success", "Uploaded");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        addToast(msg, "error", "Upload Error");
      }
    },
    [accept, folder, onChange, uploadImage, uploadVideo, addToast]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isPending) return;
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isPending) setIsDragging(true);
  };

  const clear = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    onChange?.("");
  };

  const isImage = value && (value.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i) || accept === "image");
  const isVideo = value && (value.match(/\.(mp4|webm|ogg|mov|mkv)(\?|$)/i) || accept === "video");

  return (
    <div className={cn("space-y-1.5", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_MAP[accept]}
        className="hidden"
        onChange={onFileChange}
        disabled={disabled || isPending}
      />

      {/* Preview area — shown when there's a URL */}
      {value && (
        <div className="relative group rounded-md overflow-hidden border border-border bg-muted/30">
          {isVideo ? (
            <video
              src={value}
              className="w-full max-h-36 object-contain"
              controls={false}
              muted
            />
          ) : isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="preview" className="w-full max-h-36 object-contain" />
          ) : (
            <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground truncate">
              <FileImage className="h-4 w-4 shrink-0" />
              <span className="truncate">{value}</span>
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || isPending}
              className="h-7 px-2.5 rounded-md bg-white/90 text-xs font-medium text-foreground hover:bg-white flex items-center gap-1.5 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Replace
            </button>
            <button
              type="button"
              onClick={clear}
              disabled={disabled || isPending}
              className="h-7 w-7 rounded-md bg-white/90 flex items-center justify-center hover:bg-white text-rose-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Uploaded badge */}
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-emerald-600/90 text-white text-[10px] font-medium rounded px-1.5 py-0.5 pointer-events-none">
            <CheckCircle2 className="h-3 w-3" />
            Uploaded
          </div>
        </div>
      )}

      {/* Drop zone — shown when no URL or always as fallback */}
      {!value && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={() => setIsDragging(false)}
          disabled={disabled || isPending}
          className={cn(
            "w-full flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed py-5 px-4 transition-all cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30",
            (disabled || isPending) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                {accept === "video"
                  ? <FileVideo className="h-4 w-4 text-muted-foreground" />
                  : <FileImage className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-foreground">
                  {placeholder ?? (accept === "video" ? "Upload video" : "Upload image")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {accept === "video"
                    ? "MP4, WebM, MOV — max 200 MB"
                    : "PNG, JPG, WebP, SVG — max 10 MB"}
                </p>
              </div>
            </>
          )}
        </button>
      )}

      {/* Re-upload button when value exists and not in preview mode */}
      {value && (
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          File ready · click preview to replace
        </p>
      )}
    </div>
  );
}
