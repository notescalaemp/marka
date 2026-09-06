import { cn } from "@/lib/cn";

type Tone = "success" | "warning" | "danger" | "default" | "info";

const TONES: Record<Tone, string> = {
  success: "bg-marka-green-soft text-marka-green-dark",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-700",
  info: "bg-sky-50 text-sky-800",
  default: "bg-marka-off text-marka-graphite",
};

const DOTS: Record<Tone, string> = {
  success: "bg-marka-green",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-sky-500",
  default: "bg-marka-gray",
};

// One small tone-based badge shared by every ambassador/referral/commission/
// withdrawal status — apps/backoffice/components/StatusBadge.tsx is typed
// specifically to EstablishmentStatus, so this is its generic sibling rather
// than a fork of it.
export function StatusPill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        TONES[tone]
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOTS[tone], (tone === "warning" || tone === "danger") && "animate-pulse-soft")} />
      {children}
    </span>
  );
}

export const AMBASSADOR_STATUS_TONE: Record<string, Tone> = {
  ACTIVE: "success",
  PAUSED: "warning",
  SUSPENDED: "danger",
  REMOVED: "default",
};

export const REFERRAL_STATUS_TONE: Record<string, Tone> = {
  PENDING: "default",
  SIGNED_UP: "warning",
  UNDER_REVIEW: "warning",
  ACTIVE: "success",
  CANCELED: "danger",
};

export const COMMISSION_STATUS_TONE: Record<string, Tone> = {
  PENDING: "warning",
  APPROVED: "info",
  PAID: "success",
  CANCELED: "danger",
};

export const WITHDRAWAL_STATUS_TONE: Record<string, Tone> = {
  PENDING: "warning",
  PROCESSING: "info",
  PAID: "success",
  REJECTED: "danger",
};
