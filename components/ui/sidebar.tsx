"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface SidebarProps extends HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean;
  position?: "left" | "right";
}

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, collapsed = false, position = "left", ...props }, ref) => {
    return (
      <aside
        ref={ref}
        className={cn(
          "flex h-full flex-col border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900",
          position === "left" && "border-r",
          position === "right" && "border-l",
          collapsed ? "w-16" : "w-64",
          "transition-all duration-300",
          className
        )}
        {...props}
      />
    );
  }
);

Sidebar.displayName = "Sidebar";

const SidebarHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-16 items-center border-b border-gray-200 px-4 dark:border-gray-800",
          className
        )}
        {...props}
      />
    );
  }
);

SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("flex-1 overflow-y-auto py-4", className)} {...props} />;
  }
);

SidebarContent.displayName = "SidebarContent";

const SidebarFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("border-t border-gray-200 px-4 py-4 dark:border-gray-800", className)}
        {...props}
      />
    );
  }
);

SidebarFooter.displayName = "SidebarFooter";

interface SidebarItemProps extends HTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
  icon?: React.ReactNode;
}

const SidebarItem = forwardRef<HTMLAnchorElement, SidebarItemProps>(
  ({ className, active = false, icon, children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={cn(
          "flex items-center space-x-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
          className
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
      </a>
    );
  }
);

SidebarItem.displayName = "SidebarItem";

const SidebarGroup = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("space-y-1 px-2", className)} {...props} />;
  }
);

SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "px-2 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400",
          className
        )}
        {...props}
      />
    );
  }
);

SidebarGroupLabel.displayName = "SidebarGroupLabel";

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarItem,
  SidebarGroup,
  SidebarGroupLabel,
};
