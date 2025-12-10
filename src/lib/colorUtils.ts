/**
 * Utility to convert colorCode (from cart/orders) to hex value.
 * colorCode can be either a hex string (#xxxxxx) or a color name/label.
 */
export function colorCodeToHex(colorCode: string): string {
  // If it's already a hex string, return it
  if (/^#([0-9A-F]{3}){1,2}$/i.test(colorCode)) {
    return colorCode;
  }

  // Map common color names to hex values
  const colorMap: Record<string, string> = {
    noir: "#1f2937",
    black: "#111827",
    blanc: "#f9fafb",
    white: "#f9fafb",
    gris: "#9ca3af",
    gray: "#9ca3af",
    grey: "#9ca3af",
    rouge: "#dc2626",
    red: "#ef4444",
    bleu: "#2563eb",
    blue: "#2563eb",
    vert: "#16a34a",
    green: "#22c55e",
    beige: "#d6c9a5",
    beigeclair: "#e5d5b5",
  };

  const normalized = colorCode.toLowerCase().replace(/\s+/g, "");
  return colorMap[normalized] ?? colorCode ?? "#e5e7eb";
}

