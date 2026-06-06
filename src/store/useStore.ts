import { create } from "zustand";

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  status: "active" | "draft" | "archived";
  image?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  ordersCount: number;
  totalSpent: number;
  joinedDate: string;
}

export interface StoreSettings {
  storeName: string;
  supportEmail: string;
  currency: string;
  taxRate: number;
}

interface PortalState {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  settings: StoreSettings;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  updateSettings: (settings: StoreSettings) => void;
}

const initialProducts: Product[] = [
  {
    id: "p1",
    name: 'Custom DTF Gang Sheet - 22" x 24"',
    description: "Create and print your custom designs on our premium DTF film. High-density color laydown, excellent stretchability, and durable wash tests.",
    sku: "DTF-GS-2224",
    price: 19.99,
    stock: 999,
    category: "DTF Gang Sheets",
    status: "active",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "p2",
    name: 'Custom DTF Gang Sheet - 22" x 60"',
    description: "Medium gang sheet for apparel printing. Upload designs or use our gang sheet builder to scale, rotate, and duplicate prints.",
    sku: "DTF-GS-2260",
    price: 44.99,
    stock: 999,
    category: "DTF Gang Sheets",
    status: "active",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "p3",
    name: "UV DTF Decal Sheet - A3 Size",
    description: "High-resolution UV DTF transfer sticker decals. Waterproof, scratch-resistant, and ideal for mugs, tumblers, wood, and hard surfaces.",
    sku: "UV-DEC-A3",
    price: 15.50,
    stock: 150,
    category: "UV DTF Decals",
    status: "active",
    image: "https://images.unsplash.com/photo-1572375995301-3b989d0e4d20?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "p4",
    name: 'Premium Hot Peel Transfer Film (24" x 100m)',
    description: "Commercial grade double-matte coated DTF roll. Fast hot-peeling reduces release time and increases print production throughput.",
    sku: "SUP-FLM-24",
    price: 189.00,
    stock: 12,
    category: "Print Supplies",
    status: "active",
    image: "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "p5",
    name: "Premium TPU DTF Powder (1kg)",
    description: "High quality white TPU adhesive powder. Formulated for a soft-hand feel, high flexibility, and maximum washing cycles.",
    sku: "SUP-PWD-01",
    price: 24.99,
    stock: 85,
    category: "Print Supplies",
    status: "active",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "p6",
    name: "ModFirst DTF Premium Ink Set (CMYK+W, 5L)",
    description: "Full ink refill kit with Cyan, Magenta, Yellow, Black, and Ultra-White pigment inks. Provides outstanding opacity and vivid print results.",
    sku: "SUP-INK-5L",
    price: 225.00,
    stock: 5,
    category: "Print Supplies",
    status: "draft",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=60"
  }
];

const initialOrders: Order[] = [
  {
    id: "ORD-001",
    customerName: "Sarah Connor",
    customerEmail: "sarah@sky.net",
    items: [{ id: "p1", name: 'Custom DTF Gang Sheet - 22" x 24"', quantity: 3, price: 19.99 }],
    totalAmount: 59.97,
    status: "completed",
    createdAt: "2026-06-05T10:14:00Z"
  },
  {
    id: "ORD-002",
    customerName: "John Doe",
    customerEmail: "john.doe@gmail.com",
    items: [
      { id: "p2", name: 'Custom DTF Gang Sheet - 22" x 60"', quantity: 2, price: 44.99 },
      { id: "p3", name: "UV DTF Decal Sheet - A3 Size", quantity: 2, price: 15.50 }
    ],
    totalAmount: 120.98,
    status: "processing",
    createdAt: "2026-06-06T08:30:00Z"
  },
  {
    id: "ORD-003",
    customerName: "Alice Smith",
    customerEmail: "alice@example.com",
    items: [{ id: "p3", name: "UV DTF Decal Sheet - A3 Size", quantity: 4, price: 15.50 }],
    totalAmount: 62.00,
    status: "pending",
    createdAt: "2026-06-06T12:00:00Z"
  },
  {
    id: "ORD-004",
    customerName: "Bob Johnson",
    customerEmail: "bob@example.com",
    items: [{ id: "p4", name: 'Premium Hot Peel Transfer Film (24" x 100m)', quantity: 1, price: 189.00 }],
    totalAmount: 189.00,
    status: "cancelled",
    createdAt: "2026-06-04T15:20:00Z"
  },
  {
    id: "ORD-005",
    customerName: "Clara Oswald",
    customerEmail: "clara.o@tardis.com",
    items: [
      { id: "p4", name: 'Premium Hot Peel Transfer Film (24" x 100m)', quantity: 1, price: 189.00 },
      { id: "p5", name: "Premium TPU DTF Powder (1kg)", quantity: 2, price: 24.99 }
    ],
    totalAmount: 238.98,
    status: "completed",
    createdAt: "2026-06-03T09:45:00Z"
  }
];

const initialCustomers: Customer[] = [
  { id: "c1", name: "Sarah Connor", email: "sarah@sky.net", ordersCount: 1, totalSpent: 59.97, joinedDate: "2026-05-10" },
  { id: "c2", name: "John Doe", email: "john.doe@gmail.com", ordersCount: 1, totalSpent: 120.98, joinedDate: "2026-05-15" },
  { id: "c3", name: "Alice Smith", email: "alice@example.com", ordersCount: 1, totalSpent: 62.00, joinedDate: "2026-05-20" },
  { id: "c4", name: "Bob Johnson", email: "bob@example.com", ordersCount: 1, totalSpent: 189.00, joinedDate: "2026-05-22" },
  { id: "c5", name: "Clara Oswald", email: "clara.o@tardis.com", ordersCount: 1, totalSpent: 238.98, joinedDate: "2026-06-01" }
];

export const useStore = create<PortalState>((set) => ({
  products: initialProducts,
  orders: initialOrders,
  customers: initialCustomers,
  settings: {
    storeName: "ModFirst DTF Transfers",
    supportEmail: "support@modfirst.com",
    currency: "USD",
    taxRate: 6.0
  },
  isAuthenticated: false,
  login: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false }),
  addProduct: (product) =>
    set((state) => {
      const newProduct: Product = {
        ...product,
        id: `p-${Date.now()}`
      };
      return { products: [newProduct, ...state.products] };
    }),
  updateProduct: (id, updatedFields) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...updatedFields } : p))
    })),
  deleteProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id)
    })),
  updateOrderStatus: (id, status) =>
    set((state) => {
      const updatedOrders = state.orders.map((o) => (o.id === id ? { ...o, status } : o));
      
      const targetOrder = state.orders.find((o) => o.id === id);
      let updatedCustomers = state.customers;

      if (targetOrder && targetOrder.status !== status) {
        updatedCustomers = state.customers.map((c) => {
          if (c.email === targetOrder.customerEmail) {
            let spentDiff = 0;
            if (targetOrder.status === "completed" && status !== "completed") {
              spentDiff = -targetOrder.totalAmount;
            }
            else if (targetOrder.status !== "completed" && status === "completed") {
              spentDiff = targetOrder.totalAmount;
            }
            
            return {
              ...c,
              totalSpent: Math.max(0, parseFloat((c.totalSpent + spentDiff).toFixed(2)))
            };
          }
          return c;
        });
      }

      return {
        orders: updatedOrders,
        customers: updatedCustomers
      };
    }),
  updateSettings: (settings) => set({ settings })
}));
