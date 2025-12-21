export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  currency: string;
  colorName?: string;
  colorCode?: string;
  size?: string;
  variantKey?: string;
  addedAt: string;
}

export interface WishlistDocument {
  userId: string | null;
  email: string;
  createdAt: string;
  updatedAt: string;
  items: WishlistItem[];
}
