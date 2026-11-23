import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Policy, Can } from "@nestjs/authorization";
import {
  accessPermissions,
  delegablePermissions,
  type AccessRoleInput,
  type Permission,
  type roleGrantInput,
  type SessionUser,
} from "@starter/shared";
import type { z } from "zod";
import { Database } from "./database.js";
import type { Prisma } from "./generated/client.js";

@Policy()
export class AccessPolicy {
  permits(user: SessionUser | null, permission: Permission) {
    return user?.permissions.includes(permission) === true;
  }
}

export const RequiresPermission = (permission: Permission) =>
  Can(AccessPolicy, "permits", () => [permission] as const);

export async function lockAccess(tx: Prisma.TransactionClient) {
  await tx.$queryRaw`SELECT id FROM AppSetting WHERE id = 1 FOR UPDATE`;
}

const roleView = {
  permissions: { select: { permissionCode: true } },
  _count: { select: { users: true } },
} satisfies Prisma.AccessRoleInclude;

function presentRole({
  permissions,
  _count,
  ...role
}: Prisma.AccessRoleGetPayload<{ include: typeof roleView }>) {
  return {
    ...role,
    permissions: permissions.map(({ permissionCode }) => permissionCode),
    userCount: _count.users,
  };
}

const delegable = new Set<string>(delegablePermissions.map(({ code }) => code));

function grants(permissions: Permission[]) {
  if (
    permissions.some(
      (code) => code !== "dashboard.read" && !delegable.has(code),
    )
  ) {
    throw new ForbiddenException(
      "Izin ini dikhususkan untuk peran Administrator",
    );
  }
  return [...new Set(["dashboard.read", ...permissions])].map(
    (permissionCode) => ({ permissionCode }),
  );
}

@Injectable()
export class AccessService {
  constructor(private readonly db: Database) {}

  async roles() {
    const roles = await this.db.accessRole.findMany({
      include: roleView,
      orderBy: [{ system: "desc" }, { code: "asc" }],
    });
    return roles.map(presentRole);
  }

  roleOptions() {
    return this.db.accessRole.findMany({
      select: { code: true, name: true },
      orderBy: [{ system: "desc" }, { code: "asc" }],
    });
  }

  async permissions() {
    const codes = await this.db.accessPermission.findMany({
      select: { code: true },
    });
    const enabled = new Set(codes.map(({ code }) => code));
    return accessPermissions.filter(({ code }) => enabled.has(code));
  }

  async create(actorId: string, { permissions, ...data }: AccessRoleInput) {
    const links = grants(permissions);
    return this.db.$transaction(
      async (tx) => {
        await lockAccess(tx);
        await this.requireManager(tx, actorId);
        if (await tx.accessRole.findUnique({ where: { code: data.code } })) {
          throw new ConflictException("Kode peran sudah digunakan");
        }
        return presentRole(
          await tx.accessRole.create({
            data: { ...data, permissions: { create: links } },
            include: roleView,
          }),
        );
      },
      { isolationLevel: "ReadCommitted" },
    );
  }

  async update(
    actorId: string,
    code: string,
    data: Pick<AccessRoleInput, "name" | "description">,
  ) {
    return this.db.$transaction(
      async (tx) => {
        await lockAccess(tx);
        await this.requireManager(tx, actorId);
        await this.editable(tx, code);
        return presentRole(
          await tx.accessRole.update({
            where: { code },
            data,
            include: roleView,
          }),
        );
      },
      { isolationLevel: "ReadCommitted" },
    );
  }

  async setPermission(
    actorId: string,
    code: string,
    { permission, allowed }: z.infer<typeof roleGrantInput>,
  ) {
    if (!delegable.has(permission))
      throw new ForbiddenException("Izin ini terkunci");
    return this.db.$transaction(
      async (tx) => {
        await lockAccess(tx);
        await this.requireManager(tx, actorId);
        await this.editable(tx, code);
        const where = { roleCode: code, permissionCode: permission };
        if (allowed) {
          await tx.rolePermission.upsert({
            where: { roleCode_permissionCode: where },
            create: where,
            update: {},
          });
        } else {
          await tx.rolePermission.deleteMany({ where });
        }
        return presentRole(
          await tx.accessRole.findUniqueOrThrow({
            where: { code },
            include: roleView,
          }),
        );
      },
      { isolationLevel: "ReadCommitted" },
    );
  }

  async remove(actorId: string, code: string) {
    await this.db.$transaction(
      async (tx) => {
        await lockAccess(tx);
        await this.requireManager(tx, actorId);
        await this.editable(tx, code);
        if (await tx.userRole.count({ where: { roleCode: code } })) {
          throw new ConflictException("Peran masih ditetapkan ke pengguna");
        }
        await tx.accessRole.delete({ where: { code } });
      },
      { isolationLevel: "ReadCommitted" },
    );
  }

  private async requireManager(tx: Prisma.TransactionClient, actorId: string) {
    const assignment = await tx.userRole.findFirst({
      where: {
        userId: actorId,
        user: { isActive: true },
        role: { permissions: { some: { permissionCode: "roles.manage" } } },
      },
    });
    if (!assignment) throw new ForbiddenException("Akses tidak diizinkan");
  }

  private async editable(tx: Prisma.TransactionClient, code: string) {
    const role = await tx.accessRole.findUnique({ where: { code } });
    if (!role) throw new NotFoundException("Peran tidak ditemukan");
    if (role.system) throw new ForbiddenException("Peran bawaan terkunci");
  }
}
