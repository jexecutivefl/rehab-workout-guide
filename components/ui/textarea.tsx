import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  helperText?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm transition-colors placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50",
            "bg-white dark:bg-gray-900",
            "border-gray-300 dark:border-gray-700",
            "focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none",
            error && "border-red-500 focus:ring-red-500 dark:border-red-500",
            className
          )}
          {...props}
        />
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

Textarea.displayName = "Textarea";

export { Textarea };
