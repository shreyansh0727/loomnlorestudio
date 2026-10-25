"use client";

import { usePathname, useRouter } from "next/navigation";
import { Select } from "@/components/ui/form";

const SORT_OPTIONS = [
  { value: "featured", label: "Buniya picks" },
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Select
      aria-label="Sort products"
      defaultValue={value}
      className="h-9 w-auto min-w-[11rem] border-line bg-transparent px-3 text-[0.68rem] uppercase tracking-[0.1em]"
      onChange={(event) => {
        const params = new URLSearchParams(window.location.search);
        if (event.target.value === "featured") params.delete("sort");
        else params.set("sort", event.target.value);
        params.delete("page");
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
      }}
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
