import React from "react";

const Modal = ({ show, onClose, onConfirm, title }) => {
  if (!show) return null;

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-lg w-full">
          <div className="p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 text-center">{title}</h3>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 text-gray-900 rounded-md mr-2"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-admin_primary text-white rounded-md"
                onClick={onConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
