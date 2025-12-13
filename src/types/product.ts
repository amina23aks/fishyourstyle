/**
 * Product categories available in the store.
 */
export type ProductCategory = string;

/**
 * Product color variant with bilingual labels and image.
 */
export type ProductColor = {
  /** Unique color identifier (e.g., "black", "grey") */
  id: string;
  /** French color label */
  labelFr: string;
  /** Arabic color label (optional) */
  labelAr?: string;
  /** Image URL for this color variant (optional) */
  image?: string;
};

/**
 * Product image structure with main image and gallery.
 */
export type ProductImages = {
  /** Main product image URL */
  main: string;
  /** Array of additional gallery image URLs */
  gallery: string[];
};

/**
 * Complete product definition matching the products.json structure.
 * All products are stored in JSON and loaded via src/lib/products.ts.
 */
export type Product = {
  /** Unique product identifier */
  id: string;
  /** URL-friendly product slug */
  slug: string;
  /** French product name */
  nameFr: string;
  /** Arabic product name */
  nameAr: string;
  /** Product category */
  category: ProductCategory;
  /** Product kind/type (e.g., "hoodie", "pants") */
  kind: string;
  /** Fit style (e.g., "regular", "oversized") */
  fit: string;
  /** Price in Algerian Dinar */
  priceDzd: number;
  /** Currency code (always "DZD") */
  currency: "DZD";
  /** Target gender (e.g., "unisex") */
  gender: string;
  /** Available sizes array */
  sizes: string[];
  /** Available color variants */
  colors: ProductColor[];
  /** Product images */
  images: ProductImages;
  /** French product description */
  descriptionFr: string;
  /** Arabic product description */
  descriptionAr: string;
  /** Product status - only "active" products are shown */
  status: "active" | "inactive";
  /** Optional design theme for filtering */
  designTheme?: string;
  /** Optional search tags */
  tags?: string[];
  /** Discount percent (0-100) */
  discountPercent?: number;
  /** Current available stock */
  stock?: number;
  /** Whether the product is available for purchase */
  inStock?: boolean;
};
