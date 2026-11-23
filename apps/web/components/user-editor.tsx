"use client";
import { usePanelTranslation } from "@/components/panel-language";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { userCreate, type AssignedRole, type User } from "@starter/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Failure } from "@/components/feedback";
import { Field } from "@/components/fields";
import { api, json } from "@/lib/client";
const editSchema = userCreate.extend({
  password: z.union([z.literal(""), userCreate.shape.password]),
});
export function UserEditor({
  user,
  roles,
  canAssign,
  close,
  restoreFocus,
}: {
  user?: User;
  roles: AssignedRole[];
  canAssign: boolean;
  close: () => void;
  restoreFocus: (event: Event) => void;
}) {
  const t = usePanelTranslation();
  const cache = useQueryClient();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<unknown>();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm({
    resolver: zodResolver(user ? editSchema : userCreate),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      roleCodes: user?.roles.map(({ code }) => code) ?? ["USER"],
      isActive: user?.isActive ?? true,
      password: "",
    },
  });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) close();
      }}
    >
      <DialogContent
        showCloseButton={false}
        onCloseAutoFocus={restoreFocus}
        className="max-h-[90dvh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {user
              ? t("Edit user", "Ubah pengguna")
              : t("Add user", "Tambah pengguna")}
          </DialogTitle>
          <DialogDescription>
            {user
              ? t(
                  "Update the account information or access.",
                  "Perbarui informasi atau akses akun.",
                )
              : t(
                  "Enter the new user's account information.",
                  "Isi informasi akun pengguna baru.",
                )}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(async ({ password, roleCodes, ...data }) => {
            setError(undefined);
            try {
              await api(
                user ? "users/" + user.id : "users",
                json(user ? "PATCH" : "POST", {
                  ...data,
                  ...(password && { password }),
                  ...(canAssign &&
                    (!user || dirtyFields.roleCodes) && { roleCodes }),
                }),
              );
              await Promise.all([
                cache.invalidateQueries({ queryKey: ["users"] }),
                cache.invalidateQueries({ queryKey: ["roles"] }),
              ]);
              close();
            } catch (cause) {
              setError(cause);
            }
          })}
        >
          {error !== undefined && <Failure error={error} />}
          <Field
            id="user-name"
            label={t("Name", "Nama")}
            error={
              errors.name &&
              t(
                "Enter a name up to 100 characters.",
                "Masukkan nama, maksimal 100 karakter.",
              )
            }
          >
            <Input
              id="user-name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "user-name-error" : undefined}
              {...register("name")}
            />
          </Field>
          <Field
            id="user-email"
            label="Email"
            error={
              errors.email &&
              t(
                "Enter a valid email address.",
                "Masukkan alamat email yang valid.",
              )
            }
          >
            <Input
              id="user-email"
              type="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "user-email-error" : undefined}
              {...register("email")}
            />
          </Field>
          {canAssign && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">
                {t("Roles", "Peran")}
              </legend>
              <Controller
                name="roleCodes"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <div className="grid gap-x-3 gap-y-2 rounded-xl border border-border p-3 sm:grid-cols-2">
                      {roles.map(({ code, name }) => (
                        <Label key={code} className="min-h-8">
                          <Checkbox
                            checked={field.value?.includes(code) ?? false}
                            onCheckedChange={(checked) => {
                              const current = field.value ?? [];
                              field.onChange(
                                checked
                                  ? [...current, code]
                                  : current.filter((item) => item !== code),
                              );
                            }}
                          />
                          {code === "USER" ? t("User", "Pengguna") : name}
                        </Label>
                      ))}
                    </div>
                    {fieldState.error && (
                      <p role="alert" className="text-sm text-destructive">
                        {t(
                          "Choose at least one role.",
                          "Pilih minimal satu peran.",
                        )}
                      </p>
                    )}
                  </>
                )}
              />
            </fieldset>
          )}
          <div className="flex min-h-11 items-center gap-2">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="user-active"
                  checked={field.value}
                  onCheckedChange={(value) => field.onChange(value === true)}
                />
              )}
            />
            <Label htmlFor="user-active">
              {t("Active account", "Akun aktif")}
            </Label>
          </div>
          <Field
            id="user-password"
            label={
              user
                ? t("New password (optional)", "Kata sandi baru (opsional)")
                : t("Password", "Kata sandi")
            }
            error={
              errors.password &&
              t("Use 12 to 128 characters.", "Gunakan 12 sampai 128 karakter.")
            }
          >
            <div className="relative">
              <Input
                id="user-password"
                className="pr-12"
                type={passwordVisible ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "user-password-error" : undefined
                }
                {...register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute inset-y-0 right-0 h-full"
                aria-label={
                  passwordVisible
                    ? t("Hide password", "Sembunyikan kata sandi")
                    : t("Show password", "Tampilkan kata sandi")
                }
                aria-controls="user-password"
                onClick={() => setPasswordVisible((value) => !value)}
              >
                {passwordVisible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              </Button>
            </div>
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={close}
              disabled={isSubmitting}
            >
              {t("Cancel", "Batal")}
            </Button>
            <Button disabled={isSubmitting}>
              {isSubmitting ? t("Saving…", "Menyimpan…") : t("Save", "Simpan")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
