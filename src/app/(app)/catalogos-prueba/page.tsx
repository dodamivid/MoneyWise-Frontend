import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { CatalogosPrueba } from "./catalogos-prueba";

/**
 * Solo para desarrollo: comprueba que los catálogos cargan y se pueden elegir.
 * En producción responde 404.
 */
export default function CatalogosPruebaPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Prueba de catálogos"
        description="Solo visible en desarrollo."
      />
      <CatalogosPrueba />
    </div>
  );
}
