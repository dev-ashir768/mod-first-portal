"use client";

import React, { useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useMockData";
import { settingsSchema, SettingsFormValues } from "@/lib/schema";
import { useToast } from "@/store/useToast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Store,
  CreditCard,
  Loader2,
  Mail,
  Percent,
  CheckCircle2,
  ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      storeName: "",
      supportEmail: "",
      currency: "USD",
      taxRate: 0
    }
  });

  // Sync settings when fetched
  useEffect(() => {
    if (settings) {
      reset({
        storeName: settings.storeName,
        supportEmail: settings.supportEmail,
        currency: settings.currency,
        taxRate: settings.taxRate
      });
    }
  }, [settings, reset]);

  const onSubmit = (values: SettingsFormValues) => {
    updateSettingsMutation.mutate(values, {
      onSuccess: () => {
        addToast("Portal configurations updated successfully.", "success", "Settings Saved");
        // Reset dirty state
        reset(values);
      },
      onError: () => {
        addToast("Failed to save settings variables.", "error", "Operation Failed");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="pb-2 border-b border-border/20">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 mt-1.5" />
        </div>
        <Skeleton className="h-10 w-96 rounded-xl" />
        <Skeleton className="h-[350px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/20">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure e-commerce shop parameters, default currency, and tax regulations.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-2 max-w-md rounded-xl bg-muted/60 border border-border/30 p-1">
            <TabsTrigger value="general" className="rounded-lg font-semibold flex items-center gap-2">
              <Store className="h-4 w-4" />
              General Shop
            </TabsTrigger>
            <TabsTrigger value="billing" className="rounded-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing & Taxes
            </TabsTrigger>
          </TabsList>

          {/* GENERAL TAB */}
          <TabsContent value="general" className="mt-4 focus-visible:outline-none">
            <Card className="rounded-2xl border-border/40 bg-card/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <Store className="h-5 w-5 text-indigo-500" />
                  Store Identity Details
                </CardTitle>
                <CardDescription>
                  Configure core identity fields displayed in client interfaces and invoices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="storeName" className="font-bold">E-Commerce Store Name</Label>
                  <Input
                    id="storeName"
                    type="text"
                    {...register("storeName")}
                    placeholder="e.g. ModFirst Tech Shop"
                    className="mt-1 bg-card/50"
                  />
                  {errors.storeName && (
                    <p className="text-xs text-rose-500 font-medium mt-1">{errors.storeName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="supportEmail" className="font-bold">Support Email Address</Label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <Input
                      id="supportEmail"
                      type="email"
                      {...register("supportEmail")}
                      placeholder="e.g. support@modfirst.com"
                      className="pl-9 bg-card/50"
                    />
                  </div>
                  {errors.supportEmail && (
                    <p className="text-xs text-rose-500 font-medium mt-1">{errors.supportEmail.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BILLING TAB */}
          <TabsContent value="billing" className="mt-4 focus-visible:outline-none">
            <Card className="rounded-2xl border-border/40 bg-card/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <CreditCard className="h-5 w-5 text-purple-500" />
                  Billing & Fiscal Rates
                </CardTitle>
                <CardDescription>
                  Specify default pricing currencies and taxation values computed during checkouts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency" className="font-bold">Default Store Currency</Label>
                    <div className="mt-1">
                      <Select
                        onValueChange={(val) => {
                          if (val) setValue("currency", val, { shouldDirty: true });
                        }}
                        value={watch("currency") || "USD"}
                      >
                        <SelectTrigger id="currency" className="bg-card/50">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="USD">USD ($) United States Dollar</SelectItem>
                          <SelectItem value="EUR">EUR (€) Euro</SelectItem>
                          <SelectItem value="GBP">GBP (£) British Pound</SelectItem>
                          <SelectItem value="JPY">JPY (¥) Japanese Yen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="taxRate" className="font-bold">Sales Tax Percentage (%)</Label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <Input
                        id="taxRate"
                        type="number"
                        step="0.01"
                        {...register("taxRate", { valueAsNumber: true })}
                        placeholder="0.00"
                        className="pl-9 bg-card/50"
                      />
                    </div>
                    {errors.taxRate && (
                      <p className="text-xs text-rose-500 font-medium mt-1">{errors.taxRate.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Bar */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-muted/20 backdrop-blur-md">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 select-none">
            {isDirty ? (
              <>
                <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                <span>You have unsaved changes in settings.</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>All settings are currently up to date.</span>
              </>
            )}
          </div>
          <Button
            type="submit"
            disabled={!isDirty || updateSettingsMutation.isPending}
            className="rounded-xl font-medium shadow-md shadow-primary/10 transition-all"
          >
            {updateSettingsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving Changes...
              </>
            ) : (
              "Save Configurations"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
