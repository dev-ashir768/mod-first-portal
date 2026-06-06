import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore, Product, Order, StoreSettings } from "@/store/useStore";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      await delay(600);
      return useStore.getState().products;
    },
  });
}

export function useAddProduct() {
  const queryClient = useQueryClient();
  const addProduct = useStore((state) => state.addProduct);
  return useMutation({
    mutationFn: async (newProduct: Omit<Product, "id">) => {
      await delay(800);
      addProduct(newProduct);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const updateProduct = useStore((state) => state.updateProduct);
  return useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: Partial<Product> }) => {
      await delay(800);
      updateProduct(id, fields);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const deleteProduct = useStore((state) => state.deleteProduct);
  return useMutation({
    mutationFn: async (id: string) => {
      await delay(600);
      deleteProduct(id);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      await delay(600);
      return useStore.getState().orders;
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const updateOrderStatus = useStore((state) => state.updateOrderStatus);
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Order["status"] }) => {
      await delay(800);
      updateOrderStatus(id, status);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      await delay(600);
      return useStore.getState().customers;
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      await delay(400);
      return useStore.getState().settings;
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const updateSettings = useStore((state) => state.updateSettings);
  return useMutation({
    mutationFn: async (newSettings: StoreSettings) => {
      await delay(800);
      updateSettings(newSettings);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
