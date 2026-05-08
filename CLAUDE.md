# Referidos Sointem

## Propósito

Formulario web standalone para que vendedores de Sointem registren prospectos (clientes).
Los datos se guardan en Supabase y se exportan como CSV compatible con la importación
de Leads en Odoo 19 CRM.

No hay autenticación pública. El link se comparte directamente con los vendedores.

---

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS** para estilos
- **Supabase** (PostgreSQL + Row Level Security)
- **Zod** para validación server-side
- **Google Font: Lato** (tipografía de Odoo)

---

## Estructura de archivos a crear

```
referidos_sointem/
├── CLAUDE.md                        ← este archivo
├── .env.local.example               ← plantilla de variables de entorno
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── src/
    ├── app/
    │   ├── layout.tsx               ← Root layout con fuente Lato
    │   ├── globals.css              ← Tailwind + variables CSS color Odoo
    │   ├── page.tsx                 ← Formulario principal
    │   └── api/
    │       ├── submit/
    │       │   └── route.ts         ← POST: valida + guarda en Supabase
    │       └── export/
    │           └── route.ts         ← GET ?token=XXX → descarga CSV
    └── lib/
        ├── supabase.ts              ← Supabase admin client (service_role)
        └── validations.ts           ← Zod schema compartido
```

---

## Diseño del formulario (page.tsx)

El formulario tiene **dos secciones contiguas** (no páginas separadas):

- Layout: `grid grid-cols-2` en desktop, `grid-cols-1` en mobile
- Sección izquierda: **Datos del Vendedor** — fondo `#EDE9F0`
- Sección derecha: **Datos del Cliente Prospecto** — fondo `#E8F4F5`
- Encabezados de sección: color `#714B67` (morado Odoo)
- Botón submit: `bg-[#714B67]` hover `bg-[#5c3d54]`, texto blanco, ancho completo
- Header de página: logo/nombre "Sointem" con fondo `#714B67`
- Fuente: Lato (importada desde Google Fonts en layout.tsx)
- Mensaje de éxito visible al enviar correctamente
- Errores de validación por campo (debajo de cada input)

### Campos — Sección Vendedor

| Campo | name | Tipo input | Validación |
|-------|------|-----------|-----------|
| Nombre del Vendedor | vendedor_nombre | text | requerido, mín 2 chars |
| Teléfono del Vendedor | vendedor_telefono | tel | requerido, solo dígitos, 7-15 |
| Correo del Vendedor | vendedor_correo | email | requerido, formato email |

### Campos — Sección Cliente Prospecto

| Campo | name | Tipo input | Validación |
|-------|------|-----------|-----------|
| Nombre del Cliente | cliente_nombre | text | requerido, mín 2 chars |
| Empresa | cliente_empresa | text | requerido |
| Cargo en la empresa | cliente_cargo | text | requerido |
| Correo | cliente_correo | email | requerido, formato email |
| Teléfono | cliente_telefono | tel | requerido, solo dígitos, 7-15 |

**Validación doble:**
1. Cliente: estado React con errores por campo + `pattern="[0-9]+"` en inputs tel
2. Servidor: Zod schema en el API route (rechaza con 400 si falla)

---

## Supabase

### Crear proyecto (desde cero)

1. Ir a https://supabase.com → "New Project"
2. Guardar la contraseña de la base de datos
3. En **Project Settings → API**:
   - Copiar `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copiar `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY`
4. En **SQL Editor** → ejecutar el SQL de abajo

### SQL de la tabla

```sql
CREATE TABLE referidos (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now(),
  vendedor_nombre   text        NOT NULL,
  vendedor_telefono text        NOT NULL,
  vendedor_correo   text        NOT NULL,
  cliente_nombre    text        NOT NULL,
  cliente_empresa   text        NOT NULL,
  cliente_cargo     text        NOT NULL,
  cliente_correo    text        NOT NULL,
  cliente_telefono  text        NOT NULL
);

ALTER TABLE referidos ENABLE ROW LEVEL SECURITY;
-- Sin políticas públicas → nadie puede leer/escribir sin la service_role key
```

5. Verificar en **Authentication → Policies** que `referidos` aparece con RLS habilitado

### Seguridad

- La `service_role` key **NUNCA** se expone al cliente (sin prefijo `NEXT_PUBLIC_`)
- Solo los API routes del servidor la usan
- RLS sin políticas públicas = nadie puede consultar la tabla directamente
- El endpoint de exportación requiere un token secreto adicional (`EXPORT_TOKEN`)

---

## Variables de entorno

### .env.local.example (crear este archivo)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Token secreto para exportar CSV (inventar uno largo y aleatorio)
EXPORT_TOKEN=cambia-esto-por-un-token-largo-y-secreto
```

### .env.local (el usuario crea este con sus valores reales)

Copiar `.env.local.example` como `.env.local` y llenar con las credenciales reales.

---

## API Routes

### POST /api/submit

```
Body (JSON):
{
  vendedor_nombre, vendedor_telefono, vendedor_correo,
  cliente_nombre, cliente_empresa, cliente_cargo,
  cliente_correo, cliente_telefono
}

Respuesta éxito:  { success: true }
Respuesta error:  { success: false, errors: [...] }  → HTTP 400
```

Flujo:
1. Parsea JSON del body
2. Valida con Zod schema (mismo schema que `lib/validations.ts`)
3. Inserta en Supabase con `supabaseAdmin.from('referidos').insert(...)`
4. Responde 200 o 400

### GET /api/export?token=SECRET

```
Query: ?token=valor-de-EXPORT_TOKEN

Respuesta éxito:  archivo CSV descargable
Respuesta error:  HTTP 401 si token incorrecto
```

Flujo:
1. Verifica que `searchParams.get('token') === process.env.EXPORT_TOKEN`
2. Consulta todos los registros de Supabase ordenados por `created_at DESC`
3. Genera CSV con headers **exactos** del template Odoo 19 `crm_lead.xls`:

```
Name,Company Name,Contact Name,Email,Job Position,Phone,Mobile,Notes
```

Mapeo de campos por columna:
- `Name` → `"Referido: " + cliente_nombre`
- `Company Name` → `cliente_empresa`
- `Contact Name` → `cliente_nombre`
- `Email` → `cliente_correo`
- `Job Position` → `cliente_cargo`
- `Phone` → `cliente_telefono`
- `Mobile` → vacío
- `Notes` → `"Vendedor: " + vendedor_nombre + " | Tel: " + vendedor_telefono + " | Email: " + vendedor_correo`

4. Responde con:
   - `Content-Type: text/csv; charset=utf-8`
   - `Content-Disposition: attachment; filename=referidos.csv`

---

## Colores Odoo (variables CSS en globals.css)

```css
:root {
  --odoo-primary: #714B67;
  --odoo-primary-dark: #5c3d54;
  --odoo-teal: #017E84;
  --odoo-bg: #F5F5F5;
  --odoo-section-left: #EDE9F0;
  --odoo-section-right: #E8F4F5;
  --odoo-text: #212529;
  --odoo-border: #dee2e6;
}
```

---

## Comandos para iniciar

```bash
# 1. Scaffold del proyecto (ejecutar en /Users/alexandermejia/referidos_sointem)
npx create-next-app@latest . --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*"

# 2. Instalar dependencias adicionales
npm install @supabase/supabase-js zod

# 3. Crear .env.local con las credenciales reales de Supabase

# 4. Ejecutar en desarrollo
npm run dev
```

---

## Prompt para Codex

```
Implementa el proyecto completo descrito en CLAUDE.md en este directorio.

Pasos en orden:
1. Ejecuta el scaffold de Next.js: npx create-next-app@latest . --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*"
2. Instala dependencias: npm install @supabase/supabase-js zod
3. Crea src/lib/supabase.ts con el cliente admin usando SUPABASE_SERVICE_ROLE_KEY
4. Crea src/lib/validations.ts con el Zod schema de los 8 campos
5. Crea src/app/globals.css con las variables CSS de colores Odoo
6. Modifica src/app/layout.tsx para importar la fuente Lato de Google Fonts
7. Crea src/app/api/submit/route.ts (POST handler)
8. Crea src/app/api/export/route.ts (GET handler con CSV)
9. Crea src/app/page.tsx con el formulario completo (dos secciones contiguas, estilo Odoo)
10. Crea .env.local.example con la plantilla de variables

No ejecutes el servidor. Solo crea los archivos.
```

---

## Verificación manual (después de configurar .env.local)

1. `npm run dev` → abrir http://localhost:3000
2. Llenar formulario con datos válidos → mensaje de éxito
3. Intentar ingresar letras en campo teléfono → rechazado
4. Dejar campos vacíos → errores por campo
5. `GET /api/export?token=TU_TOKEN` → descarga `referidos.csv`
6. `GET /api/export?token=malo` → responde 401
7. Abrir Supabase Dashboard → Table Editor → `referidos` → ver registros
8. Importar el CSV descargado en Odoo 19 → CRM → Leads → Importar
