import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  TrendingUp,
  Users,
  UserCheck,
  AlertTriangle,
  Wallet,
  Repeat,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface KPICardProps {
  label: string;
  value: string;
  delta: number;
  trend: "up" | "down" | "flat";
  context: string;
}

const ICONS: Record<string, LucideIcon> = {
  MRR: Wallet,
  ARR: TrendingUp,
  "Active Businesses": UserCheck,
  Churn: AlertTriangle,
  "Net New MRR": TrendingUp,
  "MRR at Risk": AlertTriangle,
  "Trial → Paid": Repeat,
};

function isGood(trend: "up" | "down" | "flat", delta: number) {
  if (trend === "flat") return delta === 0 ? null : delta > 0;
  return trend === "up";
}

export function KPICard({ label, value, delta, trend, context }: KPICardProps) {
  const Icon = ICONS[label] ?? Users;
  const good = isGood(trend, delta);
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;

  return (
    <div className="card card-interactive relative overflow-hidden p-4">
      <div className="absolute inset-x-0 top-0 h-1 bg-marka-gradient opacity-90" />
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-marka-gray">
          {label}
        </p>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-marka-green-soft text-marka-green-dark">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-marka-black">
        {value}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
            good === null
              ? "bg-marka-off text-marka-graphite"
              : good
                ? "bg-marka-green-soft text-marka-green-dark"
                : "bg-red-50 text-red-700"
          )}
        >
          <TrendIcon className="h-3 w-3" />
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)} p.p.
        </span>
        <span className="text-xs text-marka-gray">{context}</span>
      </div>
    </div>
  );
}
