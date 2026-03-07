export type Slug = {
  current: string;
};

export type AppImage = {
  _key: string;
  _type: "image";
  alt?: string | null;
  url?: string;
  asset?: {
    _ref: string;
    _type: "reference";
    url: string;
  };
};

export type Brand = {
  _id: string;
  title?: string;
  slug?: Slug;
  description?: string | null;
  image?: AppImage | null;
};

export type Category = {
  _id: string;
  title?: string;
  slug?: Slug;
  description?: string | null;
  range?: number | null;
  featured?: boolean | null;
  image?: AppImage | null;
  productCount?: number;
};

export type ProductBrand = Pick<Brand, "_id" | "title" | "slug" | "image">;

export type ProductStatusValue = "new" | "hot" | "sale";

export type Product = {
  _id: string;
  name?: string;
  slug?: Slug;
  images?: AppImage[];
  description?: string | null;
  price?: number;
  discount?: number;
  categories?: string[];
  stock?: number;
  status?: ProductStatusValue | null;
  isFeatured?: boolean;
  brand?: ProductBrand | null;
};

export type Address = {
  _id: string;
  name: string;
  email?: string;
  clerkUserId?: string;
  address: string;
  city: string;
  phone: string;
  state: string;
  zip: string;
  default: boolean;
  createdAt?: string;
};

export type OrderAddress = {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
};

export type OrderInvoice = {
  id?: string;
  number?: string;
  hosted_invoice_url?: string;
};

export type OrderProductSnapshot = {
  _id: string;
  name?: string;
  price?: number;
  images?: AppImage[];
};

export type MyOrder = {
  _id: string;
  _updatedAt?: string;
  orderNumber?: string;
  customerName?: string;
  email?: string;
  orderDate?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  totalPrice?: number;
  amountDiscount?: number;
  currency?: string;
  invoice?: OrderInvoice | null;
  address?: OrderAddress | null;
  products?: Array<{
    _key: string;
    quantity?: number;
    product?: OrderProductSnapshot | null;
  }>;
};

export type BRANDS_QUERYResult = Brand[];
export type MY_ORDERS_QUERYResult = MyOrder[];
