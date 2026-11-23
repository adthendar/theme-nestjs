import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  type PipeTransform,
} from "@nestjs/common";
import { AuthorizationGuard } from "@nestjs/authorization";
import { ApiBody, ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { SkipThrottle, Throttle, ThrottlerGuard } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { z } from "zod";
import {
  accessRoleInput,
  accessRoleUpdate,
  roleGrantInput,
  login,
  passwordChange,
  settings,
  userCreate,
  userList,
  userUpdate,
} from "@starter/shared";
import {
  AuthGuard,
  AuthService,
  clearCookies,
  writeCookies,
  type SessionRequest,
} from "./auth.js";
import { AccessService, RequiresPermission } from "./access.js";
import { dashboardMock } from "./dashboard.mock.js";
import { Database } from "./database.js";
import { UsersService } from "./users.js";
class SchemaPipe implements PipeTransform {
  constructor(private readonly schema: z.ZodType) {}
  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success)
      throw new BadRequestException({
        message: "Periksa isian Anda",
        issues: result.error.issues.map(({ path, message }) => ({
          path,
          message,
        })),
      });
    return result.data;
  }
}
@ApiTags("auth")
@Controller("auth")
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiBody({
    schema: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", format: "password" },
        remember: { type: "boolean" },
      },
    },
  })
  async login(
    @Body(new SchemaPipe(login)) input: z.infer<typeof login>,
    @Res({ passthrough: true }) res: Response,
  ) {
    writeCookies(
      res,
      await this.auth.login(input.email, input.password, input.remember),
    );
    return { ok: true };
  }
  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    writeCookies(res, await this.auth.refresh(req.cookies?.refresh));
    return { ok: true };
  }
  @Post("logout")
  @HttpCode(204)
  @SkipThrottle()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.access, req.cookies?.refresh);
    clearCookies(res);
  }
  @Get("me")
  @SkipThrottle()
  @ApiCookieAuth()
  @UseGuards(AuthGuard)
  me(@Req() req: SessionRequest) {
    return req.actor;
  }
}
@ApiTags("users")
@ApiCookieAuth()
@Controller("users")
@UseGuards(AuthGuard, AuthorizationGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get()
  @RequiresPermission("users.read")
  list(@Query(new SchemaPipe(userList)) query: z.infer<typeof userList>) {
    return this.users.list(query);
  }
  @Get(":id")
  @RequiresPermission("users.read")
  detail(@Param("id") id: string) {
    return this.users.detail(id);
  }
  @Post()
  @RequiresPermission("users.create")
  create(
    @Req() req: SessionRequest,
    @Body(new SchemaPipe(userCreate)) data: z.infer<typeof userCreate>,
  ) {
    return this.users.create(req.actor.id, data);
  }
  @Patch(":id")
  @RequiresPermission("users.update")
  update(
    @Req() req: SessionRequest,
    @Param("id") id: string,
    @Body(new SchemaPipe(userUpdate)) data: z.infer<typeof userUpdate>,
  ) {
    return this.users.update(req.actor.id, id, data);
  }
  @Patch(":id/password")
  @RequiresPermission("users.update")
  password(
    @Req() req: SessionRequest,
    @Param("id") id: string,
    @Body(new SchemaPipe(passwordChange)) data: z.infer<typeof passwordChange>,
  ) {
    return this.users.update(req.actor.id, id, data);
  }
  @Delete(":id")
  @HttpCode(204)
  @RequiresPermission("users.delete")
  remove(@Req() req: SessionRequest, @Param("id") id: string) {
    return this.users.remove(req.actor.id, id);
  }
}
@ApiTags("access")
@ApiCookieAuth()
@Controller()
@UseGuards(AuthGuard, AuthorizationGuard)
export class AccessController {
  constructor(private readonly access: AccessService) {}

  @Get("user-role-options")
  @RequiresPermission("users.read")
  roleOptions() {
    return this.access.roleOptions();
  }

  @Get("roles")
  @RequiresPermission("roles.read")
  roles() {
    return this.access.roles();
  }

  @Get("permissions")
  @RequiresPermission("permissions.read")
  permissions() {
    return this.access.permissions();
  }

  @Post("roles")
  @RequiresPermission("roles.manage")
  create(
    @Req() req: SessionRequest,
    @Body(new SchemaPipe(accessRoleInput))
    input: z.infer<typeof accessRoleInput>,
  ) {
    return this.access.create(req.actor.id, input);
  }

  @Patch("roles/:code")
  @RequiresPermission("roles.manage")
  update(
    @Req() req: SessionRequest,
    @Param("code") code: string,
    @Body(new SchemaPipe(accessRoleUpdate))
    input: z.infer<typeof accessRoleUpdate>,
  ) {
    return this.access.update(req.actor.id, code, input);
  }

  @Patch("roles/:code/permissions")
  @RequiresPermission("roles.manage")
  setPermission(
    @Req() req: SessionRequest,
    @Param("code") code: string,
    @Body(new SchemaPipe(roleGrantInput)) input: z.infer<typeof roleGrantInput>,
  ) {
    return this.access.setPermission(req.actor.id, code, input);
  }

  @Delete("roles/:code")
  @HttpCode(204)
  @RequiresPermission("roles.manage")
  remove(@Req() req: SessionRequest, @Param("code") code: string) {
    return this.access.remove(req.actor.id, code);
  }
}
@ApiTags("app")
@Controller()
export class AppController {
  constructor(private readonly db: Database) {}
  @Get("health")
  async health() {
    await this.db.$queryRaw`SELECT 1`;
    return { status: "ok" };
  }
  @Get("branding")
  branding() {
    return this.db.appSetting.findUniqueOrThrow({
      where: { id: 1 },
      select: { name: true, description: true, logo: true, defaultTheme: true },
    });
  }
  @Get("settings")
  @UseGuards(AuthGuard, AuthorizationGuard)
  @RequiresPermission("settings.manage")
  async settings() {
    const { id, ...data } = await this.db.appSetting.findUniqueOrThrow({
      where: { id: 1 },
    });
    void id;
    return data;
  }
  @Put("settings")
  @UseGuards(AuthGuard, AuthorizationGuard)
  @RequiresPermission("settings.manage")
  async saveSettings(
    @Body(new SchemaPipe(settings)) data: z.infer<typeof settings>,
  ) {
    await this.db.appSetting.update({ where: { id: 1 }, data });
    return data;
  }
  @Get("dashboard")
  @UseGuards(AuthGuard, AuthorizationGuard)
  @RequiresPermission("dashboard.read")
  dashboard() {
    return dashboardMock;
  }
}
