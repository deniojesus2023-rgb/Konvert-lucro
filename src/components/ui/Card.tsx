import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** A clean, discreet card: subtle border, very light shadow, no gradients. */
export function Card({ children, className, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-blue-light bg-white p-6 shadow-[0_1px_2px_rgba(11,31,58,0.06)] ${className ?? ""}`}
      {...rest}
    >
      {children}
    </div>
  );
}
