import { z } from "zod";

/**
 * Esquemas de los formularios de acceso. Reflejan las reglas del backend
 * (`src/dtos/auth.dto.ts`) para avisar antes de enviar. El servidor vuelve a
 * validar: el navegador nunca es la fuente de verdad.
 */

const nombre = (campo: string) =>
  z
    .string()
    .trim()
    .min(2, `${campo} debe tener al menos 2 caracteres.`)
    .max(80, `${campo} no puede pasar de 80 caracteres.`);

const correo = z
  .string()
  .trim()
  .min(1, "Escribe tu correo electrónico.")
  .max(120, "El correo no puede pasar de 120 caracteres.")
  .pipe(z.email("Escribe un correo válido, por ejemplo nombre@correo.com."));

const contrasenaNueva = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .regex(/[A-Z]/, "La contraseña debe incluir una mayúscula.")
  .regex(/[a-z]/, "La contraseña debe incluir una minúscula.")
  .regex(/[0-9]/, "La contraseña debe incluir un número.");

function esMayorDe16(fecha: string): boolean {
  const nacimiento = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(nacimiento.getTime())) return false;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const aunNoCumple =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() &&
      hoy.getDate() < nacimiento.getDate());
  if (aunNoCumple) edad -= 1;
  return edad >= 16;
}

export const loginSchema = z.object({
  correo,
  contrasena: z.string().min(1, "Escribe tu contraseña."),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registroSchema = z
  .object({
    nombre: nombre("El nombre"),
    apellidoP: nombre("El apellido paterno"),
    apellidoM: nombre("El apellido materno"),
    correo,
    fechaN: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Elige tu fecha de nacimiento.")
      .refine(esMayorDe16, "Debes tener al menos 16 años para registrarte."),
    contrasena: contrasenaNueva,
    confirmarContrasena: z.string().min(1, "Repite tu contraseña."),
  })
  .refine((v) => v.contrasena === v.confirmarContrasena, {
    path: ["confirmarContrasena"],
    message: "Las contraseñas no coinciden.",
  });
export type RegistroValues = z.infer<typeof registroSchema>;
