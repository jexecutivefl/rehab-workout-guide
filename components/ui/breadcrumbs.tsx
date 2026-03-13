import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  separator?: React.ReactNode;
}

const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ className, separator = "/", children, ...props }, ref) => {
    return (
      <nav ref={ref} aria-label="Breadcrumb" className={cn("flex", className)} {...props}>
        <ol className="inline-flex items-center space-x-1 md:space-x-3">{children}</ol>
      </nav>
    );
  }
);

Breadcrumbs.displayName = "Breadcrumbs";

interface BreadcrumbItemProps extends HTMLAttributes<HTMLLIElement> {
  active?: boolean;
  href?: string;
}

const BreadcrumbItem = forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ className, active = false, href, children, ...props }, ref) => {
    return (
      <li ref={ref} className={cn("inline-flex items-center", className)} {...props}>
        {href && !active ? (
          <a
            href={href}
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
          >
            {children}
          </a>
        ) : (
          <span
            className={cn(
              "text-sm font-medium",
              active ? "text-gray-500 dark:text-gray-400" : "text-gray-700 dark:text-gray-300"
            )}
          >
            {children}
          </span>
        )}
      </li>
    );
  }
);

BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbSeparator = forwardRef<HTMLLIElement, HTMLAttributes<HTMLLIElement>>(
  ({ className, children = "/", ...props }, ref) => {
    return (
      <li ref={ref} className={cn("text-gray-400", className)} aria-hidden="true" {...props}>
        {children}
      </li>
    );
  }
);

BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

export { Breadcrumbs, BreadcrumbItem, BreadcrumbSeparator };
