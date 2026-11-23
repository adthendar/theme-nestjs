import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { hash } from "argon2";
import { z } from "zod";
import {
  accessPermissions,
  userCreate,
  userList,
  userUpdate,
  type SessionUser,
  type User,
} from "@starter/shared";
import { lockAccess } from "./access.js";
import { Database } from "./database.js";
import { Prisma } from "./generated/client.js";

export const publicUser = {
  id: true,
  name: true,
  email: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    orderBy: { roleCode: "asc" },
    select: {
      role: {
        select: {
          code: true,
          name: true,
          permissions: { select: { permissionCode: true } },
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

type UserRecord = Prisma.UserGetPayload<{ select: typeof publicUser }>;
const knownPermissions = accessPermissions.map(({ code }) => code);

function userProfile({
  roles,
  createdAt,
  updatedAt,
  ...user
}: UserRecord): User {
  return {
    ...user,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    role: roles.some(({ role }) => role.code === "ADMIN") ? "ADMIN" : "USER",
    roles: roles.map(({ role: { code, name } }) => ({ code, name })),
  };
}

export function sessionUser(record: UserRecord): SessionUser {
  const granted = new Set(
    record.roles.flatMap(({ role }) =>
      role.permissions.map(({ permissionCode }) => permissionCode),
    ),
  );
  return {
    ...userProfile(record),
    permissions: knownPermissions.filter((code) => granted.has(code)),
  };
}

function requestedRoles({
  role,
  roleCodes,
}: {
  role?: "ADMIN" | "USER";
  roleCodes?: string[];
}) {
  if (role && roleCodes)
    throw new BadRequestException("Pilih satu format penetapan peran");
  return roleCodes ? [...new Set(roleCodes)] : role ? [role] : undefined;
}

async function validateRoles(tx: Prisma.TransactionClient, roles: string[]) {
  if (
    (await tx.accessRole.count({ where: { code: { in: roles } } })) !==
    roles.length
  ) {
    throw new BadRequestException("Peran tidak ditemukan");
  }
}

function canAssign(actor: SessionUser) {
  return actor.permissions.includes("roles.assign");
}

@Injectable()
export class UsersService {
  constructor(private readonly db: Database) {}

  async list({ page, size, search, role, status }: z.infer<typeof userList>) {
    const where: Prisma.UserWhereInput = {
      roles: role ? { some: { roleCode: role } } : undefined,
      isActive: status === undefined ? undefined : status === "active",
      OR: search
        ? [{ name: { contains: search } }, { email: { contains: search } }]
        : undefined,
    };
    const [items, total] = await this.db.$transaction([
      this.db.user.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        select: publicUser,
      }),
      this.db.user.count({ where }),
    ]);
    return { items: items.map(userProfile), total, page, size };
  }

  async detail(id: string) {
    const user = await this.db.user.findUnique({
      where: { id },
      select: publicUser,
    });
    if (!user) throw new NotFoundException("Pengguna tidak ditemukan");
    return userProfile(user);
  }

  async create(
    actorId: string,
    { password, role, roleCodes, ...data }: z.infer<typeof userCreate>,
  ) {
    const roles = requestedRoles({ role, roleCodes }) ?? ["USER"];
    const passwordHash = await hash(password);
    return this.db.$transaction(
      async (tx) => {
        await lockAccess(tx);
        const currentActor = await this.mutationActor(
          tx,
          actorId,
          "users.create",
        );
        if (
          !canAssign(currentActor) &&
          (roles.length !== 1 || roles[0] !== "USER")
        ) {
          throw new ForbiddenException("Penetapan peran tidak diizinkan");
        }
        await validateRoles(tx, roles);
        return userProfile(
          await tx.user.create({
            data: {
              ...data,
              passwordHash,
              role: roles.includes("ADMIN") ? "ADMIN" : "USER",
              roles: { create: roles.map((roleCode) => ({ roleCode })) },
            },
            select: publicUser,
          }),
        );
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  async update(
    actorId: string,
    id: string,
    { password, role, roleCodes, ...data }: z.infer<typeof userUpdate>,
  ) {
    const roles = requestedRoles({ role, roleCodes });
    const passwordHash =
      password === undefined ? undefined : await hash(password);
    return this.modify(
      actorId,
      id,
      "users.update",
      (roles !== undefined && !roles.includes("ADMIN")) ||
        data.isActive === false,
      async (tx, currentActor) => {
        if (roles) {
          if (!canAssign(currentActor))
            throw new ForbiddenException("Penetapan peran tidak diizinkan");
          await validateRoles(tx, roles);
          await tx.userRole.deleteMany({ where: { userId: id } });
          await tx.userRole.createMany({
            data: roles.map((roleCode) => ({ userId: id, roleCode })),
          });
        }
        const result = await tx.user.update({
          where: { id },
          data: {
            ...data,
            passwordHash,
            ...(roles && { role: roles.includes("ADMIN") ? "ADMIN" : "USER" }),
          },
          select: publicUser,
        });
        if (passwordHash || data.isActive === false || roles) {
          await tx.session.deleteMany({ where: { userId: id } });
        }
        return userProfile(result);
      },
    );
  }

  async remove(actorId: string, id: string) {
    await this.modify(actorId, id, "users.delete", true, (tx) =>
      tx.user.delete({ where: { id } }),
    );
  }

  private async mutationActor(
    tx: Prisma.TransactionClient,
    actorId: string,
    permission: "users.create" | "users.update" | "users.delete",
  ) {
    const record = await tx.user.findUnique({
      where: { id: actorId },
      select: publicUser,
    });
    if (!record?.isActive)
      throw new ForbiddenException("Akses tidak diizinkan");
    const currentActor = sessionUser(record);
    if (!currentActor.permissions.includes(permission))
      throw new ForbiddenException("Akses tidak diizinkan");
    return currentActor;
  }

  private modify<T>(
    actorId: string,
    id: string,
    permission: "users.update" | "users.delete",
    removesAdmin: boolean,
    action: (
      tx: Prisma.TransactionClient,
      currentActor: SessionUser,
    ) => Promise<T>,
  ) {
    return this.db.$transaction(
      async (tx) => {
        await lockAccess(tx);
        const currentActor = await this.mutationActor(tx, actorId, permission);
        const record = await tx.user.findUnique({
          where: { id },
          select: publicUser,
        });
        if (!record) throw new NotFoundException("Pengguna tidak ditemukan");
        const current = sessionUser(record);
        if (
          !canAssign(currentActor) &&
          current.permissions.some(
            (code) => !currentActor.permissions.includes(code),
          )
        ) {
          throw new ForbiddenException(
            "Pengguna memiliki izin di luar akses Anda",
          );
        }
        if (
          removesAdmin &&
          current.role === "ADMIN" &&
          current.isActive &&
          (await tx.userRole.count({
            where: { roleCode: "ADMIN", user: { isActive: true } },
          })) <= 1
        ) {
          throw new ConflictException(
            "Setidaknya satu admin harus tetap aktif",
          );
        }
        return action(tx, currentActor);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }
}
