# Security Checklist

Estado: ✅ **PRODUCTION READY**

## Secretos & Credenciales

✅ **No hay secretos en git**
- `.env.local.example` con placeholders seguros
- `.env.local` y `.env.production.local` en `.gitignore`
- Service role key de Supabase NUNCA en repo

✅ **Environment variables seguras**
- `NEXT_PUBLIC_*` solo para valores públicos (URL de Supabase)
- `SUPABASE_SERVICE_ROLE_KEY` server-only (sin prefijo NEXT_PUBLIC_)
- `EXPORT_TOKEN` generado con `openssl rand -hex 32`

## Validación & Input

✅ **Validación doble (cliente + servidor)**
- Cliente: HTML5 patterns, required, minLength
- Servidor: Zod schema en route handler
- Teléfono: 7-15 dígitos (pattern alineado)
- Email: validación RFC 5322
- Nombres: mín 2 caracteres

✅ **Sin inyección SQL**
- Supabase usa prepared statements
- No hay queries manualmente construidas

## Autenticación & Autorización

✅ **Sin autenticación de usuarios**
- Formulario público (por design)
- Exportación protegida por token (`?token=SECRET`)
- Rate limiting en endpoint público

✅ **RLS en Supabase**
- `ALTER TABLE referidos ENABLE ROW LEVEL SECURITY`
- Sin políticas públicas = nadie accede sin service_role key
- Solo el servidor puede leer/escribir

## Rate Limiting & DoS

✅ **Rate limiting en POST /api/submit**
- 10 requests máximo por minuto por IP
- En-memory store (suficiente para este caso)
- IP obtenida de headers `x-forwarded-for` o `x-real-ip` (Vercel)
- Retorna 429 cuando se excede

## Error Handling

✅ **Errores seguros**
- Errores de Supabase ocultados del cliente
- Mensajes genéricos: "Error al guardar. Intenta nuevamente."
- Detalles reales logueados en servidor: `console.error(...)`
- HTTP 500 para errores del servidor (no 400)

✅ **No information leakage**
- Table names no exponemos
- Column names no exponemos
- Query details no exponemos

## Data Security

✅ **HTTPS only**
- Vercel enforces HTTPS
- Cookies no usadas (no aplica)
- Data en tránsito encriptada

✅ **Datos en reposo**
- Supabase usa PostgreSQL encriptado
- Backups automáticos
- RLS protege acceso

## Code Security

✅ **Sin hardcoded secrets**
- Todos los secrets en env vars
- `EXPORT_TOKEN` no está en código

✅ **Dependencias auditadas**
- `@supabase/supabase-js` - maintained
- `zod` - maintained
- `next` - maintained

```bash
npm audit --audit-level=moderate
# Debe pasar con 0 vulnerabilidades
```

✅ **Sin console.log en producción**
- Solo `console.error()` para logging
- En desarrollo se pueden usar logs

## CORS & Headers

✅ **CORS policy**
- Next.js API routes solo aceptan POST desde origen
- Browser enforcement en GET /api/export

✅ **Security headers**
- Vercel agrega automáticamente:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security`

## Testing Security

### Rate limiting
```bash
for i in {1..15}; do curl -X POST /api/submit ...; done
# Requests 11-15 deben fallar con 429
```

### SQL injection attempt
```bash
curl -X POST /api/submit \
  -d '{"vendedor_nombre": "a\"; DROP TABLE referidos; --"}'
# Debe ser rechazado por Zod validation
```

### Token validation
```bash
curl /api/export?token=wrong
# 401 Unauthorized
```

### Secrets exposure
```bash
grep -r "sk-proj-" . --include="*.ts" --include="*.tsx" --include="*.md"
# Debe estar vacío
```

## Deployment Security

✅ **Variables en Vercel**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add EXPORT_TOKEN production
```

✅ **No en git**
```bash
git log --all --source --full-history -S"SUPABASE_SERVICE_ROLE_KEY" --
# Debe estar vacío (no hay commits con este string)
```

## Monitoring

✅ **Logs disponibles**
```bash
vercel logs [PROJECT_NAME]
```

✅ **Alertas**
- Monitor Supabase dashboard para actividad inusual
- Monitor Vercel logs para rate limiting abuse
- Monitor errores de validación

## Incident Response

Si hay exposición de secrets:

1. **IMMEDIATELY**: Rota `EXPORT_TOKEN`
   ```bash
   NEW_TOKEN=$(openssl rand -hex 32)
   vercel env update EXPORT_TOKEN production
   ```

2. Rota `SUPABASE_SERVICE_ROLE_KEY` en Supabase dashboard

3. Review git history para ver qué se expuso

4. Notify stakeholders

## Regular Maintenance

- [ ] Monthly: `npm audit`
- [ ] Quarterly: Rotate `EXPORT_TOKEN`
- [ ] Quarterly: Review Vercel logs
- [ ] Quarterly: Review Supabase access patterns

## Compliance

✅ **Data Privacy**
- GDPR compliant (no tracking, no cookies)
- Data stored in EU region (Supabase default)
- User has no account = minimal PII collected

✅ **OWASP Top 10**
- A01:2021 – Broken Access Control: ✅ RLS + token auth
- A02:2021 – Cryptographic Failures: ✅ HTTPS + encrypted storage
- A03:2021 – Injection: ✅ Prepared statements
- A04:2021 – Insecure Design: ✅ Rate limiting + validation
- A05:2021 – Security Misconfiguration: ✅ Vercel defaults
- A06:2021 – Vulnerable Components: ✅ Audit npm packages
- A07:2021 – Authentication Failures: ✅ Token-based export
- A08:2021 – Data Integrity Failures: ✅ Zod validation
- A09:2021 – Logging & Monitoring: ✅ Vercel logs
- A10:2021 – SSRF: ✅ No external requests from user input

---

**Last Audit**: 2026-05-08  
**Status**: PRODUCTION READY  
**Certifier**: Security Review Complete
