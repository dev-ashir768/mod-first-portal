"use client";

import React, { useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useMockData";
import { settingsSchema, SettingsFormValues } from "@/lib/schema";
import { useToast } from "@/store/useToast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Store, CreditCard, Loader2, Mail, Percent, CheckCircle2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReactSelect } from "@/components/ui/react-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();
  const { addToast } = useToast();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isDirty } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { storeName: "", supportEmail: "", currency: "USD", taxRate: 0 }
  });

  useEffect(() => {
    if (settings) reset({ storeName: settings.storeName, supportEmail: settings.supportEmail, currency: settings.currency, taxRate: settings.taxRate });
  }, [settings, reset]);

  const onSubmit = (values: SettingsFormValues) => {
    updateSettingsMutation.mutate(values, {
      onSuccess: () => {
        addToast("Settings saved successfully.", "success", "Saved");
        reset(values);
      },
      onError: () => addToast("Failed to save settings.", "error", "Error")
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="pb-3 border-b border-border">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-3 w-56 mt-1.5" />
        </div>
        <Skeleton className="h-8 w-64 rounded" />
        <Skeleton className="h-56 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Configure store, currency, and tax settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="max-w-xs bg-muted/60 border border-border p-0.5 h-8 rounded-md">
            <TabsTrigger value="general" className="text-xs h-7 rounded flex items-center gap-1.5 px-3">
              <Store className="h-3.5 w-3.5" /> General
            </TabsTrigger>
            <TabsTrigger value="billing" className="text-xs h-7 rounded flex items-center gap-1.5 px-3">
              <CreditCard className="h-3.5 w-3.5" /> Billing
            </TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general" className="mt-3 focus-visible:outline-none">
            <Card>
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Store className="h-4 w-4 text-blue-500" /> Store Identity
                </CardTitle>
                <CardDescription className="text-xs">Core identity fields shown in invoices and client interfaces.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input id="storeName" {...register("storeName")} placeholder="e.g. ModFirst DTF Shop" />
                  {errors.storeName && <p className="text-[11px] text-rose-500 font-medium">{errors.storeName.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                    <Input id="supportEmail" type="email" {...register("supportEmail")} placeholder="support@modfirst.com" className="pl-8" />
                  </div>
                  {errors.supportEmail && <p className="text-[11px] text-rose-500 font-medium">{errors.supportEmail.message}</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing" className="mt-3 focus-visible:outline-none">
            <Card>
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-purple-500" /> Billing & Taxes
                </CardTitle>
                <CardDescription className="text-xs">Default currency and tax rate applied at checkout.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="currency">Currency</Label>
                    <ReactSelect
                      options={[
                        { value: "USD", label: "USD ($) — US Dollar" },
                        { value: "EUR", label: "EUR (€) — Euro" },
                        { value: "GBP", label: "GBP (£) — British Pound" },
                        { value: "JPY", label: "JPY (¥) — Japanese Yen" },
                      ]}
                      value={{ value: watch("currency") || "USD", label: { USD: "USD ($) — US Dollar", EUR: "EUR (€) — Euro", GBP: "GBP (£) — British Pound", JPY: "JPY (¥) — Japanese Yen" }[watch("currency") || "USD"] }}
                      onChange={(opt) => { if (opt) setValue("currency", (opt as { value: string }).value, { shouldDirty: true }); }}
                      isSearchable={false}
                      inputId="currency"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                        <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                      </span>
                      <Input id="taxRate" type="number" step="0.01" {...register("taxRate", { valueAsNumber: true })} placeholder="0.00" className="pl-8" />
                    </div>
                    {errors.taxRate && <p className="text-[11px] text-rose-500 font-medium">{errors.taxRate.message}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save bar */}
        <div className="flex items-center justify-between px-3 py-2.5 rounded-md border border-border bg-muted/30">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 select-none">
            {isDirty ? (
              <><ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" /> Unsaved changes</>
            ) : (
              <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> All settings saved</>
            )}
          </div>
          <Button type="submit" disabled={!isDirty || updateSettingsMutation.isPending} size="sm">
            {updateSettingsMutation.isPending ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</>
            ) : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
