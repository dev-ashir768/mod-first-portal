import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  price: z.number().positive("Price must be a positive number"),
  stock: z.number().nonnegative("Stock cannot be negative").int("Stock must be an integer"),
  sku: z.string().min(3, "SKU must be at least 3 characters"),
  status: z.enum(["active", "draft", "archived"]),
  image: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const settingsSchema = z.object({
  storeName: z.string().min(3, "Store name must be at least 3 characters"),
  supportEmail: z.string().email("Invalid email address"),
  currency: z.string().min(1, "Currency is required"),
  taxRate: z.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100"),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
