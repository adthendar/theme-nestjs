"use client";
import { usePanelTranslation } from "@/components/panel-language";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settings, type Settings } from "@starter/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Empty, Failure, Pending } from "@/components/feedback";
import { Field, Picker } from "@/components/fields";
import { api, json } from "@/lib/client";
function SettingsForm({ initial }: { initial: Settings }) {
  const t = usePanelTranslation();
  const cache = useQueryClient();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(settings), defaultValues: initial });
  const save = useMutation({
    mutationFn: (values: Settings) =>
      api<Settings>("settings", json("PUT", values)),
    onSuccess: async (data) => {
      reset(data);
      cache.setQueryData(["settings"], data);
      await cache.invalidateQueries({ queryKey: ["branding"] });
    },
  });
  return (
    <form
      className="max-w-2xl space-y-5"
      onSubmit={handleSubmit((values) => save.mutate(values))}
    >
      {save.isError && <Failure error={save.error} />}
      {save.isSuccess && !isDirty && (
        <p role="status">{t("Settings saved.", "Pengaturan tersimpan.")}</p>
      )}
      <Field
        id="app-name"
        label={t("App name", "Nama aplikasi")}
        error={
          errors.name &&
          t(
            "Enter a name up to 80 characters.",
            "Masukkan nama, maksimal 80 karakter.",
          )
        }
      >
        <Input
          id="app-name"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
      </Field>
      <Field
        id="description"
        label={t("Short description", "Deskripsi singkat")}
        error={
          errors.description &&
          t("Use up to 240 characters.", "Gunakan maksimal 240 karakter.")
        }
      >
        <Textarea
          id="description"
          aria-invalid={!!errors.description}
          {...register("description")}
        />
      </Field>
      <Field
        id="logo"
        label={t("Logo URL", "URL logo")}
        error={
          errors.logo &&
          t("Enter an HTTP or HTTPS URL.", "Masukkan URL HTTP atau HTTPS.")
        }
      >
        <Input
          id="logo"
          type="url"
          aria-invalid={!!errors.logo}
          {...register("logo")}
        />
      </Field>
      <Field
        id="timezone"
        label={t(
          "Time zone (IANA)",
          t("Time zone (IANA)", "Zona waktu (IANA)"),
        )}
        error={errors.timezone?.message}
      >
        <Input
          id="timezone"
          aria-invalid={!!errors.timezone}
          {...register("timezone")}
        />
      </Field>
      <Field id="default-theme" label={t("Default theme", "Tema default")}>
        <Controller
          name="defaultTheme"
          control={control}
          render={({ field }) => (
            <Picker
              id="default-theme"
              label={t("Default theme", "Tema default")}
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "system", label: t("System", "Sistem") },
                { value: "light", label: t("Light", "Terang") },
                { value: "dark", label: t("Dark", "Gelap") },
              ]}
            />
          )}
        />
      </Field>
      <Button disabled={save.isPending || !isDirty}>
        {save.isPending
          ? t("Saving…", "Menyimpan…")
          : t("Save settings", "Simpan pengaturan")}
      </Button>
    </form>
  );
}
export default function SettingsPage() {
  const t = usePanelTranslation();
  const query = useQuery({
    queryKey: ["settings"],
    queryFn: () => api<Settings | null>("settings"),
  });
  return (
    <>
      {query.isPending && (
        <Pending label={t("Loading settings…", "Memuat pengaturan…")} />
      )}
      {query.isError && (
        <Failure error={query.error} retry={() => void query.refetch()} />
      )}
      {query.isSuccess && !query.data && (
        <Empty>
          {t(
            "Settings are unavailable. Check the database migrations.",
            "Pengaturan belum tersedia. Periksa migrasi basis data.",
          )}
        </Empty>
      )}
      {query.data && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t(
                "App identity and preferences",
                "Identitas dan preferensi aplikasi",
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SettingsForm initial={query.data} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
