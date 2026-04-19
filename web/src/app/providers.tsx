"use client";

import type { ReactNode } from "react";
import { NomiteniProvider, type NomiteniBootstrapData } from "@/providers/NomiteniProvider";
import { AppShell } from "@/layouts/AppShell";

// アプリプロバイダー
export function AppProviders({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData: NomiteniBootstrapData;
}) {
  return (
    <NomiteniProvider initialData={initialData}>
      <AppShell>{children}</AppShell>
    </NomiteniProvider>
  );
}
