import {
  CalendarClock,
  LayoutDashboard,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Las cuatro de uso diario: van en la barra inferior en móvil. */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/ingresos", label: "Ingresos", icon: TrendingUp },
  { href: "/egresos", label: "Egresos", icon: TrendingDown },
  { href: "/metas", label: "Metas", icon: Target },
];

/** En móvil viven dentro del menú "Más". */
export const SECONDARY_NAV: NavItem[] = [
  { href: "/inversiones", label: "Inversiones", icon: PiggyBank },
  { href: "/ahorro", label: "Fecha de corte", icon: CalendarClock },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
