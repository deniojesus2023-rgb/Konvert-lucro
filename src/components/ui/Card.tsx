import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** A discreet, line-bounded block — thin border, no shadow, no fill. */
export function Card({ children, className, ...rest }: CardProps) {
  return (
    <div className={`rounded-[8px] border border-line px-5 py-4 ${className ?? ""}`} {...rest}>
      {children}
    </div>
  );
}
