"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

export function SearchBar({
  initialQuery = "",
  placeholder = "Estabelecimento, serviço ou profissional",
  className,
  onSearch,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (onSearch) {
      onSearch(q);
      return;
    }
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    router.push(`/buscar${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <form onSubmit={onSubmit} className={cn("w-full", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-marka-gray" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
          aria-label="Buscar"
        />
      </div>
    </form>
  );
}
