import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/client.js";
@Injectable()
export class Database extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const url = new URL(process.env.DATABASE_URL!);
    super({
      adapter: new PrismaMariaDb({
        host: url.hostname,
        port: Number(url.port || 3306),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: decodeURIComponent(url.pathname.slice(1)),
        connectionLimit: 10,
      }),
    });
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
