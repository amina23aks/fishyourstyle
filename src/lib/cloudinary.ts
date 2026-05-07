export async function uploadImageToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration is missing. Please set cloud name and upload preset.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload image to Cloudinary: ${errorText}`);
  }

  const data = (await response.json()) as { secure_url?: string; url?: string };
  const imageUrl = data.secure_url ?? data.url;

  if (!imageUrl) {
    throw new Error("Cloudinary did not return an image URL.");
  }

  return imageUrl;
}

export type CloudinaryUploadResult = {
  url: string;
  publicId: string | null;
};

type CloudinaryDeliveryOptions = {
  /** Pixel width for image contexts that are always small, such as thumbnails. */
  width?: number;
  /** Cloudinary q_auto variant. Defaults to automatic quality without forcing aggressive compression. */
  quality?: "auto" | "auto:good" | "auto:best";
};

const CLOUDINARY_UPLOAD_SEGMENT = "/image/upload/";
const CLOUDINARY_TRANSFORM_PREFIX = /^(?:[a-z]_|c_|dpr_|e_|fl_|g_|h_|l_|o_|q_|r_|t_|w_|x_|y_|z_)/;

function isCloudinaryImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "res.cloudinary.com" && parsed.pathname.includes(CLOUDINARY_UPLOAD_SEGMENT);
  } catch {
    return false;
  }
}

function hasTransformationSegment(segment: string): boolean {
  return segment.split(",").some((part) => CLOUDINARY_TRANSFORM_PREFIX.test(part));
}

/**
 * Adds safe Cloudinary delivery transformations to product imagery without changing
 * product data, IDs, filtering, or gallery behavior. Non-Cloudinary/local URLs are
 * returned untouched so existing fallbacks keep working.
 */
export function getCloudinaryDeliveryUrl(url: string, options: CloudinaryDeliveryOptions = {}): string {
  if (!url || !isCloudinaryImageUrl(url)) return url;

  const quality = options.quality ?? "auto";
  const transformations = ["f_auto", `q_${quality}`];
  if (options.width) {
    transformations.push(`w_${options.width}`, "c_limit");
  }

  try {
    const parsed = new URL(url);
    const [prefix, suffix] = parsed.pathname.split(CLOUDINARY_UPLOAD_SEGMENT);
    if (!suffix) return url;

    const segments = suffix.split("/");
    const firstSegment = segments[0] ?? "";
    const insertIndex = hasTransformationSegment(firstSegment) ? 1 : 0;
    const existingTransforms = insertIndex === 1 ? firstSegment.split(",") : [];
    const additions = transformations.filter((transform) => {
      if (transform === "f_auto") return !existingTransforms.includes("f_auto");
      if (transform.startsWith("q_")) return !existingTransforms.some((existing) => existing.startsWith("q_"));
      if (transform.startsWith("w_")) return !existingTransforms.some((existing) => existing.startsWith("w_"));
      if (transform === "c_limit") return !existingTransforms.includes("c_limit");
      return !existingTransforms.includes(transform);
    });

    if (additions.length === 0) return url;

    if (insertIndex === 1) {
      segments[0] = [...existingTransforms, ...additions].join(",");
    } else {
      segments.unshift(additions.join(","));
    }

    parsed.pathname = `${prefix}${CLOUDINARY_UPLOAD_SEGMENT}${segments.join("/")}`;
    return parsed.toString();
  } catch {
    return url;
  }
}

export async function uploadImageToCloudinaryWithMetadata(file: File): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration is missing. Please set cloud name and upload preset.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload image to Cloudinary: ${errorText}`);
  }

  const data = (await response.json()) as { secure_url?: string; url?: string; public_id?: string };
  const imageUrl = data.secure_url ?? data.url;

  if (!imageUrl) {
    throw new Error("Cloudinary did not return an image URL.");
  }

  return { url: imageUrl, publicId: data.public_id ?? null };
}
