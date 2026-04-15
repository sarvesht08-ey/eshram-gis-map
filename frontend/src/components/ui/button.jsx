import React from "react";

export const Button = ({ children, className = "", variant = "primary", size = "md", ...props }) => {
  let base = "rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-600";
  let variantClasses = "bg-blue-600 text-white hover:bg-blue-700";

  if (variant === "outline") {
    variantClasses = "border border-gray-300 text-gray-700 bg-white hover:bg-gray-100";
  } else if (variant === "secondary") {
    variantClasses = "bg-gray-100 text-gray-700 hover:bg-gray-200";
  }

  let sizeClasses = "px-4 py-2";
  if (size === "sm") sizeClasses = "px-2 py-1 text-sm";
  if (size === "lg") sizeClasses = "px-5 py-3 text-base";

  return (
    <button className={`${base} ${variantClasses} ${sizeClasses} ${className}`} {...props}>
      {children}
    </button>
  );
};
