export function MarkaMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}
    >
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-marka-gradient shadow-glow">
        <span className="h-2 w-2 rounded-[2px] bg-white" />
      </span>
      marka.ia
    </span>
  );
}
