import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = "lg", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto w-full px-4 sm:px-6 lg:px-8",
          size === "sm" && "max-w-2xl",
          size === "md" && "max-w-4xl",
          size === "lg" && "max-w-6xl",
          size === "xl" && "max-w-7xl",
          size === "full" && "max-w-full",
          className
        )}
        {...props}
      />
    );
  }
);

Container.displayName = "Container";

export { Container };
