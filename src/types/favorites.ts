import type { Timestamp } from "firebase-admin/firestore";

export type FavoriteItem = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  currency: string;
  colorName?: string;
  colorCode?: string;
  size?: string;
  variantKey: string;
  addedAt: string;
};

export type FavoriteItemFirestore = Omit<FavoriteItem, "addedAt"> & {
  addedAt: Timestamp | FirebaseFirestore.FieldValue | string;
};

export type FavoriteDocument = {
  userId: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
  items: FavoriteItem[];
};

export type FavoriteDocumentFirestore = Omit<FavoriteDocument, "items" | "createdAt" | "updatedAt"> & {
  items: FavoriteItemFirestore[];
  createdAt: Timestamp | FirebaseFirestore.FieldValue | string;
  updatedAt: Timestamp | FirebaseFirestore.FieldValue | string;
};
