import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: "vertical" | "horizontal";
  spacing?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
}

const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ className, direction = "vertical", spacing = "md", align, justify, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          direction === "vertical" && "flex-col",
          direction === "horizontal" && "flex-row",
          // Spacing
          direction === "vertical" && {
            "space-y-0": spacing === "none",
            "space-y-1": spacing === "xs",
            "space-y-2": spacing === "sm",
            "space-y-4": spacing === "md",
            "space-y-6": spacing === "lg",
            "space-y-8": spacing === "xl",
          },
          direction === "horizontal" && {
            "space-x-0": spacing === "none",
            "space-x-1": spacing === "xs",
            "space-x-2": spacing === "sm",
            "space-x-4": spacing === "md",
            "space-x-6": spacing === "lg",
            "space-x-8": spacing === "xl",
          },
          // Align items
          align === "start" && "items-start",
          align === "center" && "items-center",
          align === "end" && "items-end",
          align === "stretch" && "items-stretch",
          // Justify content
          justify === "start" && "justify-start",
          justify === "center" && "justify-center",
          justify === "end" && "justify-end",
          justify === "between" && "justify-between",
          justify === "around" && "justify-around",
          className
        )}
        {...props}
      />
    );
  }
);

Stack.displayName = "Stack";

export { Stack };
