import { Star } from "lucide-react";
import { cn } from "../utils";

interface StarRatingProps {
  rating: number;
  size?: "sm" | "md";
  className?: string;
}

export function StarRating({
  rating,
  size = "sm",
  className,
}: StarRatingProps) {
  const full = Math.round(rating);
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${rating} de 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            sizeClass,
            i < full
              ? "fill-marka-green text-marka-green"
              : "text-marka-gray/50"
          )}
        />
      ))}
    </div>
  );
}
