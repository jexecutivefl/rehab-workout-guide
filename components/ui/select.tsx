import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  helperText?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, helperText, children, ...props }, ref) => {
    return (
      <div className="w-full">
        <select
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            "bg-white dark:bg-gray-900",
            "border-gray-300 dark:border-gray-700",
            "focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none",
            error && "border-red-500 focus:ring-red-500 dark:border-red-500",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {helperText && (
          <p
            className={cn(
              "mt-1 text-sm",
              error ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
