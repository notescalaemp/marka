import Image from "next/image";
import { cn } from "@/lib/cn";

type BrandLogoProps = {
  tone?: "dark" | "light";
  href?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function BrandLogo({
  tone = "dark",
  href = "/",
  className,
  imageClassName,
  priority = false,
}: BrandLogoProps) {
  const src = tone === "light" ? "/brand/markalogo.png" : "/brand/markaialogopreta.png";
  const image = (
    <Image
      src={src}
      alt="Marka"
      width={2172}
      height={724}
      priority={priority}
      className={cn("h-8 w-auto sm:h-9", imageClassName)}
    />
  );

  if (!href) {
    return <span className={cn("inline-flex items-center", className)}>{image}</span>;
  }

  return (
    <a href={href} className={cn("inline-flex items-center", className)} aria-label="Marka, ir para o início">
      {image}
    </a>
  );
}
