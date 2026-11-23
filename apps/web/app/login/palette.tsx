import { Identity } from "@/components/identity";
import type { Branding } from "@/components/providers";

export function LoginPalette({ brand }: { brand?: Branding }) {
  return (
    <section
      aria-label="Identitas aplikasi"
      className="hidden min-w-0 space-y-7 bg-rail md:block p-7 text-rail-foreground"
    >
      <div className="flex min-h-8 items-center gap-2.5">
        {!brand?.logo && (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-8 rounded-lg border border-rail-foreground/20 p-1"
          >
            <rect width="24" height="14" rx="5" fill="var(--brand)" />
            <rect y="15" width="11" height="9" rx="4" fill="var(--soft)" />
            <rect
              x="13"
              y="15"
              width="11"
              height="9"
              rx="4"
              fill="var(--highlight)"
            />
          </svg>
        )}
        {brand && <Identity brand={brand} />}
      </div>
      <div className="@container relative aspect-[600/640]">
        <svg
          aria-hidden="true"
          viewBox="0 0 600 640"
          className="absolute inset-0 size-full"
        >
          <path
            d="M56 0H544Q600 0 600 56V316Q600 372 544 372H96Q35 372 0 426V56Q0 0 56 0Z"
            fill="var(--brand)"
          />
          <path
            d="M96 388H236Q292 388 292 444V584Q292 640 236 640H56Q0 640 0 584V484Q0 388 96 388Z"
            fill="var(--soft)"
          />
          <path
            d="M364 388H526Q580 388 600 350V584Q600 640 544 640H364Q308 640 308 584V444Q308 388 364 388Z"
            fill="var(--highlight)"
          />
        </svg>
        <div className="absolute inset-x-[7%] top-[6%] text-brand-foreground">
          <p className="max-w-[90%] text-[8cqw] leading-[1.04] font-bold tracking-tight">
            Every workflow, one calm console.
          </p>
          <p className="mt-[3cqw] max-w-[86%] text-[3.4cqw] leading-snug font-medium text-highlight-foreground">
            {brand?.description ||
              "Approvals, runs and alerts for the whole ops team."}
          </p>
        </div>
        <div className="absolute top-[66%] left-[7%] w-[36%] text-soft-foreground">
          <p className="text-[9cqw] leading-none font-bold tabular-nums">
            98.7%
          </p>
          <p className="mt-[2cqw] text-[3.3cqw] leading-snug font-semibold">
            runs succeed on the first try
          </p>
        </div>
        <div className="absolute top-[66%] left-[58%] w-[39%] text-highlight-foreground">
          <p className="text-[9cqw] leading-none font-bold tabular-nums">3</p>
          <p className="mt-[2cqw] text-[3.3cqw] leading-snug font-semibold">
            approvals waiting for you
          </p>
        </div>
      </div>
      <p className="text-xs text-rail-foreground/80">
        Demo workspace · figures are illustrative
      </p>
    </section>
  );
}
