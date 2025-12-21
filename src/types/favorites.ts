export type FavoriteItem = {
  productId: string; // Firestore product doc id
  slug: string; // product slug
  name: string;
  image: string; // main image URL
  price: number;
  currency: string;
  inStock: boolean; // from product doc
  addedAt: string; // ISO timestamp
};

export type UserFavoritesDoc = {
  email: string | null;
  items: FavoriteItem[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};
