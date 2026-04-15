import React from "react";

export const Badge = ({ children, className = "", variant = "default", ...props }) => {
  let variantClass = "bg-gray-100 text-gray-800";
  if (variant === "success") variantClass = "bg-emerald-100 text-emerald-700";
  if (variant === "warning") variantClass = "bg-yellow-100 text-amber-700";
  if (variant === "danger") variantClass = "bg-red-100 text-red-700";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClass} ${className}`} {...props}>
      {children}
    </span>
  );
};
