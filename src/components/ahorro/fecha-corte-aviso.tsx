"use client";

import { useFechasCorte } from "@/lib/ahorro/use-fechas-corte";
import { Empty } from "@/components/states/empty";
import { CalendarClock } from "lucide-react";

/**
 * Aviso guiado para el resumen: si todavía no hay fecha de corte, el balance
 * no se puede calcular. No muestra nada mientras carga, si falla o si ya hay
 * una fecha registrada (esos estados los maneja cada bloque del resumen).
 */
export function FechaCorteAviso() {
  const query = useFechasCorte();

  if (!query.isSuccess || query.data.length > 0) return null;

  return (
    <Empty
      icon={CalendarClock}
      title="Registra tu fecha de corte para ver tu balance"
      description="Es el día desde el que calculamos cuánto llevas ahorrado. Solo toma un momento."
      action={{ label: "Registrar fecha de corte", href: "/ahorro" }}
    />
  );
}
