import { useEffect } from "react";
import Portal from "./Portal";

export default function ConfirmDialog({ open, title, message, onConfirm, onClose }) {
  useEffect(() => {
    if (!open) return;

    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-white rounded-lg shadow-xl p-5 w-80">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600 mt-2">{message}</p>

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
            >
              No
            </button>

            <button
              onClick={() => {
                onConfirm?.();
                onClose?.();
              }}
              className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
