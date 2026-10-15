"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ApiRequestError } from "@/lib/api/query";

/**
 * Un `QueryClient` por visita (no uno global) para que el caché no se
 * comparta entre personas en el servidor.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            // No se reintenta lo que no va a cambiar (sesión, permisos, datos
            // inválidos); sí una vez los fallos de red y 5xx.
            retry: (failures, error) => {
              if (
                error instanceof ApiRequestError &&
                error.error.status < 500 &&
                error.error.codigo !== "RED"
              ) {
                return false;
              }
              return failures < 1;
            },
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
