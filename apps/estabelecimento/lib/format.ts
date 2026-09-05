export function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDate(isoDate: string) {
  const d = new Date(isoDate);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function formatDateTime(date: string, time: string) {
  return `${formatDate(date)} · ${time}`;
}

export function daysFromNow(iso: string) {
  const target = new Date(iso);
  const now = new Date();
  const a = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a - b) / 86400000);
}

export function formatPercent(n: number) {
  return `${n.toFixed(0)}%`;
}
