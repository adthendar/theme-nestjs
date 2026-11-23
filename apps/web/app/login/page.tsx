"use client";

import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { login } from "@starter/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input, InputGroup } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBranding } from "@/components/providers";
import { api, ApiError, json } from "@/lib/client";
import { Identity } from "@/components/identity";
import { LoginPalette } from "./palette";

export default function Login() {
  const brand = useBranding();
  const router = useRouter();
  const cache = useQueryClient();
  const [error, setError] = useState<unknown>();
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(login),
    defaultValues: { email: "", password: "", remember: true },
  });

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-2">
      <div className="w-full max-w-[1080px]">
        <Card className="grid gap-0 overflow-hidden rounded-3xl p-0 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <LoginPalette brand={brand.data} />
          <section className="flex min-w-0 items-center justify-center px-6 py-10 sm:px-12">
            <div className="w-full max-w-[346px]">
              {brand.data && (
                <div className="mb-7 md:hidden">
                  <Identity brand={brand.data} />
                </div>
              )}
              <h1 className="text-[28px] leading-tight font-bold tracking-tight">
                Sign in
              </h1>
              <p className="mt-2 min-h-5 text-sm text-muted-foreground">
                {brand.data && <>New to {brand.data.name}? </>}
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() =>
                    setNotice(
                      "Contact your administrator to create a workspace.",
                    )
                  }
                >
                  Create a workspace
                </button>
              </p>
              <Tabs defaultValue="password" className="mt-7 gap-5">
                <TabsList className="w-full">
                  <TabsTrigger className="flex-1" value="password">
                    Password
                  </TabsTrigger>
                  <TabsTrigger className="flex-1" value="link">
                    Email link
                  </TabsTrigger>
                </TabsList>
                <TabsContent className="outline-none" value="password">
                  <form
                    className="grid gap-4"
                    onSubmit={handleSubmit(async (fields) => {
                      setError(undefined);
                      try {
                        await api("auth/login", json("POST", fields));
                        cache.removeQueries({ queryKey: ["me"] });
                        router.replace("/dashboard");
                      } catch (cause) {
                        setError(cause);
                      }
                    })}
                  >
                    {error !== undefined && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          <span role="alert">
                            {error instanceof ApiError && error.status === 401
                              ? "Incorrect email or password."
                              : error instanceof Error
                                ? error.message
                                : "Sign-in failed. Try again."}
                          </span>
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="grid gap-2">
                      <Label htmlFor="email">Work email</Label>
                      <InputGroup start={<Mail aria-hidden />}>
                        <Input
                          id="email"
                          type="email"
                          autoComplete="username"
                          placeholder="nadia@denslab.id"
                          aria-invalid={!!errors.email}
                          {...register("email")}
                        />
                      </InputGroup>
                      {errors.email && (
                        <p role="alert" className="text-sm text-destructive">
                          Enter a valid email address.
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label htmlFor="password">Password</Label>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            setNotice(
                              "Contact your administrator to reset your password.",
                            )
                          }
                        >
                          Forgot password?
                        </button>
                      </div>
                      <InputGroup
                        start={<LockKeyhole aria-hidden />}
                        end={
                          <Button
                            type="button"
                            variant="ghost"
                            className="relative z-10 size-8 px-0"
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                            aria-controls="password"
                            onClick={() => setShowPassword((value) => !value)}
                          >
                            {showPassword ? (
                              <EyeOff aria-hidden />
                            ) : (
                              <Eye aria-hidden />
                            )}
                          </Button>
                        }
                      >
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          aria-invalid={!!errors.password}
                          {...register("password")}
                        />
                      </InputGroup>
                      {errors.password && (
                        <p role="alert" className="text-sm text-destructive">
                          Enter your password.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Controller
                        control={control}
                        name="remember"
                        render={({ field }) => (
                          <Checkbox
                            id="remember"
                            checked={field.value ?? false}
                            onCheckedChange={(value) =>
                              field.onChange(value === true)
                            }
                          />
                        )}
                      />
                      <Label htmlFor="remember">
                        Keep me signed in for 30 days
                      </Label>
                    </div>
                    <Button
                      size="lg"
                      className="mt-1 h-11 w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Signing in…" : "Sign in"}
                      <ArrowRight aria-hidden />
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="link">
                  <form
                    className="grid gap-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      setNotice("Email link sign-in is not configured.");
                    }}
                  >
                    <div className="grid gap-2">
                      <Label htmlFor="link-email">Work email</Label>
                      <InputGroup start={<Mail aria-hidden />}>
                        <Input
                          required
                          type="email"
                          id="link-email"
                          autoComplete="email"
                          placeholder="nadia@denslab.id"
                        />
                      </InputGroup>
                    </div>
                    <Button size="lg" className="w-full">
                      Email me a sign-in link
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
              <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs text-muted-foreground">
                <Separator />
                or continue with
                <Separator />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setNotice("Google sign-in is not configured.")}
                >
                  Google
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setNotice("SSO is not configured.")}
                >
                  SSO
                </Button>
              </div>
              {notice && (
                <p className="mt-4 text-sm text-muted-foreground" role="status">
                  {notice}
                </p>
              )}
            </div>
          </section>
        </Card>
        <p className="mt-3 text-xs text-muted-foreground">
          Demo data. Names and figures are fictional.
        </p>
      </div>
    </main>
  );
}
