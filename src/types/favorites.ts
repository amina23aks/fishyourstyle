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

export type FavoriteDocument = {
  id: string;
  uid: string | null;
  email: string | null;
  items: FavoriteItem[];
  createdAt: FirestoreTimestampValue;
  updatedAt: FirestoreTimestampValue;
};
