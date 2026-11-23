import { z } from "zod";
export const role = z.enum(["ADMIN", "USER"]);
export const accessPermissions = [
  { code: "dashboard.read", en: "View dashboard", id: "Lihat dasbor" },
  { code: "users.read", en: "View users", id: "Lihat pengguna" },
  { code: "users.create", en: "Create users", id: "Tambah pengguna" },
  {
    code: "users.update",
    en: "Edit users and reset passwords",
    id: "Ubah pengguna dan atur ulang kata sandi",
  },
  { code: "users.delete", en: "Delete users", id: "Hapus pengguna" },
  { code: "roles.read", en: "View roles", id: "Lihat peran" },
  {
    code: "roles.manage",
    en: "Manage roles and grants",
    id: "Kelola peran dan izin",
  },
  {
    code: "roles.assign",
    en: "Assign roles to users",
    id: "Tetapkan peran ke pengguna",
  },
  { code: "permissions.read", en: "View permissions", id: "Lihat izin" },
  { code: "settings.manage", en: "Manage settings", id: "Kelola pengaturan" },
] as const;
export type Permission = (typeof accessPermissions)[number]["code"];
export const delegablePermissions = accessPermissions.filter(
  ({ code }) =>
    code !== "dashboard.read" &&
    code !== "roles.manage" &&
    code !== "roles.assign",
);
export const routePermissions = {
  "/dashboard": "dashboard.read",
  "/users": "users.read",
  "/roles": "roles.read",
  "/permissions": "permissions.read",
  "/settings": "settings.manage",
} as const satisfies Record<string, Permission>;

const roleCode = z.string().regex(/^[A-Z][A-Z0-9_]{0,39}$/);
const permissionCode = z.enum(accessPermissions.map(({ code }) => code));
export const accessRoleInput = z.strictObject({
  code: roleCode,
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240),
  permissions: z.array(permissionCode).max(accessPermissions.length),
});
export const accessRoleUpdate = accessRoleInput.pick({
  name: true,
  description: true,
});
export const roleGrantInput = z.strictObject({
  permission: permissionCode,
  allowed: z.boolean(),
});
export type AccessRoleInput = z.infer<typeof accessRoleInput>;
export type AccessRole = AccessRoleInput & {
  system: boolean;
  userCount: number;
};
export type AssignedRole = Pick<AccessRole, "code" | "name">;

export const theme = z.enum(["light", "dark", "system"]);
const email = z.email().max(254).trim().toLowerCase();
const password = z.string().min(12, "Gunakan minimal 12 karakter").max(128);
export const login = z.strictObject({
  email,
  password: z.string().min(1).max(128),
  remember: z.boolean().optional(),
});
export const userProfile = z.strictObject({
  name: z.string().trim().min(1).max(100),
  email,
  role: role.optional(),
  roleCodes: z.array(roleCode).min(1).max(40).optional(),
  isActive: z.boolean(),
});
export const userCreate = userProfile.extend({ password });
export const userUpdate = userProfile
  .partial()
  .extend({ password: password.optional() });
export const passwordChange = z.strictObject({ password });
export const userList = z.strictObject({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(254).optional(),
  role: roleCode.optional(),
  status: z.enum(["active", "inactive"]).optional(),
});
export const settings = z.strictObject({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240),
  logo: z.union([z.literal(""), z.url({ protocol: /^https?$/ }).max(512)]),
  timezone: z
    .string()
    .max(80)
    .refine((value) => {
      try {
        new Intl.DateTimeFormat("id", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, "Zona waktu tidak valid"),
  defaultTheme: theme,
});
export type Settings = z.infer<typeof settings>;
export type UserProfile = z.infer<typeof userProfile>;
export type User = Omit<UserProfile, "role" | "roleCodes"> & {
  role: z.infer<typeof role>;
  roles: AssignedRole[];
  id: string;
  createdAt: string;
  updatedAt: string;
};
export type SessionUser = User & { permissions: Permission[] };
export type UserPage = {
  items: User[];
  total: number;
  page: number;
  size: number;
};
export type Dashboard = {
  registrations: { day: string; count: number }[];
  activeUsers: number;
  inactiveUsers: number;
};
