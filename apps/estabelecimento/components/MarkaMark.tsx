export function MarkaMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold tracking-tight ${className}`}
    >
      <span className="inline-block h-2.5 w-2.5 rounded-sm bg-marka-white" />
      marka.ia
    </span>
  );
}
