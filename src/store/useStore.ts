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
    name: "Premium Leather Backpack",
    description: "Handcrafted full-grain leather backpack. Features a padded 15-inch laptop compartment, weather-resistant lining, and solid brass hardware.",
    sku: "BG-LTH-01",
    price: 129.99,
    stock: 42,
    category: "Accessories",
    status: "active",
    image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "p2",
    name: "Wireless Noise-Cancelling Headphones",
    description: "Over-ear bluetooth headphones with industry-leading active noise cancellation, 30-hour battery life, and crystal-clear microphone audio.",
    sku: "HP-WRL-02",
    price: 249.99,
    stock: 15,
    category: "Electronics",
    status: "active",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "p3",
    name: "Minimalist Quartz Watch",
    description: "Sleek time-piece with a Japanese quartz movement, stainless steel slim case, and an interchangeable Italian leather strap. Water-resistant up to 50m.",
    sku: "WT-QRT-03",
    price: 89.50,
    stock: 0,
    category: "Accessories",
    status: "active",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "p4",
    name: "Ergonomic Office Chair",
    description: "High-back mesh office chair featuring adjustable lumbar support, 3D armrests, dynamic tilt tension mechanism, and silent rolling casters.",
    sku: "CH-ERG-04",
    price: 349.00,
    stock: 8,
    category: "Furniture",
    status: "active",
    image: "https://images.unsplash.com/photo-1505843513577-22bb7897beca?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "p5",
    name: "Smart Fitness Band",
    description: "Waterproof fitness tracker with 24/7 heart rate monitor, sleep tracking, built-in GPS, and up to 7 days of continuous battery life.",
    sku: "FB-SMR-05",
    price: 49.99,
    stock: 120,
    category: "Electronics",
    status: "draft",
    image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&auto=format&fit=crop&q=60"
  }
];

const initialOrders: Order[] = [
  {
    id: "ORD-001",
    customerName: "Sarah Connor",
    customerEmail: "sarah@sky.net",
    items: [{ id: "p1", name: "Premium Leather Backpack", quantity: 1, price: 129.99 }],
    totalAmount: 129.99,
    status: "completed",
    createdAt: "2026-06-05T10:14:00Z"
  },
  {
    id: "ORD-002",
    customerName: "John Doe",
    customerEmail: "john.doe@gmail.com",
    items: [
      { id: "p2", name: "Wireless Noise-Cancelling Headphones", quantity: 1, price: 249.99 },
      { id: "p3", name: "Minimalist Quartz Watch", quantity: 1, price: 89.50 }
    ],
    totalAmount: 339.49,
    status: "processing",
    createdAt: "2026-06-06T08:30:00Z"
  },
  {
    id: "ORD-003",
    customerName: "Alice Smith",
    customerEmail: "alice@example.com",
    items: [{ id: "p3", name: "Minimalist Quartz Watch", quantity: 2, price: 89.50 }],
    totalAmount: 179.00,
    status: "pending",
    createdAt: "2026-06-06T12:00:00Z"
  },
  {
    id: "ORD-004",
    customerName: "Bob Johnson",
    customerEmail: "bob@example.com",
    items: [{ id: "p4", name: "Ergonomic Office Chair", quantity: 1, price: 349.00 }],
    totalAmount: 349.00,
    status: "cancelled",
    createdAt: "2026-06-04T15:20:00Z"
  },
  {
    id: "ORD-005",
    customerName: "Clara Oswald",
    customerEmail: "clara.o@tardis.com",
    items: [
      { id: "p1", name: "Premium Leather Backpack", quantity: 1, price: 129.99 },
      { id: "p2", name: "Wireless Noise-Cancelling Headphones", quantity: 1, price: 249.99 }
    ],
    totalAmount: 379.98,
    status: "completed",
    createdAt: "2026-06-03T09:45:00Z"
  }
];

const initialCustomers: Customer[] = [
  { id: "c1", name: "Sarah Connor", email: "sarah@sky.net", ordersCount: 1, totalSpent: 129.99, joinedDate: "2026-05-10" },
  { id: "c2", name: "John Doe", email: "john.doe@gmail.com", ordersCount: 1, totalSpent: 339.49, joinedDate: "2026-05-15" },
  { id: "c3", name: "Alice Smith", email: "alice@example.com", ordersCount: 1, totalSpent: 179.00, joinedDate: "2026-05-20" },
  { id: "c4", name: "Bob Johnson", email: "bob@example.com", ordersCount: 1, totalSpent: 349.00, joinedDate: "2026-05-22" },
  { id: "c5", name: "Clara Oswald", email: "clara.o@tardis.com", ordersCount: 1, totalSpent: 379.98, joinedDate: "2026-06-01" }
];

export const useStore = create<PortalState>((set) => ({
  products: initialProducts,
  orders: initialOrders,
  customers: initialCustomers,
  settings: {
    storeName: "ModFirst Tech Shop",
    supportEmail: "support@modfirst.com",
    currency: "USD",
    taxRate: 8.25
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
