import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifyToken } from "@/lib/auth/token";

/**
 * Protege las pantallas privadas (en Next 16 este archivo reemplaza a
 * `middleware.ts`). Es una verificación optimista: solo mira la firma de la
 * cookie para redirigir rápido. La verificación real ocurre otra vez en el
 * servidor cada vez que se lee la sesión (`getSession`).
 */
/** Públicas, pero con sesión iniciada se manda a la pantalla principal. */
const GUEST_ONLY_PATHS = ["/login", "/registro"];
/** Abiertas siempre: el enlace de recuperación llega por correo. */
const OPEN_PATHS = ["/olvido", "/restablecer"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const secret = process.env.SESSION_SECRET?.trim();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token && secret ? await verifyToken(token, secret) : null;
  const isGuestOnly = GUEST_ONLY_PATHS.includes(pathname);
  const isPublic = isGuestOnly || OPEN_PATHS.includes(pathname);

  if (!session && !isPublic) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (session && isGuestOnly) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Excluye /api (el proxy de datos responde 401 por su cuenta), estáticos e imágenes.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
