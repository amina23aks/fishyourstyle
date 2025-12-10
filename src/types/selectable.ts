export type SelectableOption = {
  id?: string;
  slug: string;
  name: string;
  isDefault?: boolean;
  type?: "category" | "design";
};
