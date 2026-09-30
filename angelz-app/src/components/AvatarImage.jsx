import { useState } from "react";
import { getImageUrl } from "../utils/getImageUrl";

export function AvatarImage({ src, alt = "User", size = "40px", fallback }) {
  const [imgError, setImgError] = useState(false);
  const imageSrc = getImageUrl(src);

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const containerStyle = { 
    width: size, 
    height: size,
    minWidth: size,
    minHeight: size
  };

  return (
    <div 
      style={containerStyle} 
      className="rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-gray-100"
    >
      {imageSrc && !imgError ? (
        <img
          src={imageSrc}
          alt={alt}
          onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%" }}
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#4C95FF] to-[#2B61FF] flex items-center justify-center text-white font-bold text-[calc(var(--size)*0.4)]"
             style={{ fontSize: `calc(${size} * 0.4)` }}>
          {getInitials(alt)}
        </div>
      )}
    </div>
  );
}
