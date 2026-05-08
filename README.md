# Referidos Sointem

Formulario web para que vendedores de Sointem registren prospectos de clientes. Los datos se guardan en Supabase y se exportan como CSV compatible con Odoo 19 CRM.

## Características

✅ Validación doble (cliente + servidor)  
✅ Rate limiting para evitar spam  
✅ Errores seguros sin exposición de datos internos  
✅ Exportación CSV compatible con Odoo 19  
✅ Interfaz optimizada con colores y tipografía Odoo  
✅ Responsive design (mobile-first)  
✅ Image optimization con Next.js

## Setup Local

### 1. Instalar

```bash
npm install
```

### 2. Crear Supabase

Ve a [supabase.com](https://supabase.com) y:
1. Crea un nuevo proyecto
2. En **Project Settings → API**, copia `Project URL` y `service_role` key
3. En **SQL Editor**, ejecuta el SQL en [CLAUDE.md](./CLAUDE.md)

### 3. Configurar env

```bash
cp .env.local.example .env.local
# Edita con tus credenciales
```

### 4. Ejecutar

```bash
npm run dev
```

## Deploy a Vercel

```bash
vercel deploy --prod
```

Ver [README.md](./README.md) para detalles completos de setup, testing y deployment.

## Seguridad

✅ Service role key server-only  
✅ RLS en Supabase  
✅ Rate limiting (10 reqs/min)  
✅ Errores ocultados  
✅ Validación Zod

## Stack

Next.js 16 • Supabase • Zod • Tailwind • Vercel
