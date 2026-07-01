"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/store/useToast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLoginMutation, useVerifyOtpMutation, useResendOtpMutation } from "@/hooks/useAuth";
import {
  Mail, Lock, ArrowRight, Loader2, Eye, EyeOff,
  ShieldCheck, RotateCcw, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OtpInput } from "@/components/ui/otp-input";

/* ── Schemas ── */
const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginFormValues = z.infer<typeof loginSchema>;

/* ── Main Component ── */
export function LoginScreen() {
  const { addToast } = useToast();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const loginMutation = useLoginMutation();
  const verifyOtpMutation = useVerifyOtpMutation();
  const resendOtpMutation = useResendOtpMutation();

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  /* countdown timer for resend */
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  /* Step 1 submit */
  const onCredentialsSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        setEmail(values.email);
        setStep("otp");
        setResendCooldown(60);
        addToast("OTP sent to your email.", "success", "Check your inbox");
      },
      onError: (err) => {
        addToast(err.message, "error", "Login Failed");
      },
    });
  };

  /* Step 2 submit */
  const onOtpSubmit = () => {
    if (otp.length < 6) {
      addToast("Enter the 6-digit OTP.", "error", "Invalid OTP");
      return;
    }
    verifyOtpMutation.mutate(
      { email, otp },
      {
        onError: (err) => {
          addToast(err.message, "error", "Verification Failed");
          setOtp("");
        },
      }
    );
  };

  const onResend = () => {
    resendOtpMutation.mutate(
      { email },
      {
        onSuccess: () => {
          setResendCooldown(60);
          setOtp("");
          addToast("New OTP sent to your email.", "success", "OTP Resent");
        },
        onError: (err) => addToast(err.message, "error", "Resend Failed"),
      }
    );
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background px-4">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] dark:bg-primary/10 animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-indigo-500/15 blur-[120px] dark:bg-indigo-500/5" />
      </div>
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.2]"
        style={{ backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
      />

      <div className="w-full max-w-md z-10 space-y-4 animate-slide-in-up">
        {/* Branding */}
        <div className="flex flex-col items-center text-center space-y-1.5 mb-3 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-dark.svg" alt="ModFirst Logo" className="h-10 w-auto mb-2 dark:invert" />
          <h1 className="text-xs font-bold tracking-widest text-muted-foreground uppercase leading-none">
            ModFirst Admin Portal
          </h1>
        </div>

        {/* ── STEP 1: Credentials ── */}
        {step === "credentials" && (
          <Card className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-xl shadow-2xl shadow-primary/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold">Portal Access</CardTitle>
              <CardDescription>Enter your admin credentials to receive an OTP.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onCredentialsSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Email Address
                  </Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <Input
                      type="email"
                      placeholder="admin@modfirst.com"
                      className="pl-9 bg-background/50"
                      {...register("email")}
                      disabled={loginMutation.isPending}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-rose-500 font-semibold">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-9 pr-9 bg-background/50"
                      {...register("password")}
                      disabled={loginMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                      disabled={loginMutation.isPending}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-rose-500 font-semibold">{errors.password.message}</p>}
                  <div className="flex justify-end pt-0.5">
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <Button type="submit" className="w-full font-bold" size="lg" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending OTP...</>
                  ) : (
                    <>Continue <ArrowRight className="h-4 w-4 ml-2" /></>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── STEP 2: OTP Verification ── */}
        {step === "otp" && (
          <Card className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-xl shadow-2xl shadow-primary/5">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => { setStep("credentials"); setOtp(""); }}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
              </div>
              <CardTitle className="text-lg font-bold">Verify your identity</CardTitle>
              <CardDescription>
                Enter the 6-digit OTP sent to{" "}
                <span className="font-semibold text-foreground">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <OtpInput value={otp} onChange={setOtp} />

              <Button
                className="w-full font-bold" size="lg"
                onClick={onOtpSubmit}
                disabled={verifyOtpMutation.isPending || otp.length < 6}
              >
                {verifyOtpMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Verifying...</>
                ) : (
                  <>Verify & Sign In <ShieldCheck className="h-4 w-4 ml-2" /></>
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                Didn&apos;t receive it?{" "}
                {resendCooldown > 0 ? (
                  <span className="font-medium text-foreground">Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    onClick={onResend}
                    disabled={resendOtpMutation.isPending}
                    className="flex items-center gap-1 font-semibold text-primary hover:underline disabled:opacity-50"
                  >
                    {resendOtpMutation.isPending
                      ? <><Loader2 className="h-3 w-3 animate-spin" />Sending...</>
                      : <><RotateCcw className="h-3 w-3" />Resend OTP</>
                    }
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
