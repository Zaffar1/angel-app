import { useRef } from "react";
import { FaCamera } from "react-icons/fa";
import { getImageUrl } from "../utils/getImageUrl";

export function ImageInput({ label, value, onChange, error, size = "avatar" }) {
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onChange(file);
  };

  const handleClick = () => fileRef.current.click();

  const resolveImage = (val) => {
    if (!val) return null;
    if (val instanceof File) return URL.createObjectURL(val);
    return getImageUrl(val);
  };

  const imageSrc = resolveImage(value);
  const isFull = size === "full";

  return (
    <div className="flex flex-col items-center gap-2 relative w-full">
      {label && <label className="block text-sm font-medium">{label}</label>}

      <div
        className={`relative overflow-hidden ${isFull ? "w-full" : "w-24 h-24"
          }`}
        onClick={handleClick}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="Preview"
            className={`object-cover border-2 border-purple-500 cursor-pointer ${isFull
              ? "w-full h-[220px] rounded-2xl"
              : "w-24 h-24 rounded-full"
              }`}
          />
        ) : (
          <div
            className={`flex items-center justify-center bg-indigo-600 transition-all cursor-pointer ${isFull
              ? "w-full h-[220px] rounded-2xl"
              : "w-24 h-24 rounded-full"
              }`}
          >
            <FaCamera size={isFull ? 48 : 24} className="text-white opacity-90" />
          </div>
        )}

        {imageSrc && (
          <span
            className={`absolute bg-indigo-600 p-2.5 rounded-full shadow-lg hover:bg-indigo-700 transition-all border-2 border-white ${isFull ? "right-4 bottom-4" : "right-1 bottom-1"
              }`}
          >
            <FaCamera className="text-white" size={isFull ? 18 : 12} />
          </span>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
