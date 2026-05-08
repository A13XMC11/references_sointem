"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";

import { ReferidoInput, referidoSchema } from "@/lib/validations";

const initialForm: ReferidoInput = {
  vendedor_nombre: "",
  vendedor_telefono: "",
  vendedor_correo: "",
  cliente_nombre: "",
  cliente_empresa: "",
  cliente_cargo: "",
  cliente_correo: "",
  cliente_telefono: "",
};

type FieldName = keyof ReferidoInput;
type FieldErrors = Partial<Record<FieldName, string>>;

const fields: Array<{
  section: "seller" | "client";
  name: FieldName;
  label: string;
  type: string;
  placeholder: string;
}> = [
  {
    section: "seller",
    name: "vendedor_nombre",
    label: "Nombre del Vendedor",
    type: "text",
    placeholder: "Ej. Ana Martinez",
  },
  {
    section: "seller",
    name: "vendedor_telefono",
    label: "Telefono del Vendedor",
    type: "tel",
    placeholder: "Ej. 0999999999",
  },
  {
    section: "seller",
    name: "vendedor_correo",
    label: "Correo del Vendedor",
    type: "email",
    placeholder: "ana@sointem.com",
  },
  {
    section: "client",
    name: "cliente_nombre",
    label: "Champion/Tomador de Decisiones",
    type: "text",
    placeholder: "Ej. Carlos Perez",
  },
  {
    section: "client",
    name: "cliente_empresa",
    label: "Empresa",
    type: "text",
    placeholder: "Ej. Industrias Andinas",
  },
  {
    section: "client",
    name: "cliente_cargo",
    label: "Cargo en la empresa",
    type: "text",
    placeholder: "Ej. Gerente General",
  },
  {
    section: "client",
    name: "cliente_correo",
    label: "Correo",
    type: "email",
    placeholder: "cliente@empresa.com",
  },
  {
    section: "client",
    name: "cliente_telefono",
    label: "Telefono",
    type: "tel",
    placeholder: "Ej. 0988888888",
  },
];

function collectErrors(data: ReferidoInput): FieldErrors {
  const parsed = referidoSchema.safeParse(data);

  if (parsed.success) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(parsed.error.flatten().fieldErrors).map(([key, value]) => [
      key,
      value?.[0] ?? "",
    ]),
  ) as FieldErrors;
}

export default function Home() {
  const [form, setForm] = useState<ReferidoInput>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [serverMessage, setServerMessage] = useState("");
  const [showRewardsModal, setShowRewardsModal] = useState(false);

  function updateField(name: FieldName, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    if (status !== "success") {
      setStatus("idle");
      setServerMessage("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = collectErrors(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus("error");
      return;
    }

    setStatus("loading");
    setServerMessage("");

    let response: Response;
    try {
      response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } catch {
      setStatus("error");
      setServerMessage("Error de red. Revisa tu conexión e intenta nuevamente.");
      return;
    }

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setStatus("error");
      setServerMessage(
        result?.errors?.[0]?.message ??
          "No se pudo registrar el referido. Revisa los datos e intenta nuevamente.",
      );
      return;
    }

    setForm(initialForm);
    setErrors({});
    setStatus("success");
    setServerMessage("Referido registrado correctamente.");
    setShowRewardsModal(true);
  }

  const sellerFields = fields.filter((field) => field.section === "seller");
  const clientFields = fields.filter((field) => field.section === "client");

  return (
    <main className="min-h-screen bg-[var(--odoo-bg)]">
      <header className="bg-[#714B67] px-6 py-5 text-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Image
            src="/Odoo-Logo.wine.png"
            alt="Odoo"
            width={120}
            height={48}
            className="rounded bg-white px-3 py-1"
            priority
          />
          <p className="text-sm font-bold uppercase tracking-normal text-white/80">
            Referidos CRM
          </p>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#714B67]">
            Registro de prospectos
          </h1>
          <p className="mt-2 max-w-2xl text-base text-[#212529]">
            Completa los datos del vendedor y del cliente prospecto para crear
            un referido listo para exportar a Odoo CRM.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="overflow-hidden rounded-lg border border-[var(--odoo-border)] bg-white shadow-sm"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <FormSection
              title="Datos del Vendedor"
              className="bg-[#EDE9F0]"
              fields={sellerFields}
              values={form}
              errors={errors}
              onChange={updateField}
            />
            <FormSection
              title="Datos del Cliente Prospecto"
              className="bg-[#E8F4F5]"
              fields={clientFields}
              values={form}
              errors={errors}
              onChange={updateField}
            />
          </div>

          <div className="border-t border-[var(--odoo-border)] bg-white p-5 sm:p-6">
            {status === "success" && (
              <div className="success-message mb-4 rounded-md border border-[#017E84]/30 bg-[#017E84]/10 px-4 py-3 text-sm font-bold text-[#017E84]">
                ✓ {serverMessage}
              </div>
            )}
            {status === "error" && serverMessage && (
              <div className="error-message mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {serverMessage}
              </div>
            )}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-md bg-[#714B67] px-5 py-3 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? (
                <span className="inline-flex items-center gap-2">
                  <span className="spinner h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                  Enviando...
                </span>
              ) : (
                "Registrar referido"
              )}
            </button>
          </div>
        </form>
      </section>

      {showRewardsModal && (
        <RewardsModal onAccept={() => setShowRewardsModal(false)} />
      )}
    </main>
  );
}

function RewardsModal({ onAccept }: { onAccept: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#212529]/70 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rewards-title"
    >
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-white/30 bg-white shadow-2xl">
        <div className="bg-[#714B67] px-6 py-6 text-center text-white sm:px-8">
          <p className="text-sm font-bold uppercase tracking-normal text-white/75">
            Beneficios Odoo
          </p>
          <h2
            id="rewards-title"
            className="mt-2 font-[var(--font-reward)] text-4xl font-extrabold leading-tight sm:text-5xl"
          >
            Recompensas
          </h2>
          <p className="mt-3 text-base font-bold text-white/90">
            Tu referido ya fue registrado. Recuerda el beneficio que puedes
            recibir.
          </p>
        </div>

        <div className="space-y-5 p-5 sm:p-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RewardCard
              title="Referral"
              percentage="10%"
              description="Recibe el 10% del valor de la suscripcion"
              limit="Monto maximo: $4,000"
            />
            <RewardCard
              title="Reference"
              percentage="5%"
              description="Recibe el 5% del valor de la suscripcion"
              limit="Monto maximo: $2,000"
            />
          </div>

          <section className="rounded-lg border border-[#714B67]/20 bg-[#EDE9F0] p-4">
            <h3 className="text-lg font-bold text-[#714B67]">Importante</h3>
            <p className="mt-2 text-sm leading-6 text-[#212529]">
              Si hay mas de 1 referencia, la recompensa se divide
              proporcionalmente.
            </p>
          </section>

          <section className="rounded-lg border border-[#017E84]/20 bg-[#E8F4F5] p-4">
            <h3 className="text-lg font-bold text-[#017E84]">Ejemplo</h3>
            <div className="mt-2 space-y-3 text-sm leading-6 text-[#212529]">
              <p>
                Si el referido adquiere el licenciamiento por un valor de
                $30,000, el 10% equivale a $3,000 en tarjeta Mastercard.
              </p>
              <p>
                Si el referido adquiere el licenciamiento por un valor de
                $50,000, Odoo entrega al referente una tarjeta Mastercard con el
                monto maximo de $4,000.
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-[var(--odoo-border)] bg-[#F5F5F5] p-4">
            <h3 className="text-lg font-bold text-[#714B67]">
              Link de recompensa
            </h3>
            <a
              href="https://www.tangocard.com/reward-link/brex"
              target="_blank"
              rel="noreferrer"
              className="mt-2 block break-words text-sm font-bold text-[#017E84] underline underline-offset-4"
            >
              https://www.tangocard.com/reward-link/brex
            </a>
          </section>

          <button
            type="button"
            onClick={onAccept}
            className="w-full rounded-md bg-[#714B67] px-5 py-3 text-base font-bold text-white transition hover:bg-[#5c3d54] focus:outline-none focus:ring-4 focus:ring-[#714B67]/25"
          >
            Aceptar y continuar
          </button>
        </div>
      </div>
    </div>
  );
}

function RewardCard({
  title,
  percentage,
  description,
  limit,
}: {
  title: string;
  percentage: string;
  description: string;
  limit: string;
}) {
  return (
    <article className="rounded-lg border border-[#714B67]/20 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl font-bold text-[#714B67]">{title}</h3>
        <p className="font-[var(--font-reward)] text-4xl font-extrabold leading-none text-[#017E84]">
          {percentage}
        </p>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#212529]">{description}</p>
      <p className="mt-3 rounded-md bg-[#714B67]/10 px-3 py-2 text-sm font-bold text-[#714B67]">
        {limit}
      </p>
    </article>
  );
}

function FormSection({
  title,
  className,
  fields: sectionFields,
  values,
  errors,
  onChange,
}: {
  title: string;
  className: string;
  fields: typeof fields;
  values: ReferidoInput;
  errors: FieldErrors;
  onChange: (name: FieldName, value: string) => void;
}) {
  return (
    <section className={`p-5 sm:p-6 ${className}`}>
      <h2 className="mb-5 text-xl font-bold text-[#714B67]">{title}</h2>
      <div className="space-y-4">
        {sectionFields.map((field) => (
          <label key={field.name} className="block">
            <span className="mb-1.5 block text-sm font-bold text-[#212529]">
              {field.label}
            </span>
            <input
              name={field.name}
              type={field.type}
              value={values[field.name]}
              placeholder={field.placeholder}
              required
              minLength={
                field.name === "vendedor_nombre" ||
                field.name === "cliente_nombre"
                  ? 2
                  : undefined
              }
              pattern={field.type === "tel" ? "[0-9]{7,15}" : undefined}
              inputMode={field.type === "tel" ? "numeric" : undefined}
              onChange={(event) => onChange(field.name, event.target.value)}
              className="h-11 w-full rounded-md border border-[var(--odoo-border)] bg-white px-3 text-base outline-none transition placeholder:text-sm focus:border-[#714B67] focus:ring-2 focus:ring-[#714B67]/20"
              aria-invalid={Boolean(errors[field.name])}
              aria-describedby={
                errors[field.name] ? `${field.name}-error` : undefined
              }
            />
            {errors[field.name] && (
              <span
                id={`${field.name}-error`}
                className="mt-1.5 block text-sm font-bold text-red-700"
              >
                {errors[field.name]}
              </span>
            )}
          </label>
        ))}
      </div>
    </section>
  );
}
