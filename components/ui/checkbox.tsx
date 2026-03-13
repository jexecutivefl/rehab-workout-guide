import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex items-center">
        <input
          type="checkbox"
          id={checkboxId}
          ref={ref}
          className={cn(
            "h-4 w-4 rounded border transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            "border-gray-300 dark:border-gray-700",
            "text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "bg-white dark:bg-gray-900",
            error && "border-red-500 focus:ring-red-500 dark:border-red-500",
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={checkboxId}
            className={cn(
              "ml-2 text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              error ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"
            )}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
