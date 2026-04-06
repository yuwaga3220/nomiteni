"use client";

import type { ReactNode } from "react";
import { NomiteniProvider } from "@/providers/NomiteniProvider";
import { AppShell } from "@/layouts/AppShell";

// アプリプロバイダー
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <NomiteniProvider>
      <AppShell>{children}</AppShell>
    </NomiteniProvider>
  );
}
