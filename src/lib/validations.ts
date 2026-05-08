import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\d{7,15}$/, "Debe contener solo digitos y tener entre 7 y 15 caracteres");

export const referidoSchema = z.object({
  vendedor_nombre: z
    .string()
    .trim()
    .min(2, "El nombre del vendedor debe tener al menos 2 caracteres"),
  vendedor_telefono: phoneSchema,
  vendedor_correo: z
    .string()
    .trim()
    .email("Ingresa un correo valido para el vendedor"),
  cliente_nombre: z
    .string()
    .trim()
    .min(2, "El nombre del cliente debe tener al menos 2 caracteres"),
  cliente_empresa: z.string().trim().min(1, "La empresa es requerida"),
  cliente_cargo: z.string().trim().min(1, "El cargo es requerido"),
  cliente_correo: z
    .string()
    .trim()
    .email("Ingresa un correo valido para el cliente"),
  cliente_telefono: phoneSchema,
});

export type ReferidoInput = z.infer<typeof referidoSchema>;
