import { CgSpinner } from "react-icons/cg";

export function ThemeButton({
    children,
    isLoading = false,
    disabled = false,
    bgColor = "bg-blue-500",
    hoverColor,
    textColor = "text-white",
    className = "",
    fullWidth = true,
    width,
    ...props
}) {
    const hover =
        hoverColor ||
        (bgColor.includes("gray")
            ? "hover:bg-gray-300"
            : bgColor.includes("red")
                ? "hover:bg-red-600"
                : "hover:bg-blue-600");

    return (
        <button
            disabled={disabled || isLoading}
            className={`${fullWidth ? "w-full" : "w-auto"} 
                ${width ? width : ""} 
                flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-150
                ${bgColor} ${hover} ${textColor} 
                ${disabled || isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                ${className}`}
            {...props}
        >
            {isLoading ? (
                <span className="animate-spin">
                    <CgSpinner size={20} />
                </span>
            ) : (
                children
            )}
        </button>
    );
}
