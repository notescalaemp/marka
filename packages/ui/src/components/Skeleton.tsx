import { cn } from "../utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-marka-graphite/10",
        className
      )}
    />
  );
}
