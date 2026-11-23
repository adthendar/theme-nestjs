"use client";

import { useState } from "react";
import { BellIcon } from "lucide-react";
import { Popover } from "radix-ui";
import { usePanelTranslation } from "@/components/panel-language";
import { Button } from "@/components/ui/button";

export function Notifications() {
  const t = usePanelTranslation();
  const [read, setRead] = useState<number[]>([]);
  const items = [
    {
      id: 1,
      title: t("Approval requested", "Persetujuan diminta"),
      time: t("8 minutes ago", "8 menit lalu"),
    },
    {
      id: 2,
      title: t("Settlement sync slowed down", "Sinkronisasi setelmen melambat"),
      time: t("27 minutes ago", "27 menit lalu"),
    },
    {
      id: 3,
      title: t("Access audit completed", "Audit akses selesai"),
      time: t("2 hours ago", "2 jam lalu"),
    },
  ];
  const allRead = read.length === items.length;
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label={t("Notifications", "Notifikasi")}
        >
          <BellIcon aria-hidden />
          {!allRead && (
            <span
              aria-hidden
              className="absolute right-2 top-2 size-2 rounded-full bg-highlight ring-2 ring-card"
            />
          )}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={10}
          aria-label={t("Notifications", "Notifikasi")}
          className="z-50 w-[min(21rem,calc(100vw-1.25rem))] rounded-xl bg-popover p-3 text-popover-foreground shadow-raised ring-1 ring-border motion-safe:data-[state=open]:animate-[notification-drop_180ms_ease-out]"
        >
          <style>{`@keyframes notification-drop { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div className="flex flex-wrap items-center justify-between gap-1">
            <h2 className="font-semibold">
              {t("Notifications", "Notifikasi")}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              disabled={allRead}
              onClick={() => setRead(items.map(({ id }) => id))}
            >
              {t("Mark all as read", "Tandai semua sudah dibaca")}
            </Button>
          </div>
          <ul className="mt-2 divide-y divide-border">
            {items.map(({ id, title, time }) => {
              const seen = read.includes(id);
              return (
                <li
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-1 py-2"
                >
                  <div>
                    <p
                      className={
                        seen
                          ? "text-sm text-muted-foreground"
                          : "text-sm font-semibold"
                      }
                    >
                      {title}
                    </p>
                    <p className="text-xs text-muted-foreground">{time}</p>
                  </div>
                  {seen ? (
                    <span className="text-xs text-muted-foreground">
                      {t("Read", "Sudah dibaca")}
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={t(
                        `Mark as read: ${title}`,
                        `Tandai sudah dibaca: ${title}`,
                      )}
                      onClick={() => setRead((current) => [...current, id])}
                    >
                      {t("Mark as read", "Tandai sudah dibaca")}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
