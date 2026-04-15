import React from "react";

export const Card = ({ children, className = "", ...props }) => {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardContent = ({ children, className = "", ...props }) => {
  return (
    <div className={`p-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = "", ...props }) => {
  return (
    <div className={`p-4 border-b border-gray-100 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = "", ...props }) => (
  <h3 className={`font-bold text-lg ${className}`} {...props}>
    {children}
  </h3>
);
