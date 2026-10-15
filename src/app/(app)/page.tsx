import type { Metadata } from "next";

import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Resumen · MoneyWise" };

export default async function ResumenPage() {
  const session = await getSession();
  return <DashboardView nombre={session?.nombre?.trim() || undefined} />;
}
