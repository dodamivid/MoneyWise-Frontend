"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import {
  isActivePath,
  PRIMARY_NAV,
  SECONDARY_NAV,
  type NavItem,
} from "./nav-items";

interface AppNavProps {
  user: { nombre: string; correo: string };
}

function SideLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActivePath(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active
          ? "bg-primary/10 font-semibold text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <item.icon className="size-5 shrink-0" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

function BottomLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActivePath(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active ? "font-semibold text-primary" : "text-muted-foreground",
      )}
    >
      <item.icon className="size-5" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

/**
 * Menú "Más" de móvil. Se monta con `key={pathname}` desde el padre, así se
 * cierra solo al navegar sin necesidad de un efecto.
 */
function MoreMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const moreActive = SECONDARY_NAV.some((item) =>
    isActivePath(pathname, item.href),
  );

  return (
    <div
      className="relative flex flex-1"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-mas"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          moreActive || open
            ? "font-semibold text-primary"
            : "text-muted-foreground",
        )}
      >
        <Ellipsis className="size-5" aria-hidden="true" />
        Más
      </button>
      {open ? (
        <div
          id="menu-mas"
          className="absolute right-0 bottom-full mb-2 grid min-w-52 gap-1 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg"
        >
          {SECONDARY_NAV.map((item) => (
            <SideLink key={item.href} item={item} pathname={pathname} />
          ))}
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <LogOut className="size-5 shrink-0" aria-hidden="true" />
              Cerrar sesión
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export function AppNav({ user }: AppNavProps) {
  const pathname = usePathname();
  const allItems = [...PRIMARY_NAV, ...SECONDARY_NAV];

  return (
    <>
      {/* Escritorio: barra lateral fija */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-sidebar p-4 md:flex">
        <p className="px-3 py-2 text-xl font-semibold tracking-tight text-primary">
          MoneyWise
        </p>
        <nav aria-label="Principal" className="mt-4 grid gap-1">
          {allItems.map((item) => (
            <SideLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
        <div className="mt-auto grid gap-3 border-t border-border pt-4">
          <div className="px-3 text-sm">
            <p className="truncate font-medium">{user.nombre || "Tu cuenta"}</p>
            <p className="truncate text-muted-foreground">{user.correo}</p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" className="w-full">
              <LogOut aria-hidden="true" />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </aside>

      {/* Móvil: barra inferior con las cuatro principales y "Más" */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-sidebar px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] md:hidden"
      >
        {PRIMARY_NAV.map((item) => (
          <BottomLink key={item.href} item={item} pathname={pathname} />
        ))}
        <MoreMenu key={pathname} pathname={pathname} />
      </nav>
    </>
  );
}
