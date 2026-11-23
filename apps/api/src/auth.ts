import { createHash, randomUUID } from "node:crypto";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { hash, verify } from "argon2";
import type { CookieOptions, Request, Response } from "express";
import { Database } from "./database.js";
import { publicUser, sessionUser } from "./users.js";
const accessSeconds = 900;
const refreshLifetime = (remember?: boolean) => (remember ? 30 : 7) * 86400;
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
type Token = {
  sub: string;
  sid: string;
  kind: "access" | "refresh";
  remember?: boolean;
};
export type SessionRequest = Request & {
  actor: NonNullable<Awaited<ReturnType<AuthService["actor"]>>>;
};
const cookie: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};
export function writeCookies(
  res: Response,
  tokens: { access: string; refresh: string; remember?: boolean },
) {
  res.cookie("access", tokens.access, {
    ...cookie,
    maxAge: tokens.remember === false ? undefined : accessSeconds * 1000,
  });
  res.cookie("refresh", tokens.refresh, {
    ...cookie,
    maxAge:
      tokens.remember === false
        ? undefined
        : refreshLifetime(tokens.remember) * 1000,
  });
}
export function clearCookies(res: Response) {
  res.clearCookie("access", cookie);
  res.clearCookie("refresh", cookie);
}
@Injectable()
export class AuthService {
  private readonly dummyHash = hash(randomUUID());
  constructor(
    private readonly db: Database,
    private readonly jwt: JwtService,
  ) {}
  async login(email: string, password: string, remember?: boolean) {
    const user = await this.db.user.findUnique({ where: { email } });
    const valid = await verify(
      user?.passwordHash ?? (await this.dummyHash),
      password,
    );
    if (!valid || !user?.isActive)
      throw new UnauthorizedException("Email atau kata sandi salah");
    const sid = randomUUID();
    const tokens = await this.sign(user.id, sid, remember);
    await this.db.$transaction(async (tx) => {
      const current = await tx.$queryRaw<
        { passwordHash: string; isActive: boolean | number }[]
      >`SELECT passwordHash, isActive FROM User WHERE id = ${user.id} FOR UPDATE`;
      if (
        !current[0]?.isActive ||
        current[0].passwordHash !== user.passwordHash
      ) {
        throw new UnauthorizedException("Email atau kata sandi salah");
      }
      await tx.session.create({
        data: {
          id: sid,
          userId: user.id,
          refreshHash: digest(tokens.refresh),
          expiresAt: new Date(Date.now() + refreshLifetime(remember) * 1000),
        },
      });
    });
    return tokens;
  }
  async refresh(raw: string | undefined) {
    const { sid, sub, remember } = await this.read(raw, "refresh");
    const tokens = await this.sign(sub, sid, remember);
    const { count } = await this.db.session.updateMany({
      where: {
        id: sid,
        userId: sub,
        refreshHash: digest(raw!),
        expiresAt: { gt: new Date() },
        user: { isActive: true },
      },
      data: {
        refreshHash: digest(tokens.refresh),
        expiresAt: new Date(Date.now() + refreshLifetime(remember) * 1000),
      },
    });
    if (count !== 1) throw new UnauthorizedException("Sesi berakhir");
    return tokens;
  }
  async logout(access: string | undefined, refresh: string | undefined) {
    const token = await this.read(access, "access")
      .catch(() => this.read(refresh, "refresh"))
      .catch(() => null);
    if (token)
      await this.db.session.deleteMany({
        where: { id: token.sid, userId: token.sub },
      });
  }
  async actor(raw: string | undefined) {
    const { sid, sub } = await this.read(raw, "access");
    const session = await this.db.session.findFirst({
      where: {
        id: sid,
        userId: sub,
        expiresAt: { gt: new Date() },
        user: { isActive: true },
      },
      select: { user: { select: publicUser } },
    });
    if (!session) throw new UnauthorizedException("Sesi berakhir");
    return sessionUser(session.user);
  }
  private async read(raw: string | undefined, kind: Token["kind"]) {
    try {
      if (!raw) throw new Error("missing");
      const token = await this.jwt.verifyAsync<Token>(raw, {
        algorithms: ["HS256"],
        audience: kind,
        issuer: "starter-api",
      });
      if (
        token.kind !== kind ||
        typeof token.sub !== "string" ||
        typeof token.sid !== "string"
      )
        throw new Error("invalid");
      return token;
    } catch {
      throw new UnauthorizedException("Sesi berakhir");
    }
  }
  private async sign(sub: string, sid: string, remember?: boolean) {
    const sign = (kind: Token["kind"], expiresIn: number) =>
      this.jwt.signAsync(
        { sub, sid, kind, remember },
        {
          expiresIn,
          audience: kind,
          issuer: "starter-api",
          jwtid: randomUUID(),
        },
      );
    const [access, refresh] = await Promise.all([
      sign("access", accessSeconds),
      sign("refresh", refreshLifetime(remember)),
    ]);
    return { access, refresh, remember };
  }
}
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<SessionRequest>();
    req.actor = await this.auth.actor(req.cookies?.access);
    return true;
  }
}
