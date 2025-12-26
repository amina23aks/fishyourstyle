export type FirestoreTimestampValue =
  | FirebaseFirestore.Timestamp
  | FirebaseFirestore.FieldValue
  | {
      seconds: number;
      nanoseconds: number;
    };

export type FavoriteItem = {
  id: string; // product id
  slug: string;
  name: string;
  image: string;
  price: number;
  currency: string;
  inStock: boolean;
  addedAt: FirestoreTimestampValue | string;
  productId?: string; // backward compatibility
};

export type FavoriteItemClient = Omit<FavoriteItem, "addedAt"> & {
  addedAt: string | null;
};

export type FavoriteDocument = {
  id: string;
  uid: string | null;
  email: string | null;
  items: FavoriteItem[];
  createdAt: FirestoreTimestampValue;
  updatedAt: FirestoreTimestampValue;
};

export type FavoritesAdminRow = {
  id: string;
  email: string;
  userId: string;
  count: number;
  updatedAt: string | null;
  items: FavoriteItemClient[];
};

export type FavoriteProductStat = {
  productId: string;
  name: string;
  image: string;
  slug: string;
  count: number;
};
