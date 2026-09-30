import { SERVER_URL } from "./envConfig";

export const getImageUrl = (src) => {
  if (!src) return null;
  if (src instanceof File) return URL.createObjectURL(src);
  if (typeof src === "string") {
    if (src.startsWith("http") || src.startsWith("data:")) return src;
    
    // Use SERVER_URL (root without /api for static assets like /uploads)
    const baseUrl = SERVER_URL?.endsWith("/") ? SERVER_URL.slice(0, -1) : SERVER_URL;
    const path = src.startsWith("/") ? src : `/${src}`;
    
    return `${baseUrl}${path}`;
  }
  return null;
};

