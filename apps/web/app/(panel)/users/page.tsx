"use client";
import { usePanelTranslation } from "@/components/panel-language";
import { useEffect, useRef, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { AssignedRole, User, UserPage } from "@starter/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InputGroup } from "@/components/ui/input";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  EllipsisIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, Failure, Pending } from "@/components/feedback";
import { Field, Picker } from "@/components/fields";
import { useSessionUser } from "@/components/session-user";
import { UserEditor } from "@/components/user-editor";
import { api } from "@/lib/client";
function UserActions({
  user,
  onEdit,
  onRemove,
}: {
  user: User;
  onEdit?: (trigger: HTMLButtonElement | null) => void;
  onRemove?: (trigger: HTMLButtonElement | null) => void;
}) {
  const t = usePanelTranslation();
  const trigger = useRef<HTMLButtonElement>(null);
  const openingDialog = useRef(false);
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={trigger}
          id={"user-actions-" + user.id}
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("Actions for ", "Aksi untuk ") + user.name}
        >
          <EllipsisIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onCloseAutoFocus={(event) => {
          if (openingDialog.current) {
            event.preventDefault();
            openingDialog.current = false;
          }
        }}
      >
        {onEdit && (
          <DropdownMenuItem
            onSelect={() => {
              openingDialog.current = true;
              onEdit(trigger.current);
            }}
          >
            <PencilIcon aria-hidden /> {t("Edit", "Ubah")}
          </DropdownMenuItem>
        )}
        {onRemove && (
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              openingDialog.current = true;
              onRemove(trigger.current);
            }}
          >
            <Trash2Icon aria-hidden /> {t("Delete", "Hapus")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const pageSizes = [10, 20, 30, 50, 100].map((size) => ({
  value: String(size),
  label: String(size),
}));

const column = createColumnHelper<User>();
export default function UsersPage() {
  const t = usePanelTranslation();
  const session = useSessionUser().data;
  const canCreate = session?.permissions.includes("users.create") === true;
  const canEdit = session?.permissions.includes("users.update") === true;
  const canDelete = session?.permissions.includes("users.delete") === true;
  const canAssign = session?.permissions.includes("roles.assign") === true;
  const roleOptions = useQuery({
    queryKey: ["user-role-options"],
    queryFn: () => api<AssignedRole[]>("user-role-options"),
  });
  const roles = roleOptions.data ?? [];
  const roleName = ({ code, name }: AssignedRole) =>
    code === "USER" ? t("User", "Pengguna") : name;
  const statuses = [
    { value: "all", label: t("All statuses", "Semua status") },
    { value: "active", label: t("Active", "Aktif") },
    { value: "inactive", label: t("Inactive", "Nonaktif") },
  ];

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  useEffect(() => {
    const assigned = new URLSearchParams(window.location.search).get("role");
    if (assigned && /^[A-Z][A-Z0-9_]{0,39}$/.test(assigned)) setRole(assigned);
  }, []);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<User | true>();
  const [remove, setRemove] = useState<User>();
  const opener = useRef<HTMLButtonElement>(null);
  const searchField = useRef<HTMLInputElement>(null);
  const restoreFocus = (event: Event) => {
    event.preventDefault();
    const trigger = opener.current;
    const target = trigger?.isConnected
      ? trigger
      : trigger?.id
        ? document.getElementById(trigger.id)
        : null;
    (target ?? searchField.current)?.focus();
  };
  const cache = useQueryClient();
  const [size, setSize] = useState(20);
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (search.trim()) params.set("search", search.trim());
  if (role !== "all") params.set("role", role);
  if (status !== "all") params.set("status", status);
  const query = useQuery({
    queryKey: ["users", params.toString()],
    queryFn: () => api<UserPage>("users?" + params),
    placeholderData: keepPreviousData,
  });
  const pageCount = Math.max(1, Math.ceil((query.data?.total ?? 0) / size));
  const loading = query.isPending || query.isPlaceholderData;
  useEffect(() => {
    if (query.isSuccess && !query.isPlaceholderData && page > pageCount)
      setPage(pageCount);
  }, [page, pageCount, query.isSuccess, query.isPlaceholderData]);
  const deletion = useMutation({
    mutationFn: (id: string) => api("users/" + id, { method: "DELETE" }),
    onSuccess: async () => {
      if (query.data?.items.length === 1 && page > 1) setPage(page - 1);
      opener.current = null;
      setRemove(undefined);
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["users"] }),
        cache.invalidateQueries({ queryKey: ["roles"] }),
      ]);
    },
  });
  const table = useReactTable({
    data: query.data?.items ?? [],
    getCoreRowModel: getCoreRowModel(),
    getRowId: (user) => user.id,
    manualPagination: true,
    rowCount: query.data?.total ?? 0,
    state: { pagination: { pageIndex: page - 1, pageSize: size } },
    columns: [
      column.accessor("name", {
        header: t("Name", "Nama"),
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      column.accessor("email", { header: "Email" }),
      column.accessor("roles", {
        header: t("Roles", "Peran"),
        cell: (info) => (
          <div className="flex flex-wrap gap-1">
            {info.getValue().map((role: AssignedRole) => (
              <Badge key={role.code} variant="outline">
                {roleName(role)}
              </Badge>
            ))}
          </div>
        ),
      }),
      column.accessor("isActive", {
        header: "Status",
        cell: (info) => (
          <Badge variant="outline">
            {info.getValue() ? t("Active", "Aktif") : t("Inactive", "Nonaktif")}
          </Badge>
        ),
      }),
      ...(canEdit || canDelete
        ? [
            column.display({
              id: "actions",
              header: t("Actions", "Aksi"),
              cell: ({ row: { original: user } }) => (
                <UserActions
                  user={user}
                  onEdit={
                    canEdit
                      ? (trigger) => {
                          opener.current = trigger;
                          setEditor(user);
                        }
                      : undefined
                  }
                  onRemove={
                    canDelete
                      ? (trigger) => {
                          opener.current = trigger;
                          deletion.reset();
                          setRemove(user);
                        }
                      : undefined
                  }
                />
              ),
            }),
          ]
        : []),
    ],
  });
  return (
    <>
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{t("User list", "Daftar pengguna")}</CardTitle>
          {canCreate && (
            <CardAction>
              <Button
                type="button"

                onClick={(event) => {
                  opener.current = event.currentTarget;
                  setEditor(true);
                }}
              >
                <PlusIcon aria-hidden /> {t("Add user", "Tambah pengguna")}
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_auto_auto]">
            <Field
              id="search"
              label={t("Search name or email", "Cari nama atau email")}
            >
              <InputGroup start={<SearchIcon aria-hidden />}>
                <Input
                  ref={searchField}
                  id="search"
                  type="search"

                  maxLength={254}
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                />
              </InputGroup>
            </Field>
            <Field id="role-filter" label={t("Role", "Peran")}>
              <Picker
                id="role-filter"
                label={t("Filter roles", "Filter peran")}
                value={role}
                options={[
                  { value: "all", label: t("All roles", "Semua peran") },
                  ...roles.map((item) => ({
                    value: item.code,
                    label: roleName(item),
                  })),
                ]}
                onChange={(value) => {
                  setPage(1);
                  setRole(value);
                }}
              />
            </Field>
            <Field id="status-filter" label="Status">
              <Picker
                id="status-filter"
                label={t("Filter status", "Filter status")}
                value={status}
                options={statuses}
                onChange={(value) => {
                  setPage(1);
                  setStatus(value);
                }}
              />
            </Field>
          </div>
          {roleOptions.isError && (
            <Failure
              error={roleOptions.error}
              retry={() => void roleOptions.refetch()}
            />
          )}
          {loading && (
            <Pending label={t("Loading users…", "Memuat daftar pengguna…")} />
          )}
          {query.isError && (
            <Failure error={query.error} retry={() => void query.refetch()} />
          )}
          {!loading &&
            query.data &&
            (!query.data.items.length ? (
              <Empty>
                {page > 1
                  ? t(
                      "This page is empty. Go back to the previous page.",
                      "Halaman ini kosong. Kembali ke halaman sebelumnya.",
                    )
                  : search || role !== "all" || status !== "all"
                    ? t(
                        "No matching users. Change your search or filters.",
                        "Tidak ada pengguna yang cocok. Ubah pencarian atau filter.",
                      )
                    : t(
                        "No users yet. Add a user to get started.",
                        "Belum ada pengguna. Tambahkan pengguna untuk mengisi daftar.",
                      )}
              </Empty>
            ) : (
              <div
                className="overflow-x-auto"
                tabIndex={0}
                aria-label={t("User list", "Daftar pengguna")}
              >
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((group) => (
                      <TableRow key={group.id}>
                        {group.headers.map((h) => (
                          <TableHead
                            scope="col"
                            key={h.id}
                            className={
                              h.column.id === "actions"
                                ? "sticky right-0 z-10 bg-card text-right"
                                : undefined
                            }
                          >
                            {flexRender(
                              h.column.columnDef.header,
                              h.getContext(),
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={
                              cell.column.id === "actions"
                                ? "sticky right-0 z-10 bg-card text-right"
                                : undefined
                            }
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          <nav
            aria-label={t("User pagination", "Halaman pengguna")}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-border pt-3 text-sm"
          >
            <span className="text-muted-foreground" aria-live="polite">
              {query.data && !query.isPlaceholderData
                ? `${query.data.items.length ? (page - 1) * size + 1 : 0}–${query.data.items.length ? (page - 1) * size + query.data.items.length : 0} dari ${query.data.total} pengguna`
                : query.isError
                  ? t(
                      "User count unavailable",
                      "Jumlah pengguna belum tersedia",
                    )
                  : t("Loading user count…", "Memuat jumlah pengguna…")}
            </span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className="flex items-center gap-2">
                <span>{t("Rows per page", "Baris per halaman")}</span>
                <Picker
                  label={t("Rows per page", "Baris per halaman")}
                  value={String(size)}
                  options={pageSizes}
                  onChange={(value) => {
                    setSize(Number(value));
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span>
                  {t(
                    `Page ${page} of ${pageCount}`,
                    `Halaman ${page} dari ${pageCount}`,
                  )}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={t("First page", "Halaman pertama")}
                    disabled={page === 1}
                    onClick={() => setPage(1)}
                  >
                    <ChevronsLeftIcon aria-hidden />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={t("Previous page", "Halaman sebelumnya")}
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeftIcon aria-hidden />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={t("Next page", "Halaman berikutnya")}
                    disabled={query.isPlaceholderData || page >= pageCount}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRightIcon aria-hidden />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={t("Last page", "Halaman terakhir")}
                    disabled={query.isPlaceholderData || page >= pageCount}
                    onClick={() => setPage(pageCount)}
                  >
                    <ChevronsRightIcon aria-hidden />
                  </Button>
                </div>
              </div>
            </div>
          </nav>
        </CardContent>
      </Card>
      {editor && (
        <UserEditor
          roles={roles}
          canAssign={canAssign}
          user={editor === true ? undefined : editor}
          close={() => setEditor(undefined)}
          restoreFocus={restoreFocus}
        />
      )}
      <Dialog
        open={!!remove}
        onOpenChange={(open) => {
          if (!open && !deletion.isPending) setRemove(undefined);
        }}
      >
        <DialogContent showCloseButton={false} onCloseAutoFocus={restoreFocus}>
          <DialogHeader>
            <DialogTitle>{t("Delete user", "Hapus pengguna")}</DialogTitle>
            <DialogDescription>
              {t(
                `Permanently delete ${remove?.name}?`,
                `Hapus akun ${remove?.name} secara permanen?`,
              )}
            </DialogDescription>
          </DialogHeader>
          {deletion.isError && <Failure error={deletion.error} />}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={deletion.isPending}
              onClick={() => setRemove(undefined)}
            >
              {t("Cancel", "Batal")}
            </Button>
            <Button
              variant="destructive"
              disabled={deletion.isPending}
              onClick={() => remove && deletion.mutate(remove.id)}
            >
              {deletion.isPending
                ? t("Deleting…", "Menghapus…")
                : t("Delete account", "Hapus akun")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
