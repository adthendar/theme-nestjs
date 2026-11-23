"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2Icon,
  FolderIcon,
  HistoryIcon,
  LayoutGridIcon,
  LogOut,
  PanelLeft,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  UsersRound,
  Shield,
  KeyRound,
  WorkflowIcon,
} from "lucide-react";
import { routePermissions, type Permission } from "@starter/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, InputGroup } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import {
  Sidebar,
  SidebarCount,
  SidebarFolder,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
} from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Failure, Pending } from "@/components/feedback";
import { Identity } from "@/components/identity";
import { useBranding } from "@/components/providers";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSessionUser } from "@/components/session-user";
import { api, ApiError } from "@/lib/client";
import { cn } from "@/lib/utils";
import {
  PanelLanguage,
  savePanelLanguage,
  usePanelLanguagePreference,
} from "@/components/panel-language";
import { Notifications } from "@/components/notifications";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

function subscribeCompact(update: () => void) {
  const media = window.matchMedia("(width < 64rem)");
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}

const DashboardSearch = createContext("");
export function useDashboardSearch() {
  return useContext(DashboardSearch);
}

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const isDashboard = path === "/dashboard";
  const language = usePanelLanguagePreference();
  const locale = language ?? (isDashboard ? "en" : "id");
  const t = (en: string, id: string) => (locale === "id" ? id : en);
  const title =
    path === "/roles"
      ? t("Roles", "Peran")
      : path === "/permissions"
        ? t("Permissions", "Izin")
        : path === "/users"
          ? t("Users", "Pengguna")
          : path === "/settings"
            ? t("Settings", "Pengaturan")
            : t("Overview", "Ringkasan");
  const mobile = useSyncExternalStore(
    subscribeCompact,
    () => window.matchMedia("(width < 64rem)").matches,
    () => false,
  );
  const router = useRouter();
  const cache = useQueryClient();
  const branding = useBranding();
  const brand = branding.data;
  const me = useSessionUser();
  const user = me.data;
  const can = (permission: Permission) =>
    user?.permissions.includes(permission) === true;
  const requiredPermission =
    routePermissions[path as keyof typeof routePermissions];
  const denied = !!user && !!requiredPermission && !can(requiredPermission);
  const expired = me.error instanceof ApiError && me.error.status === 401;
  const [compact, setCollapsed] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const collapsed = mobile ? !mobileExpanded : compact;

  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<{ path: string; label: string }>();

  useEffect(() => {
    if (expired) router.replace("/login");
    else if (denied) router.replace("/403");
  }, [expired, denied, router]);

  const logout = useMutation({
    mutationFn: () => api("auth/logout", { method: "POST" }),
    onSuccess: () => {
      cache.clear();
      router.replace("/login");
    },
  });

  const userManagementLinks = [
    { href: "/users", label: t("Users", "Pengguna"), Icon: UsersRound },
    { href: "/roles", label: t("Roles", "Peran"), Icon: Shield },
    { href: "/permissions", label: t("Permissions", "Izin"), Icon: KeyRound },
  ]
    .filter(({ href }) =>
      can(routePermissions[href as keyof typeof routePermissions]),
    )
    .map(({ href, label, Icon }) => (
      <SidebarItem
        key={href}
        asChild
        active={path === href}
        size={collapsed ? "default" : "sm"}
      >
        <Link
          href={href}
          aria-label={label}
          title={collapsed ? label : undefined}
        >
          {collapsed ? <Icon aria-hidden /> : label}
        </Link>
      </SidebarItem>
    ));

  return (
    <PanelLanguage.Provider value={locale}>
      <div lang={locale} className="mx-auto max-w-[1560px] p-2 sm:p-4">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-card focus:p-3"
        >
          {t("Skip to content", "Lewati ke konten")}
        </a>
        <div
          className="@container rounded-[40px] bg-background p-2.5 text-foreground ring-1 ring-border sm:rounded-[46px] sm:p-3 lg:rounded-l-[40px] xl:rounded-l-[34px]"
          onClick={(event) => {
            const button = (event.target as Element).closest("button");
            if (
              !button?.closest("[data-demo]") ||
              button.closest("[data-session-control]") ||
              button.getAttribute("role") === "tab" ||
              button.hasAttribute("aria-expanded")
            )
              return;
            const label =
              button.getAttribute("aria-label") || button.textContent?.trim();
            if (label) setPreview({ path, label });
          }}
        >
          <div
            className={cn(
              "grid grid-cols-[52px_minmax(0,1fr)] gap-2 lg:gap-3",
              !collapsed && mobile && "grid-cols-[minmax(0,1fr)]",
              collapsed
                ? "lg:grid-cols-[64px_minmax(0,1fr)]"
                : "lg:grid-cols-[236px_minmax(0,1fr)]",
            )}
          >
            <Sidebar
              className={cn(
                "w-auto self-start px-1 lg:self-stretch lg:px-2.5",
                collapsed &&
                  "sticky top-2 h-[calc(100dvh-1.75rem)] overflow-y-auto overflow-x-hidden lg:static lg:h-auto",
              )}
              aria-label={t("Main navigation", "Navigasi utama")}
              data-demo
              collapsed={collapsed}
            >
              <SidebarHeader>
                {!collapsed && (
                  <div className="min-w-0 flex-1 leading-tight">
                    {brand && <Identity brand={brand} />}
                    <div className="text-xs text-muted-foreground">
                      {t("Ops workspace", "Ruang kerja operasional")}
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  data-session-control
                  aria-label={
                    collapsed
                      ? t("Expand sidebar", "Buka sidebar")
                      : t("Collapse sidebar", "Ringkas sidebar")
                  }
                  onClick={() =>
                    mobile
                      ? setMobileExpanded((value) => !value)
                      : setCollapsed((value) => !value)
                  }
                >
                  <PanelLeft aria-hidden />
                </Button>
              </SidebarHeader>
              <InputGroup
                className={collapsed ? "hidden" : undefined}
                start={<SearchIcon />}
                end={<Kbd>⌘K</Kbd>}
              >
                <Input
                  placeholder={t("Search", "Cari")}
                  aria-label={t("Search", "Cari")}
                  className="bg-card"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !isDashboard)
                      router.push("/dashboard");
                  }}
                />
              </InputGroup>
              <SidebarSection label={t("Workspace", "Ruang kerja")}>
                <SidebarItem asChild active={isDashboard}>
                  <Link
                    href="/dashboard"
                    aria-current={isDashboard ? "page" : undefined}
                    aria-label={t("Overview", "Ringkasan")}
                  >
                    <LayoutGridIcon aria-hidden />
                    {!collapsed && t("Overview", "Ringkasan")}
                  </Link>
                </SidebarItem>
                <SidebarItem
                  icon={<WorkflowIcon />}
                  badge={<SidebarCount>19</SidebarCount>}
                >
                  {t("Workflows", "Alur kerja")}
                </SidebarItem>
                <SidebarItem
                  icon={<CheckCircle2Icon />}
                  badge={<SidebarCount tone="highlight">3</SidebarCount>}
                >
                  {t("Approvals", "Persetujuan")}
                </SidebarItem>
                <SidebarItem icon={<HistoryIcon />}>
                  {t("Run history", "Riwayat proses")}
                </SidebarItem>
              </SidebarSection>
              <SidebarSection label={t("Live", "Saat ini")}>
                <SidebarItem
                  icon={<StatusDot className="mx-[5px] size-2" />}
                  badge={<SidebarCount>9</SidebarCount>}
                >
                  {t("Running", "Berjalan")}
                </SidebarItem>
                <SidebarItem
                  icon={<StatusDot tone="muted" className="mx-[5px] size-2" />}
                  badge={<SidebarCount>27</SidebarCount>}
                >
                  {t("Queued", "Dalam antrean")}
                </SidebarItem>
                <SidebarItem
                  icon={
                    <StatusDot tone="destructive" className="mx-[5px] size-2" />
                  }
                  badge={<SidebarCount>1</SidebarCount>}
                >
                  {t("Failed today", "Gagal hari ini")}
                </SidebarItem>
              </SidebarSection>
              <SidebarSection label={t("Folders", "Folder")}>
                <SidebarFolder
                  icon={<FolderIcon />}
                  label={t("Finance", "Keuangan")}
                  badge={<SidebarCount>11</SidebarCount>}
                  defaultOpen
                >
                  <SidebarItem size="sm" badge={<SidebarCount>6</SidebarCount>}>
                    {t("Month-end close", "Tutup buku bulanan")}
                  </SidebarItem>
                  <SidebarItem
                    size="sm"
                    badge={
                      <span className="flex items-center gap-1.5">
                        <StatusDot tone="destructive" />
                        <SidebarCount className="px-0">3</SidebarCount>
                      </span>
                    }
                  >
                    {t("Settlement sync", "Sinkronisasi setelmen")}
                  </SidebarItem>
                  <SidebarItem size="sm" badge={<SidebarCount>2</SidebarCount>}>
                    {t("Vendors", "Vendor")}
                  </SidebarItem>
                </SidebarFolder>
                <SidebarFolder
                  icon={<FolderIcon />}
                  label={t("People ops", "Operasional SDM")}
                  badge={<SidebarCount>4</SidebarCount>}
                >
                  <SidebarItem size="sm" badge={<SidebarCount>3</SidebarCount>}>
                    {t("Onboarding", "Orientasi")}
                  </SidebarItem>
                  <SidebarItem size="sm" badge={<SidebarCount>1</SidebarCount>}>
                    {t("Payroll", "Penggajian")}
                  </SidebarItem>
                </SidebarFolder>
                <SidebarFolder
                  icon={<FolderIcon />}
                  label={t("IT & access", "TI dan akses")}
                  badge={<SidebarCount>4</SidebarCount>}
                >
                  <SidebarItem size="sm" badge={<SidebarCount>4</SidebarCount>}>
                    {t("Access audits", "Audit akses")}
                  </SidebarItem>
                </SidebarFolder>
              </SidebarSection>
              <SidebarFooter className={collapsed ? "items-center" : undefined}>
                {userManagementLinks.length > 0 && (
                  <SidebarSection>
                    {collapsed ? (
                      userManagementLinks
                    ) : (
                      <SidebarFolder
                        icon={<FolderIcon aria-hidden />}
                        label={t("User management", "Manajemen pengguna")}
                        defaultOpen
                      >
                        {userManagementLinks}
                      </SidebarFolder>
                    )}
                  </SidebarSection>
                )}
                {can("settings.manage") && (
                  <SidebarItem asChild active={path === "/settings"}>
                    <Link
                      href="/settings"
                      aria-label={t("Settings", "Pengaturan")}
                    >
                      <SettingsIcon aria-hidden />
                      {!collapsed && t("Settings", "Pengaturan")}
                    </Link>
                  </SidebarItem>
                )}
                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        data-session-control
                        variant="ghost"
                        aria-label={t("Account menu", "Menu akun")}
                        className={cn(
                          "h-auto justify-start rounded-[18px] bg-sidebar-accent p-1.5 ring-1 ring-sidebar-border",
                          collapsed && "mx-auto justify-center",
                        )}
                      >
                        <Avatar className="size-7">
                          <AvatarFallback>
                            {user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {!collapsed && (
                          <span className="min-w-0 text-left leading-tight">
                            <span className="block truncate font-semibold">
                              {user.name}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {user.roles
                                .map((role) =>
                                  role.code === "USER"
                                    ? t("Member", "Anggota")
                                    : role.name,
                                )
                                .join(", ")}
                            </span>
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      side={collapsed ? "right" : "top"}
                    >
                      <DropdownMenuItem
                        disabled={logout.isPending}
                        onSelect={() => logout.mutate()}
                      >
                        <LogOut aria-hidden /> {t("Log out", "Keluar")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </SidebarFooter>
            </Sidebar>

            <div className="@container flex min-w-0 flex-col gap-3 rounded-[30px] bg-surface p-2 ring-1 ring-border/70 sm:rounded-[34px] sm:p-3">
              <header
                aria-label={t("Panel toolbar", "Bilah panel")}
                className="sticky top-0 z-30 rounded-2xl bg-surface px-2 pb-2 pt-2 sm:px-3 sm:pt-3"
              >
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] text-muted-foreground">
                        {brand?.name} / {title}
                      </div>
                      <h1 className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.035em]">
                        {title}
                      </h1>
                      {isDashboard && (
                        <p className="mt-1.5 text-[13px] text-muted-foreground">
                          {t(
                            "Tuesday, 17 November · 14:26",
                            "Selasa, 17 November · 14:26",
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {isDashboard && (
                      <div
                        data-demo
                        className="flex flex-wrap items-center gap-2"
                      >
                        {" "}
                        <Badge variant="outline">
                          {t("Sample data", "Data contoh")}
                        </Badge>
                        <Tabs defaultValue="today">
                          <TabsList
                            aria-label={t("Date range", "Rentang tanggal")}
                          >
                            <TabsTrigger value="today">
                              {t("Today", "Hari ini")}
                            </TabsTrigger>
                            <TabsTrigger value="7d">
                              {t("7 days", "7 hari")}
                            </TabsTrigger>
                            <TabsTrigger value="30d">
                              {t("30 days", "30 hari")}
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                        <Button variant="ink">
                          <PlusIcon /> {t("New workflow", "Alur kerja baru")}
                        </Button>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      aria-label={t("Switch to Indonesian", "Ganti ke English")}
                      onClick={() =>
                        savePanelLanguage(locale === "en" ? "id" : "en")
                      }
                    >
                      {locale.toUpperCase()}
                    </Button>
                    <Notifications />
                    <ThemeToggle locale={locale} />
                  </div>
                </div>
              </header>
              <main id="main" className="min-w-0 space-y-3">
                {branding.isError && (
                  <Failure
                    error={branding.error}
                    retry={() => void branding.refetch()}
                  />
                )}
                {logout.isError && (
                  <Failure error={logout.error} retry={() => logout.mutate()} />
                )}
                {(me.isPending || expired || denied) && (
                  <Pending label={t("Checking session…", "Memeriksa sesi…")} />
                )}
                {me.isError && !expired && (
                  <Failure error={me.error} retry={() => void me.refetch()} />
                )}
                {preview && preview.path === path && (
                  <p
                    role="status"
                    className="px-3 text-sm text-muted-foreground"
                  >
                    {preview.label} · {t("Demo preview", "Pratinjau demo")}
                  </p>
                )}
                {user && !denied && (
                  <DashboardSearch.Provider value={search}>
                    {children}
                  </DashboardSearch.Provider>
                )}
              </main>
            </div>
          </div>
        </div>
      </div>
    </PanelLanguage.Provider>
  );
}
