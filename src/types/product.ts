export type ProductCategory =
  | "hoodies"
  | "pants"
  | "tshirts"
  | "sweatshirts"
  | "ensembles";

export type ProductColor = {
  id: string;
  labelFr: string;
  labelAr: string;
  image: string;
};

export type ProductImages = {
  main: string;
  gallery: string[];
};

export type Product = {
  id: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  category: ProductCategory;
  kind: string;
  fit: string;
  priceDzd: number;
  currency: "DZD";
  gender: string;
  sizes: string[];
  colors: ProductColor[];
  images: ProductImages;
  descriptionFr: string;
  descriptionAr: string;
  status: "active" | "inactive";
};
