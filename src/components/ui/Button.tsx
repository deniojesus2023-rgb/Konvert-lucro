"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "default" | "compact";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[8px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-primary disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none";

const SIZES: Record<ButtonSize, string> = {
  default: "min-h-[44px] px-6 py-3 text-base",
  compact: "min-h-[40px] px-4 py-2 text-sm",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-blue-primary text-white hover:bg-[#0f5adb]",
  secondary: "border border-line-strong bg-transparent text-ink hover:border-ink-faint",
  ghost: "bg-transparent text-blue-primary underline-offset-4 hover:underline",
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
}

type AsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & { href?: undefined };
type AsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className"> & { href: string };

export type ButtonProps = AsButton | AsLink;

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "default", fullWidth, children, className, href, ...rest } =
    props;
  const classes = [BASE, SIZES[size], VARIANTS[variant], fullWidth ? "w-full" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
