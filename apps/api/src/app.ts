import "reflect-metadata";
import {
  ArgumentsHost,
  Catch,
  HttpException,
  Module,
  ValidationPipe,
  type ExceptionFilter,
  type INestApplication,
} from "@nestjs/common";
import { AuthorizationModule } from "@nestjs/authorization";
import { JwtModule } from "@nestjs/jwt";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ThrottlerModule } from "@nestjs/throttler";
import cookieParser from "cookie-parser";
import type { Request, Response } from "express";
import helmet from "helmet";
import { LoggerModule, PinoLogger } from "nestjs-pino";
import {
  AccessController,
  AppController,
  AuthController,
  UsersController,
} from "./controllers.js";
import { AuthGuard, AuthService, type SessionRequest } from "./auth.js";
import { AccessPolicy, AccessService } from "./access.js";
import { Database } from "./database.js";
import { Prisma } from "./generated/client.js";
import { UsersService } from "./users.js";
@Module({
  imports: [
    AuthorizationModule.forRoot({
      globalGuard: false,
      getUser: (context) =>
        context.switchToHttp().getRequest<SessionRequest>().actor ?? null,
    }),
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret.length < 32)
          throw new Error("JWT_SECRET harus memiliki minimal 32 karakter");
        return { secret };
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
    LoggerModule.forRoot({
      pinoHttp: {
        redact: [
          "req.headers.cookie",
          "req.headers.authorization",
          'res.headers["set-cookie"]',
        ],
      },
    }),
  ],
  controllers: [
    AuthController,
    UsersController,
    AppController,
    AccessController,
  ],
  providers: [
    Database,
    AuthService,
    UsersService,
    AuthGuard,
    AccessPolicy,
    AccessService,
  ],
})
export class AppModule {}
@Catch()
class ApiErrors implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger<string>) {}
  catch(error: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (error instanceof HttpException) {
      const payload = error.getResponse();
      res.status(error.getStatus()).json({
        error: {
          status: error.getStatus(),
          ...(typeof payload === "string" ? { message: payload } : payload),
        },
      });
      return;
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2002", "P2025"].includes(error.code)
    ) {
      const status = error.code === "P2002" ? 409 : 404;
      res.status(status).json({
        error: {
          status,
          message:
            status === 409 ? "Email sudah digunakan" : "Data tidak ditemukan",
        },
      });
      return;
    }
    this.logger.error({ err: error }, "Unhandled API error");
    res.status(500).json({
      error: { status: 500, message: "Terjadi gangguan pada server" },
    });
  }
}
export async function configure(app: INestApplication) {
  const origins = (process.env.WEB_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((value) => new URL(value.trim()).origin);
  const proxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
  if (proxyHops > 0)
    app.getHttpAdapter().getInstance().set("trust proxy", proxyHops);
  app.use(helmet());
  app.use(cookieParser());
  app.use((req: Request, res: Response, next: () => void) => {
    if (req.path !== "/health") res.set("Cache-Control", "no-store");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      !origins.includes(req.get("origin") ?? "")
    ) {
      res.status(403).json({
        error: { status: 403, message: "Asal permintaan tidak diizinkan" },
      });
      return;
    }
    next();
  });
  app.enableCors({ origin: origins, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ApiErrors(await app.resolve(PinoLogger)));
  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("Starter API")
      .setVersion("1")
      .addCookieAuth("access")
      .build();
    SwaggerModule.setup("docs", app, () =>
      SwaggerModule.createDocument(app, config),
    );
  }
}
