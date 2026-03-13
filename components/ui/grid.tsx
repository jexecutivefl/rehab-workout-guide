import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: "none" | "sm" | "md" | "lg" | "xl";
}

const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols = 1, gap = "md", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          cols === 1 && "grid-cols-1",
          cols === 2 && "grid-cols-1 md:grid-cols-2",
          cols === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          cols === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
          cols === 6 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
          cols === 12 && "grid-cols-4 md:grid-cols-6 lg:grid-cols-12",
          gap === "none" && "gap-0",
          gap === "sm" && "gap-2",
          gap === "md" && "gap-4",
          gap === "lg" && "gap-6",
          gap === "xl" && "gap-8",
          className
        )}
        {...props}
      />
    );
  }
);

Grid.displayName = "Grid";

export { Grid };
