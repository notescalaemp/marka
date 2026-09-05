import { cn } from "@/lib/cn";

interface KPICardProps {
  label: string;
  value: string;
  delta: number;
  trend: "up" | "down" | "flat";
  context: string;
}

function toneFor(trend: "up" | "down" | "flat", delta: number) {
  if (trend === "down" || (delta < 0 && trend === "flat")) return "text-red-700";
  if (delta > 0) return "text-emerald-700";
  return "text-marka-gray";
}

export function KPICard({ label, value, delta, trend, context }: KPICardProps) {
  const labelClass = toneFor(trend, delta);
  const isPositive = delta >= 0 && trend === "up";

  return (
    <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-marka-gray">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-marka-black">
        {value}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
            isPositive
              ? "bg-emerald-500/10 text-emerald-700"
              : delta < 0
                ? "bg-red-50 text-red-700"
                : "bg-marka-off text-marka-graphite"
          )}
        >
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)} p.p.
        </span>
        <span className={cn("text-xs", labelClass)}>{context}</span>
      </div>
    </div>
  );
}
