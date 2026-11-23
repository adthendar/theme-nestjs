"use client";
import { usePanelTranslation } from "@/components/panel-language";
import {
  ArrowRightIcon,
  GripVerticalIcon,
  PauseIcon,
  ZapIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { done } from "@/lib/dashboard-demo";
import { useDashboardSearch } from "@/components/shell";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsCount, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* Demo data: synthetic */
const scheduled = [9, 8, 7, 6, 5, 4, 4, 2, 2]; // 15–23 h, 47 more
const SLOW_FROM = 12;

const PER_DOT = 3; // one dot = three runs

function RunsChart() {
  const t = usePanelTranslation();
  const W = 480;
  const H = 150;
  const col = W / 24;
  const pitch = 9;
  const r = 3.1;
  const cy = (k: number) => H - 5 - k * pitch;
  const cx = (i: number) => i * col + col / 2;
  const dots = (v: number) => Math.ceil(v / PER_DOT);
  // Dots are hourly buckets: hour h spans [h·col, (h+1)·col] and its dots sit at the centre.
  // Markers go on bucket boundaries, x = h·col, which is exactly the middle of the gutter
  // between two dot columns, so a full-height line never touches a dot.
  const boundary = (h: number) => h * col;
  const slowX = boundary(SLOW_FROM); // first slow bucket starts here (onset 12:15)
  const nowX = boundary(done.length); // end of the current, partial bucket (now 14:26)
  return (
    <svg
      viewBox={`0 0 ${W} ${H + 22}`}
      className="h-auto w-full"
      role="img"
      aria-label={t(
        "Runs per hour today, one dot per three runs: 286 done, climbing from 07:00 to a 13:00 peak; slower since 12:15; 47 more scheduled.",
        "Proses per jam hari ini. Satu titik mewakili tiga proses. 286 selesai, memuncak pukul 13:00, melambat sejak 12:15, dan 47 lagi terjadwal.",
      )}
    >
      {done.map((v, i) =>
        Array.from({ length: dots(v) }, (_, k) => (
          <circle
            key={`${i}-${k}`}
            cx={cx(i)}
            cy={cy(k)}
            r={r}
            className={i >= SLOW_FROM ? "fill-highlight" : "fill-foreground/80"}
          />
        )),
      )}
      {scheduled.map((v, i) =>
        Array.from({ length: dots(v) }, (_, k) => (
          <circle
            key={`s${i}-${k}`}
            cx={cx(i + 15)}
            cy={cy(k)}
            r={r - 0.6}
            className="fill-none stroke-muted-foreground/55"
            strokeWidth={1.1}
          />
        )),
      )}
      {Array.from({ length: 24 }, (_, i) => (
        <circle
          key={`b${i}`}
          cx={cx(i)}
          cy={H + 2}
          r={0.9}
          className="fill-muted-foreground/40"
        />
      ))}
      <line
        x1={slowX}
        x2={slowX}
        y1={19}
        y2={H}
        className="stroke-highlight"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <line
        x1={nowX}
        x2={nowX}
        y1={11}
        y2={H}
        className="stroke-foreground"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <g transform={`translate(${nowX + 6} 2)`}>
        <rect width={74} height={18} rx={9} className="fill-foreground" />
        <text
          x={37}
          y={12.5}
          textAnchor="middle"
          className="fill-background font-mono text-[10px] font-medium"
        >
          {t("now 14:26", "kini 14:26")}
        </text>
      </g>
      <g transform={`translate(${slowX - 6 - 132} 10)`}>
        <rect
          width={132}
          height={18}
          rx={9}
          className="fill-card stroke-highlight"
        />
        <text
          x={66}
          y={12.5}
          textAnchor="middle"
          className="fill-foreground font-mono text-[10px]"
        >
          {t("12:15 · 2.4× slower", "12:15 · melambat 2,4×")}
        </text>
      </g>
      {[0, 6, 12, 18, 23].map((h) => (
        <text
          key={h}
          x={cx(h)}
          y={H + 18}
          textAnchor="middle"
          className="fill-muted-foreground font-mono text-[10px]"
        >
          {String(h).padStart(2, "0")}
        </text>
      ))}
    </svg>
  );
}

const workflows = [
  {
    name: "Settlement sync",
    route: "bank api → ledger",
    strip: "ppppppppppppppppppfspsff",
    status: "slow",
    icon: "S",
  },
  {
    name: "Vendor onboarding",
    route: "intake form → erp, email",
    strip: "pppppppppppppppppppppppp",
    status: "healthy",
    icon: "V",
  },
  {
    name: "Monthly access audit",
    route: "cron · monthly → sso",
    strip: "pppppppppppppppppppppppw",
    status: "waiting",
    icon: "A",
  },
  {
    name: "Contract renewals",
    route: "crm → mail",
    strip: "ppppppppppppfppppppppppp",
    status: "healthy",
    icon: "C",
  },
  {
    name: "Payroll handoff",
    route: "cron · 16:00 → payroll",
    strip: "pppppppppppppppppppppppn",
    status: "next",
    icon: "P",
  },
] as const;

function RunStrip({ strip }: { strip: string }) {
  return (
    <div className="flex h-5 items-stretch gap-[2px]" aria-hidden>
      {strip.split("").map((c, i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-[1px]",
            c === "p" && "bg-foreground/55",
            c === "s" && "bg-highlight",
            c === "f" && "bg-destructive",
            c === "w" && "bg-highlight/50",
            c === "n" && "border border-dashed border-muted-foreground/60",
          )}
        />
      ))}
    </div>
  );
}

function WorkflowStatus({
  status,
}: {
  status: (typeof workflows)[number]["status"];
}) {
  const t = usePanelTranslation();
  if (status === "slow")
    return (
      <Badge variant="outline">
        <StatusDot tone="destructive" /> {t("Slow · 2.4×", "Lambat · 2,4×")}
      </Badge>
    );
  if (status === "healthy")
    return (
      <Badge variant="soft">
        <StatusDot /> {t("Healthy", "Normal")}
      </Badge>
    );
  if (status === "waiting")
    return (
      <Badge variant="highlight">{t("Waiting on you", "Menunggu Anda")}</Badge>
    );
  return (
    <Badge variant="outline">
      <StatusDot tone="muted" /> {t("Next 16:00", "Berikutnya 16:00")}
    </Badge>
  );
}

const approvals = [
  {
    id: "AC-117",
    title: "Admin access for Sinta Halim",
    meta: "Access audit · requested by Bayu Pratama",
    age: "8m",
    primary: true,
  },
  {
    id: "PY-052",
    title: "Payout Rp 48,5 jt to PT Arunika",
    meta: "Settlement sync · above the Rp 25 jt auto-limit",
    age: "27m",
  },
  {
    id: "VN-019",
    title: "Archive 5 inactive vendors",
    meta: "Contract renewals · no orders for 12 months",
    age: "2h",
  },
];

const w_name_id: Record<string, string> = {
  "Settlement sync": "Sinkronisasi setelmen",
  "Vendor onboarding": "Pendaftaran vendor",
  "Monthly access audit": "Audit akses bulanan",
  "Contract renewals": "Perpanjangan kontrak",
  "Payroll handoff": "Serah terima penggajian",
};

const w_route_id: Record<string, string> = {
  "bank api → ledger": "API bank → buku besar",
  "intake form → erp, email": "formulir → ERP, email",
  "cron · monthly → sso": "cron · bulanan → SSO",
  "crm → mail": "CRM → email",
  "cron · 16:00 → payroll": "cron · 16:00 → penggajian",
};

const a_title_id: Record<string, string> = {
  "Admin access for Sinta Halim": "Akses admin untuk Sinta Halim",
  "Payout Rp 48,5 jt to PT Arunika": "Pembayaran Rp 48,5 juta ke PT Arunika",
  "Archive 5 inactive vendors": "Arsipkan 5 vendor nonaktif",
};

const a_meta_id: Record<string, string> = {
  "Access audit · requested by Bayu Pratama":
    "Audit akses · diminta oleh Bayu Pratama",
  "Settlement sync · above the Rp 25 jt auto-limit":
    "Sinkronisasi setelmen · melebihi batas otomatis Rp 25 juta",
  "Contract renewals · no orders for 12 months":
    "Perpanjangan kontrak · tanpa pesanan selama 12 bulan",
};

const a_age_id: Record<string, string> = {
  "8m": "8 mnt",
  "27m": "27 mnt",
  "2h": "2 jam",
};

export default function DashboardPage() {
  const t = usePanelTranslation();
  const search = useDashboardSearch();
  const visibleWorkflows = workflows.filter((workflow) =>
    (
      t(workflow.name, w_name_id[workflow.name] ?? workflow.name) +
      " " +
      t(workflow.route, w_route_id[workflow.route] ?? workflow.route)
    )
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  return (
    <div data-demo className="space-y-3">
      <Card className="gap-4">
        <CardHeader className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <CardTitle>{t("Runs today", "Proses hari ini")}</CardTitle>
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-foreground/80" />
              {t("done", "selesai")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full border border-muted-foreground" />
              {t("scheduled", "terjadwal")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-highlight" />
              {t("slow", "lambat")}
            </span>
            <span>
              {t(`1 dot = ${PER_DOT} runs`, `1 titik = ${PER_DOT} proses`)}
            </span>
          </div>
          <CardAction className="col-start-auto row-start-auto ml-auto">
            <Button size="sm" variant="outline">
              {t("Open run log", "Buka log proses")} <ArrowRightIcon />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid grid-cols-[minmax(0,1fr)] gap-6 @3xl:grid-cols-[210px_minmax(0,1fr)]">
          <div className="flex flex-col">
            <div className="text-[64px] font-light leading-[0.9] tracking-[-0.04em] tabular-nums">
              286
            </div>
            <div className="mt-3 flex items-center gap-2 text-[13px]">
              <Badge variant="soft">↑ 12.8%</Badge>
              <span className="text-muted-foreground">
                {t("vs last Tuesday", "dibanding Selasa lalu")}
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-snug text-muted-foreground">
              {t(
                "Runs since midnight, 47 more scheduled before 24:00.",
                "Proses sejak tengah malam, 47 lagi terjadwal sebelum pukul 24:00.",
              )}
            </p>
            <dl className="mt-4 grid divide-y divide-border border-y border-border text-[13px]">
              {[
                [t("Success rate", "Tingkat keberhasilan"), "98.7%"],
                [t("Median run", "Durasi median"), "6.3 s"],
                [t("Peak hour", "Jam puncak"), "13:00"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-mono font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="min-w-0 rounded-2xl bg-surface p-3 ring-1 ring-border/70 sm:p-4">
            <RunsChart />
          </div>
        </CardContent>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-highlight/10 p-3 ring-1 ring-highlight/30">
            <span className="grid size-8 shrink-0 place-content-center rounded-full bg-highlight text-highlight-foreground [&_svg]:size-4">
              <ZapIcon />
            </span>
            <p className="min-w-0 flex-1 text-[13px] leading-snug">
              <span className="font-semibold">
                {t(
                  "Settlement sync is 2.4× slower since 12:15.",
                  "Sinkronisasi setelmen melambat 2,4× sejak pukul 12:15.",
                )}
              </span>{" "}
              <span className="text-muted-foreground">
                {t(
                  "27 runs are waiting on the bank API rate limit.",
                  "27 proses tertahan oleh batas permintaan API bank.",
                )}
              </span>
            </p>
            <div className="flex min-w-0 flex-wrap gap-2">
              <Button size="sm" variant="ink">
                <PauseIcon />{" "}
                {t("Pause retries · 15 min", "Jeda percobaan ulang · 15 menit")}
              </Button>
              <Button size="sm" variant="outline">
                {t("Trace", "Lacak")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 @5xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Card className="gap-3">
          <CardHeader>
            <CardTitle>{t("Workflows", "Alur kerja")}</CardTitle>
            <CardAction>
              <Button size="sm" variant="outline">
                {t("All 19", "Semua 19")} <ArrowRightIcon />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active">
              <TabsList
                variant="line"
                className="h-auto min-h-9 max-w-full flex-wrap @md:h-9"
                aria-label={t("Workflow status", "Status alur kerja")}
              >
                <TabsTrigger value="active">
                  {t("Active", "Aktif")} <TabsCount>14</TabsCount>
                </TabsTrigger>
                <TabsTrigger value="paused">
                  {t("Paused", "Dijeda")} <TabsCount>3</TabsCount>
                </TabsTrigger>
                <TabsTrigger value="drafts">
                  {t("Drafts", "Draf")} <TabsCount>2</TabsCount>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Table className="mt-1">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t("Workflow", "Alur kerja")}</TableHead>
                  <TableHead className="hidden @xl:table-cell">
                    {t("Last 24 runs", "24 proses terakhir")}
                  </TableHead>
                  <TableHead className="hidden text-right @md:table-cell">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleWorkflows.map((w) => (
                  <TableRow key={w.name}>
                    <TableCell className="whitespace-normal">
                      <div className="flex items-center gap-3">
                        <span className="grid size-8 shrink-0 place-content-center rounded-lg bg-surface text-xs font-bold ring-1 ring-border">
                          {w.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-semibold">
                            {t(w.name, w_name_id[w.name] ?? w.name)}
                          </div>
                          <div className="truncate font-mono text-[11px] text-muted-foreground">
                            {t(w.route, w_route_id[w.route] ?? w.route)}
                          </div>
                          <div className="mt-1.5 @md:hidden">
                            <WorkflowStatus status={w.status} />
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden @xl:table-cell">
                      <RunStrip strip={w.strip} />
                    </TableCell>
                    <TableCell className="hidden text-right @md:table-cell">
                      <WorkflowStatus status={w.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="gap-3">
          <CardHeader className="flex items-center gap-2">
            <CardTitle>{t("Needs you", "Butuh tindakan")}</CardTitle>
            <Badge variant="highlight" className="ml-0.5">
              3
            </Badge>
            <CardAction className="col-start-auto row-start-auto ml-auto">
              <Button size="sm" variant="outline">
                {t("Open queue", "Buka antrean")}
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {approvals.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "flex gap-2 rounded-2xl p-3",
                  a.primary
                    ? "bg-card shadow-raised ring-1 ring-border"
                    : "bg-surface ring-1 ring-border/70",
                )}
              >
                <GripVerticalIcon
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground/60"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
                      {a.id}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {t(a.age, a_age_id[a.age] ?? a.age)}
                    </span>
                  </div>
                  <div className="mt-1.5 text-sm font-semibold">
                    {t(a.title, a_title_id[a.title] ?? a.title)}
                  </div>
                  <div className="text-[12.5px] text-muted-foreground">
                    {t(a.meta, a_meta_id[a.meta] ?? a.meta)}
                  </div>
                  {a.primary && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="ink" className="pr-1.5">
                        {t("Approve", "Setujui")}{" "}
                        <Kbd className="h-5 border-white/20 bg-white/10 text-background/80 shadow-none dark:border-black/20 dark:bg-black/10">
                          A
                        </Kbd>
                      </Button>
                      <Button size="sm" variant="outline" className="pr-1.5">
                        {t("Decline", "Tolak")}{" "}
                        <Kbd className="h-5 rounded-md">Esc</Kbd>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <p className="px-1 pt-1 font-mono text-[11px] text-muted-foreground">
              {t(
                "Avg wait 11 min · A approve · Esc decline",
                "Rata-rata tunggu 11 menit · A setujui · Esc tolak",
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
