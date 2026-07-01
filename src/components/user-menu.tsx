"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  KeyRound, LogOut, User, Eye, EyeOff, Lock, Loader2,
  ShieldCheck, Clock, CheckCircle2, XCircle, Phone, Mail,
  Hash, BadgeCheck, Shield, CalendarDays,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useChangePasswordMutation } from "@/hooks/useAuth";
import { useToast } from "@/store/useToast";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ── Helpers ── */
function formatLastLogin(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ── Schema ── */
const schema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z
      .string()
      .min(8, "Min 8 characters")
      .regex(/[A-Z]/, "Must include uppercase")
      .regex(/[0-9]/, "Must include number")
      .regex(/[^A-Za-z0-9]/, "Must include special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

/* ── Password field ── */
function PwdField({
  id, label, placeholder, error, disabled, registration,
}: {
  id: string; label: string; placeholder?: string;
  error?: string; disabled?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium">{label}</Label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
        <Input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder ?? "••••••••"}
          className="pl-8 pr-8"
          disabled={disabled}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

/* ── Avatar ── */
function UserAvatar({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const user = useAuthStore((s) => s.user);
  const isDefault = !user?.image || user.image === "default-user.png";
  const initials = user
    ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "AD";

  const cls =
    size === "lg" ? "h-16 w-16 rounded-full text-lg font-bold" :
    size === "md" ? "h-10 w-10 rounded-full text-sm font-bold" :
    "h-7 w-7 rounded-full text-[10px] font-bold";

  if (!isDefault) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={user!.image} alt={user!.full_name} className={`${cls} object-cover select-none`} />
    );
  }
  return (
    <div className={`${cls} bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center select-none`}>
      {initials}
    </div>
  );
}

/* ── Profile Row ── */
function ProfileRow({ icon: Icon, label, value, badge }: {
  icon: React.ElementType; label: string; value?: string | null;
  badge?: { text: string; color: string };
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        {badge ? (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold mt-0.5 ${badge.color}`}>
            {badge.text}
          </span>
        ) : (
          <p className="text-sm text-foreground font-medium truncate mt-0.5">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { addToast } = useToast();
  const changePasswordMutation = useChangePasswordMutation();

  const [openPwd, setOpenPwd] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = (values: FormValues) => {
    changePasswordMutation.mutate(values, {
      onSuccess: () => {
        addToast("Password changed successfully.", "success", "Done");
        setOpenPwd(false);
        reset();
      },
      onError: (err) => addToast(err.message, "error", "Failed"),
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted transition-colors focus:outline-none">
            <UserAvatar size="sm" />
            <div className="hidden md:block text-left leading-none select-none">
              <p className="text-xs font-semibold text-foreground">{user?.full_name ?? "Admin"}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">
                {user?.role?.replace(/_/g, " ") ?? "Administrator"}
              </p>
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-60">
          {/* Profile header */}
          <div className="px-3 py-2.5 border-b border-border mb-1">
            <div className="flex items-center gap-2.5">
              <UserAvatar size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{user?.full_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {user?.is_active ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
                      <XCircle className="h-3 w-3" /> Inactive
                    </span>
                  )}
                  {user?.email_verified && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
            {user?.last_login_date && (
              <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                <span>Last login: {formatLastLogin(user.last_login_date)}</span>
              </div>
            )}
            <div className="mt-1.5">
              <span className="inline-block rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5 capitalize">
                {user?.role?.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          <DropdownMenuLabel>Account</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => setOpenProfile(true)}>
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            Profile
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setOpenPwd(true)}>
            <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
            Change Password
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1 h-px bg-border" />

          <DropdownMenuItem
            onClick={() => clearAuth()}
            className="text-rose-600 focus:bg-rose-50 focus:text-rose-700 dark:focus:bg-rose-950/20"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Profile Modal ── */}
      <Dialog open={openProfile} onOpenChange={setOpenProfile}>
        <DialogContent className="sm:max-w-[420px] rounded-lg border-border p-0">
          <DialogHeader className="px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <UserAvatar size="md" />
              <div>
                <DialogTitle className="text-sm font-semibold">{user?.full_name}</DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground capitalize mt-0.5">
                  {user?.role?.replace(/_/g, " ")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-4 py-1">
            <ProfileRow icon={Hash} label="Account ID" value={`#${user?.id}`} />
            <ProfileRow icon={Mail} label="Email" value={user?.email} />
            <ProfileRow icon={Phone} label="Phone" value={user?.phone} />
            <ProfileRow
              icon={BadgeCheck}
              label="Email Status"
              badge={user?.email_verified
                ? { text: "Verified", color: "text-blue-600" }
                : { text: "Not Verified", color: "text-amber-600" }}
            />
            <ProfileRow
              icon={CheckCircle2}
              label="Account Status"
              badge={user?.is_active
                ? { text: "Active", color: "text-emerald-600" }
                : { text: "Inactive", color: "text-rose-600" }}
            />
            <ProfileRow
              icon={Shield}
              label="Admin Access"
              badge={user?.is_admin
                ? { text: "Yes", color: "text-purple-600" }
                : { text: "No", color: "text-muted-foreground" }}
            />
            <ProfileRow
              icon={CalendarDays}
              label="Last Login"
              value={formatDate(user?.last_login_date)}
            />
          </div>

          <div className="flex justify-end gap-2 px-4 py-3 border-t border-border bg-muted/20">
            <Button size="sm" onClick={() => setOpenProfile(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Change Password Dialog ── */}
      <Dialog open={openPwd} onOpenChange={(v) => { setOpenPwd(v); if (!v) reset(); }}>
        <DialogContent className="sm:max-w-[380px] rounded-lg border-border p-0">
          <DialogHeader className="px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-rose-100 dark:bg-rose-950/20 flex items-center justify-center">
                <KeyRound className="h-3.5 w-3.5 text-rose-600" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold">Change Password</DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                  Enter your current password to set a new one.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-4 space-y-3">
              <PwdField
                id="currentPassword"
                label="Current Password"
                placeholder="Your current password"
                registration={register("currentPassword")}
                error={errors.currentPassword?.message}
                disabled={changePasswordMutation.isPending}
              />

              <div className="h-px bg-border" />

              <PwdField
                id="newPassword"
                label="New Password"
                placeholder="Min 8 chars, uppercase, number, symbol"
                registration={register("newPassword")}
                error={errors.newPassword?.message}
                disabled={changePasswordMutation.isPending}
              />
              <PwdField
                id="confirmPassword"
                label="Confirm New Password"
                placeholder="Re-enter new password"
                registration={register("confirmPassword")}
                error={errors.confirmPassword?.message}
                disabled={changePasswordMutation.isPending}
              />
            </div>

            <div className="flex justify-end gap-2 px-4 py-3 border-t border-border bg-muted/20">
              <Button
                type="button" variant="outline" size="sm"
                onClick={() => { setOpenPwd(false); reset(); }}
                disabled={changePasswordMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending
                  ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Updating...</>
                  : <><KeyRound className="h-3.5 w-3.5 mr-1.5" />Update Password</>}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
