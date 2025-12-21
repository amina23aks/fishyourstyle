import type { Timestamp } from "firebase/firestore";

export type FavoriteItem = {
  productId: string; // Firestore product doc id
  slug: string; // product slug
  name: string;
  image: string; // main image URL
  price: number;
  currency: "DZD";
  inStock: boolean; // from product doc
  addedAt: Timestamp;
};

export type UserFavoritesDoc = {
  email: string | null;
  items: FavoriteItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
