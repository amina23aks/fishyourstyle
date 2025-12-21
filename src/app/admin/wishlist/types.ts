import type { WishlistItem } from "@/types/wishlist";

export type AdminWishlistEntry = {
  id: string;
  email: string;
  userId: string | null;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
  items: WishlistItem[];
};
