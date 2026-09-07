"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

/**
 * `primary`/`ghost` map straight onto the prototype's own `.primary-button`
 * and `.text-link` classes — pixel-identical to the reference by
 * construction. `secondary` has no prototype equivalent (only used by the
 * error-retry state) and keeps a plain bordered fallback.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "primary-button",
  secondary: "text-link",
  ghost: "text-link",
};

interface CommonProps {
  variant?: ButtonVariant;
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
  const { variant = "primary", fullWidth, children, className, href, ...rest } = props;
  const classes = [VARIANTS[variant], fullWidth ? "full" : "", className ?? ""].filter(Boolean).join(" ");

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
