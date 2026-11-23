import { hash } from "argon2";
import { config } from "dotenv";
import { userCreate } from "@starter/shared";
import { Database } from "./database.js";
config({ path: "../../.env" });
const db = new Database();
async function seed() {
  const user = userCreate.parse({
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: "ADMIN",
    isActive: true,
  });
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM AppSetting WHERE id = 1 FOR UPDATE`;
    if (
      await tx.userRole.count({
        where: { roleCode: "ADMIN", user: { isActive: true } },
      })
    )
      return;
    const { password, ...data } = user;
    await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        isActive: data.isActive,
        role: "ADMIN",
        passwordHash: await hash(password),
        roles: { create: { roleCode: "ADMIN" } },
      },
    });
  });
}
seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
