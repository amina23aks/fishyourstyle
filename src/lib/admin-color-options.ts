export type LabeledColor = { hex: string; labelFr?: string };

export function formatAdminColorOption(color: LabeledColor): string {
  const hex = color.hex.trim();
  const label = color.labelFr?.trim();
  return label ? `${label} — ${hex}` : hex;
}

export function normalizeAdminProductColors(value: unknown): Array<LabeledColor & { image?: string }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string") return item.trim() ? [{ hex: item.trim() }] : [];
    if (!item || typeof item !== "object") return [];
    const data = item as { hex?: unknown; id?: unknown; labelFr?: unknown; label?: unknown; image?: unknown };
    const hex =
      (typeof data.hex === "string" && data.hex.trim()) ||
      (typeof data.id === "string" && data.id.trim()) || "";
    if (!hex) return [];
    const labelFr =
      (typeof data.labelFr === "string" && data.labelFr.trim()) ||
      (typeof data.label === "string" && data.label.trim()) || undefined;
    const image = typeof data.image === "string" && data.image.trim() ? data.image.trim() : undefined;
    return [{ hex, ...(labelFr ? { labelFr } : {}), ...(image ? { image } : {}) }];
  });
}
