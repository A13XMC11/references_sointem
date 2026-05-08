import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";

type ReferidoRow = {
  vendedor_nombre: string;
  vendedor_telefono: string;
  vendedor_correo: string;
  cliente_nombre: string;
  cliente_empresa: string;
  cliente_cargo: string;
  cliente_correo: string;
  cliente_telefono: string;
};

const csvHeaders = [
  "Name",
  "Company Name",
  "Contact Name",
  "Email",
  "Job Position",
  "Phone",
  "Mobile",
  "Notes",
];

function csvCell(value: string) {
  const escaped = value.replaceAll('"', '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!process.env.EXPORT_TOKEN || token !== process.env.EXPORT_TOKEN) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("referidos")
    .select(
      "vendedor_nombre,vendedor_telefono,vendedor_correo,cliente_nombre,cliente_empresa,cliente_cargo,cliente_correo,cliente_telefono",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase query error:", error);
    return new NextResponse("Error al exportar datos. Intenta nuevamente.", { status: 500 });
  }

  const rows = (data ?? []).map((referido: ReferidoRow) => [
    `Referido: ${referido.cliente_nombre}`,
    referido.cliente_empresa,
    referido.cliente_nombre,
    referido.cliente_correo,
    referido.cliente_cargo,
    referido.cliente_telefono,
    "",
    `Vendedor: ${referido.vendedor_nombre} | Tel: ${referido.vendedor_telefono} | Email: ${referido.vendedor_correo}`,
  ]);

  const csv = [
    csvHeaders.join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=referidos.csv",
    },
  });
}
