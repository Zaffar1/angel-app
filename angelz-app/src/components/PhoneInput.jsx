import { Controller } from "react-hook-form";
import { formatUSPhoneNumber, stripPhone } from "../utils/phoneUtils";

export function PhoneInput({ control, name, label, error, ...props }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value, ref } }) => {
        const rawDigits = stripPhone(value || "");

        return (
          <div className="mb-4">
            {label && (
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
            )}
            <input
              ref={ref}
              value={formatUSPhoneNumber(rawDigits)}
              onChange={(e) => {
                const digits = stripPhone(e.target.value).slice(0, 10);
                onChange(digits);
              }}
              onBlur={onBlur}
              maxLength={14}
              placeholder="(123) 456-7890"
              className={`w-full border px-3 py-2 bg-white rounded-lg ${error ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-blue-400`}
              {...props}
            />
            {error && (
              <p className="text-xs text-red-500 mt-1">{error.message}</p>
            )}
          </div>
        );
      }}
    />
  );
}
