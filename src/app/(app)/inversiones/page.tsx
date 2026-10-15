import type { Metadata } from "next";

import { InversionesView } from "@/components/inversiones/inversiones-view";

export const metadata: Metadata = { title: "Inversiones · MoneyWise" };

export default function InversionesPage() {
  return <InversionesView />;
}
