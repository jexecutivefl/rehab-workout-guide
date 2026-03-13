"use client";

import { HTMLAttributes, forwardRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface NavbarProps extends HTMLAttributes<HTMLElement> {
  fixed?: boolean;
}

const Navbar = forwardRef<HTMLElement, NavbarProps>(
  ({ className, fixed = false, children, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn(
          "w-full border-b bg-white dark:bg-gray-900",
          "border-gray-200 dark:border-gray-800",
          fixed && "fixed top-0 right-0 left-0 z-50",
          className
        )}
        {...props}
      >
        {children}
      </nav>
    );
  }
);

Navbar.displayName = "Navbar";

const NavbarContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8",
          className
        )}
        {...props}
      />
    );
  }
);

NavbarContent.displayName = "NavbarContent";

const NavbarBrand = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center text-xl font-semibold", className)}
        {...props}
      />
    );
  }
);

NavbarBrand.displayName = "NavbarBrand";

const NavbarMenu = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("hidden items-center space-x-6 md:flex", className)}
        {...props}
      />
    );
  }
);

NavbarMenu.displayName = "NavbarMenu";

interface NavbarToggleProps extends HTMLAttributes<HTMLButtonElement> {
  onToggle?: () => void;
  isOpen?: boolean;
}

const NavbarToggle = forwardRef<HTMLButtonElement, NavbarToggleProps>(
  ({ className, onToggle, isOpen = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "inline-flex items-center justify-center rounded-md p-2 md:hidden",
          "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
          "dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100",
          className
        )}
        onClick={onToggle}
        aria-expanded={isOpen}
        {...props}
      >
        <span className="sr-only">Open main menu</span>
        {/* Hamburger icon */}
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          )}
        </svg>
      </button>
    );
  }
);

NavbarToggle.displayName = "NavbarToggle";

interface NavbarMobileMenuProps extends HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean;
}

const NavbarMobileMenu = forwardRef<HTMLDivElement, NavbarMobileMenuProps>(
  ({ className, isOpen = false, ...props }, ref) => {
    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "border-t border-gray-200 md:hidden dark:border-gray-800",
          "bg-white dark:bg-gray-900",
          className
        )}
        {...props}
      />
    );
  }
);

NavbarMobileMenu.displayName = "NavbarMobileMenu";

export { Navbar, NavbarContent, NavbarBrand, NavbarMenu, NavbarToggle, NavbarMobileMenu };
