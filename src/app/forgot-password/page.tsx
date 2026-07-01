"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForgotPasswordMutation, useResetPasswordMutation } from "@/hooks/useAuth";
import { useToast } from "@/store/useToast";
import {
  Mail, ArrowRight, Loader2, ShieldCheck,
  RotateCcw, Eye, EyeOff, CheckCircle2, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OtpInput } from "@/components/ui/otp-input";

/* ── Schemas ── */
const emailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

const resetSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Minimum 8 characters")
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/[0-9]/, "Must include a number")
      .regex(/[^A-Za-z0-9]/, "Must include a special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type EmailValues = z.infer<typeof emailSchema>;
type ResetValues = z.infer<typeof resetSchema>;

type Step = "email" | "otp-password" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const forgotMutation = useForgotPasswordMutation();
  const resetMutation = useResetPasswordMutation();

  /* cooldown */
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  /* Step 1 */
  const onEmailSubmit = (values: EmailValues) => {
    forgotMutation.mutate(
      { email: values.email },
      {
        onSuccess: () => {
          setEmail(values.email);
          setStep("otp-password");
          setResendCooldown(60);
          addToast("OTP sent to your email.", "success", "Check your inbox");
        },
        onError: (err) => addToast(err.message, "error", "Failed"),
      }
    );
  };

  /* Resend */
  const onResend = () => {
    forgotMutation.mutate(
      { email },
      {
        onSuccess: () => {
          setResendCooldown(60);
          setOtp("");
          addToast("New OTP sent.", "success", "OTP Resent");
        },
        onError: (err) => addToast(err.message, "error", "Resend Failed"),
      }
    );
  };

  /* Step 2 */
  const onResetSubmit = (values: ResetValues) => {
    if (otp.length < 6) {
      addToast("Enter the 6-digit OTP.", "error", "Invalid OTP");
      return;
    }
    resetMutation.mutate(
      { email, otp, newPassword: values.newPassword, confirmPassword: values.confirmPassword },
      {
        onSuccess: () => {
          setStep("success");
          addToast("Password reset successfully.", "success", "Done");
        },
        onError: (err) => {
          addToast(err.message, "error", "Reset Failed");
          setOtp("");
        },
      }
    );
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background px-4">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-indigo-500/15 blur-[120px]" />
      </div>
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.4]"
        style={{ backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
      />

      <div className="w-full max-w-md z-10 space-y-4 animate-slide-in-up">
        {/* Branding */}
        <div className="flex flex-col items-center text-center mb-3 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-dark.svg" alt="ModFirst" className="h-10 w-auto mb-2 dark:invert" />
          <h1 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">ModFirst Admin Portal</h1>
        </div>

        {/* ── Step 1: Email ── */}
        {step === "email" && (
          <Card className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-xl shadow-2xl shadow-primary/5">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => router.push("/")}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
              <CardTitle className="text-lg font-bold">Forgot password?</CardTitle>
              <CardDescription>Enter your email — we&apos;ll send you a reset OTP.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      className="pl-9 bg-background/50"
                      {...emailForm.register("email")}
                      disabled={forgotMutation.isPending}
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="text-xs text-rose-500 font-semibold">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full font-bold" size="lg" disabled={forgotMutation.isPending}>
                  {forgotMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending OTP...</>
                    : <>Send Reset OTP <ArrowRight className="h-4 w-4 ml-2" /></>}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: OTP + New Password ── */}
        {step === "otp-password" && (
          <Card className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-xl shadow-2xl shadow-primary/5">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => { setStep("email"); setOtp(""); }}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
              </div>
              <CardTitle className="text-lg font-bold">Reset your password</CardTitle>
              <CardDescription>
                Enter the OTP sent to <span className="font-semibold text-foreground">{email}</span> and choose a new password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                {/* OTP */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">6-Digit OTP</Label>
                  <OtpInput value={otp} onChange={setOtp} />
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1">
                    Didn&apos;t receive it?{" "}
                    {resendCooldown > 0 ? (
                      <span className="font-medium text-foreground">Resend in {resendCooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={onResend}
                        disabled={forgotMutation.isPending}
                        className="flex items-center gap-1 font-semibold text-primary hover:underline disabled:opacity-50"
                      >
                        {forgotMutation.isPending
                          ? <><Loader2 className="h-3 w-3 animate-spin" />Sending...</>
                          : <><RotateCcw className="h-3 w-3" />Resend</>}
                      </button>
                    )}
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* New Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNew ? "text" : "password"}
                      placeholder="Min 8 chars, uppercase, number, symbol"
                      className="pr-9 bg-background/50"
                      {...resetForm.register("newPassword")}
                      disabled={resetMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {resetForm.formState.errors.newPassword && (
                    <p className="text-xs text-rose-500 font-semibold">{resetForm.formState.errors.newPassword.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter new password"
                      className="pr-9 bg-background/50"
                      {...resetForm.register("confirmPassword")}
                      disabled={resetMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-rose-500 font-semibold">{resetForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full font-bold" size="lg"
                  disabled={resetMutation.isPending || otp.length < 6}
                >
                  {resetMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Resetting...</>
                    : <>Reset Password <ShieldCheck className="h-4 w-4 ml-2" /></>}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Step 3: Success ── */}
        {step === "success" && (
          <Card className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-xl shadow-2xl shadow-primary/5">
            <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
              <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Password reset!</h2>
                <p className="text-sm text-muted-foreground mt-1">You can now log in with your new password.</p>
              </div>
              <Button className="w-full font-bold" size="lg" onClick={() => router.push("/")}>
                Go to Login <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
