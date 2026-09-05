"use client";

import { categories, type FilterState } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Sheet, SheetContent, SheetTitle } from "./Sheet";

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onApply: () => void;
}

export function FilterDrawer({
  open,
  onOpenChange,
  filters,
  onChange,
  onApply,
}: FilterDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetTitle className="text-lg font-semibold">Filtros</SheetTitle>
        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <div className="flex flex-wrap gap-2">
              {[{ id: "all" as const, label: "Todos" }, ...categories].map(
                (c) => {
                  const active = filters.category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        onChange({ ...filters, category: c.id })
                      }
                      className={
                        active
                          ? "rounded-full bg-marka-black px-3 py-1.5 text-sm text-marka-white"
                          : "rounded-full border border-marka-graphite/15 px-3 py-1.5 text-sm"
                      }
                    >
                      {c.label}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Localização</Label>
            <Input
              value={filters.location}
              onChange={(e) =>
                onChange({ ...filters, location: e.target.value })
              }
              placeholder="São Paulo, centro..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Preço</Label>
              <select
                value={filters.price}
                onChange={(e) =>
                  onChange({ ...filters, price: e.target.value })
                }
                className="h-10 w-full rounded-md border border-marka-graphite/20 bg-marka-white px-3 text-sm"
              >
                <option value="">Qualquer</option>
                <option value="0-100">Até R$ 100</option>
                <option value="100-200">R$ 100–200</option>
                <option value="200+">Acima de R$ 200</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Avaliação</Label>
              <select
                value={filters.rating}
                onChange={(e) =>
                  onChange({ ...filters, rating: e.target.value })
                }
                className="h-10 w-full rounded-md border border-marka-graphite/20 bg-marka-white px-3 text-sm"
              >
                <option value="">Qualquer</option>
                <option value="4.5">4.5+</option>
                <option value="4.8">4.8+</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Disponibilidade</Label>
              <select
                value={filters.availability}
                onChange={(e) =>
                  onChange({ ...filters, availability: e.target.value })
                }
                className="h-10 w-full rounded-md border border-marka-graphite/20 bg-marka-white px-3 text-sm"
              >
                <option value="">Qualquer</option>
                <option value="today">Hoje</option>
                <option value="tomorrow">Amanhã</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Distância</Label>
              <select
                value={filters.distance}
                onChange={(e) =>
                  onChange({ ...filters, distance: e.target.value })
                }
                className="h-10 w-full rounded-md border border-marka-graphite/20 bg-marka-white px-3 text-sm"
              >
                <option value="">Qualquer</option>
                <option value="1">≤ 1 km</option>
                <option value="2">≤ 2 km</option>
                <option value="5">≤ 5 km</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              className="flex-1"
              variant="secondary"
              onClick={() =>
                onChange({
                  category: "all",
                  location: "",
                  price: "",
                  rating: "",
                  availability: "",
                  distance: "",
                  service: "",
                })
              }
            >
              Limpar
            </Button>
            <Button className="flex-1" onClick={onApply}>
              Aplicar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
