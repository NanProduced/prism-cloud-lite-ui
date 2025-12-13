"use client";

import { cn } from "@/lib/utils";

export function CountryFlag({
  code,
  className,
  title,
}: {
  code?: string | null;
  className?: string;
  title?: string;
}) {
  const normalized = (code ?? "").trim().toLowerCase();
  const isIso2 = /^[a-z]{2}$/.test(normalized);
  if (!isIso2) return null;
  const src = `/flags/4x3/${normalized}.svg`;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      title={title}
      className={cn("inline-block rounded-sm", className)}
      style={{ width: "1.25em", height: "0.9em" }}
      loading="lazy"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
