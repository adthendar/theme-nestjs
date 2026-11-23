import type { Branding } from "./providers";
export function Identity({ brand }: { brand: Branding }) {
  return (
    <span className="flex min-w-0 items-center gap-2 font-semibold">
      {brand.logo && (
        <img
          src={brand.logo}
          alt=""
          width={28}
          height={28}
          referrerPolicy="no-referrer"
          className="size-7 shrink-0 object-contain"
        />
      )}
      <span className="truncate">{brand.name}</span>
    </span>
  );
}
