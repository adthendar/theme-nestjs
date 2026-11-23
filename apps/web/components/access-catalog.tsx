"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ellipsis, LockKeyhole, Plus } from "lucide-react";
import {
  accessPermissions,
  delegablePermissions,
  type AccessRole,
  type AccessRoleInput,
  type Permission,
} from "@starter/shared";
import { Failure, Pending } from "@/components/feedback";
import { usePanelTranslation } from "@/components/panel-language";
import { useSessionUser } from "@/components/session-user";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api, json } from "@/lib/client";

const groups = [
  { prefix: "dashboard", en: "Dashboard", id: "Dasbor" },
  { prefix: "users", en: "Users", id: "Pengguna" },
  { prefix: "roles", en: "Roles", id: "Peran" },
  { prefix: "permissions", en: "Permissions", id: "Izin" },
  { prefix: "settings", en: "Settings", id: "Pengaturan" },
];
const delegable = new Set<Permission>(
  delegablePermissions.map(({ code }) => code),
);

type RoleDialog =
  { action: "create" } | { action: "edit" | "delete"; role: AccessRole };

function useRoleLabel() {
  const t = usePanelTranslation();
  return (role: AccessRole) =>
    role.code === "USER" ? t("User", "Pengguna") : role.name;
}

export function AccessCatalog({ view }: { view: "roles" | "permissions" }) {
  return view === "roles" ? <RolesMatrix /> : <PermissionsCatalog />;
}

function RolesMatrix() {
  const t = usePanelTranslation();
  const name = useRoleLabel();
  const session = useSessionUser().data;
  const canManage = session?.permissions.includes("roles.manage") === true;
  const canListUsers = session?.permissions.includes("users.read") === true;
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["roles"],
    queryFn: () => api<AccessRole[]>("roles"),
  });
  const roles = query.data ?? [];
  const [dialog, setDialog] = useState<RoleDialog>();
  const grant = useMutation({
    mutationFn: ({
      code,
      permission,
      allowed,
    }: {
      code: string;
      permission: Permission;
      allowed: boolean;
    }) =>
      api<AccessRole>(
        `roles/${code}/permissions`,
        json("PATCH", { permission, allowed }),
      ),
    onSuccess: (role) =>
      cache.setQueryData<AccessRole[]>(["roles"], (list) =>
        list?.map((item) => (item.code === role.code ? role : item)),
      ),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Roles and permissions", "Peran dan izin")}</CardTitle>
        {canManage && (
          <CardAction>
            <Button size="sm" onClick={() => setDialog({ action: "create" })}>
              <Plus aria-hidden />
              {t("New role", "Peran baru")}
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isPending && (
          <Pending label={t("Loading roles…", "Memuat peran…")} />
        )}
        {query.isError && (
          <Failure error={query.error} retry={() => void query.refetch()} />
        )}
        {grant.isError && <Failure error={grant.error} />}
        {query.isSuccess && (
          <div className="rounded-xl border border-border bg-surface">
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="min-w-52">
                    {t("Permission", "Izin")}
                  </TableHead>
                  {roles.map((role) => (
                    <TableHead
                      key={role.code}
                      scope="col"
                      className="h-auto min-w-32 py-2 align-top"
                    >
                      <div className="flex items-center gap-1">
                        {role.system && (
                          <LockKeyhole
                            className="size-3"
                            aria-label={t("System role", "Peran bawaan")}
                          />
                        )}
                        <span title={role.description || role.code}>
                          {name(role)}
                        </span>
                        {(canListUsers || (canManage && !role.system)) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`${t("Actions for", "Aksi untuk")} ${name(role)}`}
                              >
                                <Ellipsis aria-hidden />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canListUsers && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/users?role=${role.code}`}>
                                    {t("View users", "Lihat pengguna")}
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              {canManage && !role.system && (
                                <>
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      setDialog({ action: "edit", role })
                                    }
                                  >
                                    {t("Edit role", "Ubah peran")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onSelect={() =>
                                      setDialog({ action: "delete", role })
                                    }
                                  >
                                    {t("Delete role", "Hapus peran")}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      <div className="text-xs font-normal text-muted-foreground">
                        {t(
                          `${role.userCount} ${role.userCount === 1 ? "member" : "members"}`,
                          `${role.userCount} anggota`,
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              {groups.map((group) => {
                const permissions = accessPermissions.filter(({ code }) =>
                  code.startsWith(group.prefix + "."),
                );
                return (
                  <TableBody key={group.prefix}>
                    <TableRow className="bg-muted/45">
                      <TableHead scope="row" className="font-semibold">
                        {t(group.en, group.id)}
                      </TableHead>
                      {roles.map((role) => (
                        <TableCell
                          key={role.code}
                          className="text-xs text-muted-foreground"
                        >
                          {
                            permissions.filter(({ code }) =>
                              role.permissions.includes(code),
                            ).length
                          }
                          /{permissions.length}
                        </TableCell>
                      ))}
                    </TableRow>
                    {permissions.map(({ code, en, id }) => (
                      <TableRow key={code}>
                        <TableHead
                          scope="row"
                          className="h-auto py-2 pl-6 font-normal"
                        >
                          {t(en, id)}
                        </TableHead>
                        {roles.map((role) => (
                          <TableCell key={role.code} className="py-2">
                            <Checkbox
                              aria-label={`${name(role)} · ${t(en, id)}`}
                              checked={role.permissions.includes(code)}
                              disabled={
                                !canManage ||
                                role.system ||
                                !delegable.has(code) ||
                                grant.isPending
                              }
                              onCheckedChange={(value) =>
                                grant.mutate({
                                  code: role.code,
                                  permission: code,
                                  allowed: value === true,
                                })
                              }
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                );
              })}
            </Table>
          </div>
        )}
        {dialog && (
          <RoleEditor dialog={dialog} close={() => setDialog(undefined)} />
        )}
      </CardContent>
    </Card>
  );
}

function RoleEditor({
  dialog,
  close,
}: {
  dialog: RoleDialog;
  close: () => void;
}) {
  const t = usePanelTranslation();
  const cache = useQueryClient();
  const [code, setCode] = useState(
    dialog.action === "create" ? "" : dialog.role.code,
  );
  const [name, setName] = useState(
    dialog.action === "create" ? "" : dialog.role.name,
  );
  const [description, setDescription] = useState(
    dialog.action === "create" ? "" : dialog.role.description,
  );
  const mutation = useMutation({
    mutationFn: () => {
      if (dialog.action === "delete")
        return api(`roles/${code}`, { method: "DELETE" });
      if (dialog.action === "edit")
        return api(`roles/${code}`, json("PATCH", { name, description }));
      const data: AccessRoleInput = {
        code,
        name,
        description,
        permissions: [],
      };
      return api("roles", json("POST", data));
    },
    onSuccess: async () => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["roles"] }),
        cache.invalidateQueries({ queryKey: ["user-role-options"] }),
        cache.invalidateQueries({ queryKey: ["users"] }),
      ]);
      close();
    },
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {dialog.action === "delete"
              ? t("Delete role", "Hapus peran")
              : dialog.action === "edit"
                ? t("Edit role", "Ubah peran")
                : t("New role", "Peran baru")}
          </DialogTitle>
          <DialogDescription>
            {dialog.action === "delete"
              ? t(`Delete the role "${name}"?`, `Hapus peran "${name}"?`)
              : t(
                  "Set the role details. Edit permission grants in the matrix.",
                  "Isi detail peran. Atur pemberian izin di matriks.",
                )}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          {mutation.isError && <Failure error={mutation.error} />}
          {dialog.action !== "delete" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="role-code">{t("Code", "Kode")}</Label>
                <Input
                  id="role-code"
                  required
                  maxLength={40}
                  pattern="[A-Z][A-Z0-9_]*"
                  readOnly={dialog.action === "edit"}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="USER_MANAGER"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-name">{t("Name", "Nama")}</Label>
                <Input
                  id="role-name"
                  required
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-description">
                  {t("Description", "Deskripsi")}
                </Label>
                <Textarea
                  id="role-description"
                  maxLength={240}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={close}
              disabled={mutation.isPending}
            >
              {t("Cancel", "Batal")}
            </Button>
            <Button
              type="submit"
              variant={dialog.action === "delete" ? "destructive" : "default"}
              disabled={mutation.isPending}
            >
              {dialog.action === "delete"
                ? t("Delete", "Hapus")
                : t("Save", "Simpan")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PermissionsCatalog() {
  const t = usePanelTranslation();
  const query = useQuery({
    queryKey: ["permissions"],
    queryFn: () => api<(typeof accessPermissions)[number][]>("permissions"),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Permission catalog", "Katalog izin")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {query.isPending && (
          <Pending label={t("Loading permissions…", "Memuat izin…")} />
        )}
        {query.isError && (
          <Failure error={query.error} retry={() => void query.refetch()} />
        )}
        {groups.map((group) => {
          const permissions = query.data?.filter(({ code }) =>
            code.startsWith(group.prefix + "."),
          );
          if (!permissions?.length) return null;
          return (
            <section key={group.prefix}>
              <h2 className="border-b border-border py-2 font-semibold">
                {t(group.en, group.id)}
              </h2>
              <ul className="divide-y divide-border">
                {permissions.map(({ code, en, id }) => (
                  <li
                    key={code}
                    className="flex flex-wrap justify-between gap-2 py-2 text-sm"
                  >
                    <span>{t(en, id)}</span>
                    <code className="text-muted-foreground">{code}</code>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
