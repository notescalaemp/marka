import type { EstablishmentStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const STATUS_MAP: Record<EstablishmentStatus, "success" | "warning" | "default" | "danger"> = {
  active: "success",
  trial: "default",
  inactive: "default",
  suspended: "warning",
  canceled: "danger",
};

const tones: Record<string, string> = {
  success: "bg-marka-green-soft text-marka-green-dark",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-700",
  default: "bg-marka-off text-marka-graphite",
};

const dots: Record<string, string> = {
  success: "bg-marka-green",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  default: "bg-marka-gray",
};

export function StatusBadge({
  status,
}: {
  status: EstablishmentStatus | string;
}) {
  const tone = STATUS_MAP[status as EstablishmentStatus] ?? "default";
  const pulsing = tone === "warning" || tone === "danger";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        tones[tone]
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          dots[tone],
          pulsing && "animate-pulse-soft"
        )}
      />
      {status}
    </span>
  );
}
