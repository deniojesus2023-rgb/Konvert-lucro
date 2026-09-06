import Image from "next/image";

interface LogoProps {
  className?: string;
  priority?: boolean;
}

/**
 * The official Konvert logo (`public/brand/konvert-logo-transparent.png`).
 * Never redrawn, re-vectorized, or substituted — always shown on a white
 * or very light background, at its original aspect ratio.
 */
export function Logo({ className, priority }: LogoProps) {
  return (
    <Image
      src="/brand/konvert-logo-transparent.png"
      alt="Konvert"
      width={867}
      height={251}
      priority={priority}
      className={className ?? "h-8 w-auto"}
    />
  );
}
