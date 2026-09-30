import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export function InputField({ label, error, helperText, type = "text", disabled, className = "", ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={props.name} className="block text-gray-700 text-sm font-medium mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={props.name}
          type={isPassword && showPassword ? "text" : type}
          disabled={disabled}
          className={`w-full border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400
            ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white"}
            ${error ? "border-red-500" : "border-gray-300"}
            ${className.includes('rounded-') ? '' : 'rounded-lg'} ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showPassword ? <FaEye size={18} /> : <FaEyeSlash size={18} />}
          </button>
        )}
      </div>

      {(error || helperText) && (
        <p className={`text-sm mt-1 ${error ? "text-red-500" : "text-gray-500"}`}>{error || helperText}</p>
      )}
    </div>
  );
}
