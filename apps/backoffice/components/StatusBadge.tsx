import type { EstablishmentStatus } from "@/lib/types";

const STATUS_MAP: Record<EstablishmentStatus, "success" | "warning" | "default" | "danger"> = {
  active: "success",
  trial: "default",
  inactive: "default",
  suspended: "warning",
  canceled: "danger",
};

const tones: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-800",
  default: "bg-marka-off text-marka-graphite",
};

export function StatusBadge({
  status,
}: {
  status: EstablishmentStatus | string;
}) {
  const tone = STATUS_MAP[status as EstablishmentStatus] ?? "default";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {status}
    </span>
  );
}
