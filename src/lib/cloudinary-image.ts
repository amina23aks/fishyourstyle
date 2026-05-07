const CLOUDINARY_HOST = "res.cloudinary.com";
const DEFAULT_THUMBNAIL_WIDTH = 520;
const DEFAULT_DETAIL_WIDTH = 1200;

const hasCloudinaryTransform = (segments: string[]) => {
  const uploadIndex = segments.indexOf("upload");
  if (uploadIndex === -1) return false;
  const nextSegment = segments[uploadIndex + 1];
  return Boolean(nextSegment && /(^|,)v?_?[^/]*[a-z]_[^/]+/.test(nextSegment));
};

export type CloudinaryImagePreset = "thumbnail" | "detail";

export function optimizeCloudinaryImageUrl(
  imageUrl: string | null | undefined,
  preset: CloudinaryImagePreset = "thumbnail",
): string {
  if (!imageUrl) return imageUrl ?? "";

  try {
    const url = new URL(imageUrl);
    if (url.hostname !== CLOUDINARY_HOST) return imageUrl;

    const segments = url.pathname.split("/").filter(Boolean);
    const uploadIndex = segments.indexOf("upload");
    if (uploadIndex === -1 || hasCloudinaryTransform(segments)) return imageUrl;

    const width = preset === "detail" ? DEFAULT_DETAIL_WIDTH : DEFAULT_THUMBNAIL_WIDTH;
    const transform = `f_auto,q_auto,c_limit,w_${width}`;
    segments.splice(uploadIndex + 1, 0, transform);
    url.pathname = `/${segments.join("/")}`;
    return url.toString();
  } catch {
    return imageUrl;
  }
}
