# Deployment a Vercel

Guía paso a paso para desplegar el proyecto a Vercel de forma segura.

## Pre-deployment Checklist

- [x] Código revisado y sin console.log
- [x] Variables de entorno configuradas (.env.local.example con placeholders)
- [x] Secrets NO comprometidos en git
- [x] Rate limiting habilitado
- [x] Errores ocultados del cliente
- [x] Validación Zod en servidor
- [x] Next.js Image component usado (no <img nativo)
- [x] TypeScript sin errores
- [x] Responsive en mobile/tablet/desktop

## Pasos 1-2: Preparar GitHub

```bash
cd /Users/alexandermejia/referidos_sointem

# Inicializar git si no está ya
git init

# Verificar que .env.local.example tiene placeholders, NO valores reales
cat .env.local.example

# Agregar y commit
git add .
git commit -m "Initial commit: Referidos form for Odoo 19 CRM"

# Crear repositorio en GitHub
# (vía web: https://github.com/new)
# Nombre recomendado: referidos-sointem

# Pushear
git remote add origin https://github.com/YOUR_ORG/referidos-sointem.git
git branch -M main
git push -u origin main
```

## Pasos 3-4: Crear Proyecto en Vercel

### Opción A: Vía CLI (Recomendado)

```bash
# Link al proyecto
npm i -g vercel
vercel link --yes --project referidos-sointem

# Vercel te preguntará el equipo (team) — ingresa el tuyo
# Crea el proyecto en Vercel automáticamente
```

### Opción B: Vía Dashboard

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Selecciona el repositorio `referidos-sointem`
4. Framework: Next.js (auto-detectado)
5. Build & Development Settings: dejar en defaults
6. Click "Deploy"

## Paso 5: Agregar Variables de Entorno

### Vía CLI (Recomendado)

```bash
# Agregar a production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# (pega tu URL de Supabase)

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# (pega tu service_role key)

vercel env add EXPORT_TOKEN production
# (genera un token largo y aleatorio: `openssl rand -hex 32`)

# También agregar a preview (para PR/branch deployments)
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
vercel env add EXPORT_TOKEN preview
```

### Vía Dashboard

1. Vé a tu proyecto en Vercel
2. Settings → Environment Variables
3. Añade cada variable con los valores reales
4. Selecciona "Production" y "Preview" para cada una

### Generar EXPORT_TOKEN seguro

```bash
# En macOS/Linux
openssl rand -hex 32

# En Windows (PowerShell)
[Convert]::ToHexString((1..16 | ForEach-Object { [byte](Get-Random -Max 256) }))
```

Guarda este token en un lugar seguro (gestor de contraseñas).

## Paso 6: Verificar Variables

```bash
# Listar todas las variables
vercel env ls

# Listar solo production
vercel env ls production
```

Vercel debe mostrar las 3 variables (values ocultos por seguridad).

## Paso 7: Deploy

```bash
# Deploy automático vía git push
git push origin main

# Vercel se desplegará automáticamente

# O deploy manual
vercel deploy --prod
```

Vercel te dará una URL: `https://referidos-sointem.vercel.app`

## Paso 8: Testear en Producción

### 1. Verificar que la app se cargó

```bash
curl -I https://referidos-sointem.vercel.app
# Debe retornar 200
```

### 2. Testear formulario

```bash
curl -X POST https://referidos-sointem.vercel.app/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "vendedor_nombre": "Test Vendedor",
    "vendedor_telefono": "1234567890",
    "vendedor_correo": "test@example.com",
    "cliente_nombre": "Test Cliente",
    "cliente_empresa": "Test Corp",
    "cliente_cargo": "CEO",
    "cliente_correo": "cliente@test.com",
    "cliente_telefono": "0987654321"
  }'

# Debe retornar { "success": true }
```

### 3. Testear exportación

```bash
# Reemplaza TOKEN con tu EXPORT_TOKEN
curl "https://referidos-sointem.vercel.app/api/export?token=TOKEN" -o referidos.csv

# Debe descargar un archivo CSV válido
```

### 4. Testear rate limiting

```bash
# Ejecuta 15 requests rápidamente
for i in {1..15}; do
  curl -X POST https://referidos-sointem.vercel.app/api/submit \
    -H "Content-Type: application/json" \
    -d '{"vendedor_nombre":"Test","vendedor_telefono":"1234567","vendedor_correo":"t@t.com","cliente_nombre":"T","cliente_empresa":"T","cliente_cargo":"T","cliente_correo":"t@t.com","cliente_telefono":"1234567"}' &
done
wait

# Algunos requests (11-15) deben retornar 429 (Too Many Requests)
```

### 5. Testear error handling

```bash
# Request sin teléfono (inválido)
curl -X POST https://referidos-sointem.vercel.app/api/submit \
  -H "Content-Type: application/json" \
  -d '{"vendedor_nombre":"Test"}'

# Debe retornar 400 con mensaje de validación, sin exponer detalles de BD
```

## Paso 9: Configurar Dominio (Opcional)

```bash
# Agregar dominio personalizado
vercel domains add referidos.tudominio.com

# Verificar DNS y esperar propagación (< 1 hora)
```

## Monitoreo en Producción

### Ver logs

```bash
# Logs de last 24h
vercel logs [PROJECT_NAME]

# Logs en tiempo real
vercel logs [PROJECT_NAME] --follow
```

### Ver deployments

```bash
vercel ls

# Ver detalles de un deployment
vercel inspect [DEPLOYMENT_URL]
```

### Rollback si hay problemas

```bash
# Ver histórico de deployments
vercel list

# Promover un deployment anterior a production
vercel promote [DEPLOYMENT_ID]
```

## Variables de Entorno en Diferentes Ambientes

- **Production** (`vercel.app`): Las 3 variables con valores reales
- **Preview** (PR/branch): Mismas variables (o diferentes si quieres test)
- **Development** (local): `.env.local` con `vercel env pull`

## Troubleshooting

### "EXPORT_TOKEN not configured"
→ Verificar que agregaste `EXPORT_TOKEN` a Vercel (`vercel env ls`)

### "Supabase connection error"
→ Verificar que `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` son correctos

### "Rate limit too strict"
→ Modificar `RATE_LIMIT_MAX_REQUESTS` en `src/app/api/submit/route.ts`

### "Deployment hangs"
→ Verificar que no hay `console.log` en código (ejecuta `grep -r "console.log" src/`)

## Próximos Pasos

1. **Compartir link** con vendedores: `https://referidos-sointem.vercel.app`
2. **Importar CSV** periódicamente en Odoo 19 CRM
3. **Monitorear logs** para errores o abuso
4. **Actualizar EXPORT_TOKEN** cada 3-6 meses

## Support

Si hay errores en producción:
1. Check Vercel logs: `vercel logs`
2. Check Supabase dashboard para DB issues
3. Test localmente con `npm run dev`
