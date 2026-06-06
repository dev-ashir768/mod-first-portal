"use client";

import React, { useState } from "react";
import { useStore } from "@/store/useStore";
import { useToast } from "@/store/useToast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sparkles,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const login = useStore((state) => state.login);
  const { addToast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = (values: LoginFormValues) => {
    setIsPending(true);
    
    // Simulate API Verification
    setTimeout(() => {
      setIsPending(false);
      // Simple hardcoded static credential check
      if (values.email === "admin@modfirst.com" && values.password === "admin123") {
        login();
        addToast("Welcome back! Admin session initialized.", "success", "Login Successful");
      } else {
        addToast("Invalid email or password. Use the provided hints.", "error", "Authentication Failed");
      }
    }, 1200);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background px-4">
      {/* Glowing Mesh Gradients in the background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[120px] dark:bg-indigo-500/5 animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[120px] dark:bg-purple-500/5" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-md z-10 space-y-4">
        {/* Portal Branding */}
        <div className="flex flex-col items-center text-center space-y-2 select-none mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 text-white mb-2">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            ModFirst E-Commerce Portal
          </h1>
          <p className="text-xs text-muted-foreground">
            Administrative access control node.
          </p>
        </div>

        {/* Login Form Card */}
        <Card className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-xl shadow-2xl shadow-indigo-500/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold">Portal Access</CardTitle>
            <CardDescription>Enter administrative credentials to log in.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email field */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@modfirst.com"
                    className="pl-9 bg-background/50"
                    {...register("email")}
                    disabled={isPending}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-500 font-semibold mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Security Password
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-9 bg-background/50"
                    {...register("password")}
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    disabled={isPending}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-500 font-semibold mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Login Button */}
              <Button type="submit" className="w-full rounded-xl font-bold h-10 shadow-md shadow-primary/10" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin mr-2" />
                    Verifying Node Security...
                  </>
                ) : (
                  <>
                    Log In to Portal
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Credentials Hints Card */}
        <Card className="rounded-xl border-dashed border-indigo-500/30 bg-indigo-500/5 p-3 flex items-start gap-3">
          <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1 text-muted-foreground leading-relaxed">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-300">Default Sandbox Credentials</h4>
            <p>
              Email: <span className="font-mono bg-indigo-500/10 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-200 select-all">admin@modfirst.com</span>
            </p>
            <p>
              Password: <span className="font-mono bg-indigo-500/10 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-200 select-all">admin123</span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
