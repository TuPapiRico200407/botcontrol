# OBJETIVO.md — Sprint 01

## Objetivo del Sprint
Establecer los cimientos de la plataforma con autenticación, control de acceso por rol (RBAC) y gestión empresarial, permitiendo que SUPER_ADMIN cree empresas y usuarios, y que OWNER/AGENT accedan a un portal scoped por empresa.

## Alcance Sprint 01

### Incluye
1. **Autenticación y RBAC**
   - Login con Supabase Auth (magic link o password)
   - Validación de sesión
   - Redirección por rol (SUPER_ADMIN → /admin, OWNER/AGENT → /org/:orgId)
   - Middleware de protección de rutas
   - Aislamiento de datos por tenant (RLS en Supabase)

2. **CRUD de Empresas (Organizations)**
   - SUPER_ADMIN crea/edita/desactiva empresas
   - Generación de link de acceso al portal scoped a cada empresa
   - Validaciones básicas (nombre único, slug único)

3. **Gestión de Usuarios por Empresa**
   - SUPER_ADMIN invita/crea usuarios (OWNER o AGENT)
   - Asignación de rol y empresa
   - Revocación de acceso
   - Email ya existe → reasignar membresía

4. **Configuración Base Bot/IA por Empresa**
   - SUPER_ADMIN configura: prompt base, modelo IA (Cerebras), temperatura (default)
   - Auditoría mínima: quién, qué, cuándo
   - Guardar en tabla `bots` (1 bot default por org)
   - UI muestra "último cambio por…"

### No-Alcance Sprint 01
- Envío/recepción real de mensajes WhatsApp
- Inbox y conversaciones
- Estados BOT/HUMAN/PENDING
- Handoff de conversaciones
- Media (imágenes, audios, PDFs)
- Procesamiento de IA (solo configuración)
- Facturación
- Campañas masivas
- Multi-panel SUPER_ADMIN (solo un admin requiere acceso)

## Casos de Uso Cubiertos
- CU1: Login y RBAC (4 subcasos)
- CU2: CRUD Empresas + link portal
- CU3: Gestión de usuarios (OWNER/AGENT)
- CU4: Config base Bot/IA + auditoría mínima

## Entidades Tocadas
- `organizations` (active/disabled)
- `users` (mínimo: email)
- `org_members` (membresía + role)
- `bots` (1 default por org)
- `audit_logs` (actor, acción, timestamp, diff mínimo)

## Criterios de Aceptación Globales
- [ ] Login funciona y crea sesión válida
- [ ] Redirección por rol funciona
- [ ] Rutas protegidas bloquean sin autenticación
- [ ] OWNER/AGENT no ven datos de otra empresa (RLS)
- [ ] SUPER_ADMIN CRUD empresas completo
- [ ] Invitar usuarios crea membresía
- [ ] Cambio de config bot queda en audit log
- [ ] UI consistente con kit global (sin CSS ad-hoc)
- [ ] Tests mínimos pasan (RBAC, RLS, API)
- [ ] Lint/typecheck/e2e pasan
- [ ] Deploy proof: worker + web + DB

## Restricciones
- No inventar roles adicionales (solo SUPER_ADMIN, OWNER, AGENT)
- No guardar secrets en texto plano
- No exponer tokens/keys en UI
- Stack fijo: Cloudflare Pages + Workers + Supabase
- UI minimalista + oscura, componentes del UI kit existente

---
**Estado:** SPEC DRAFT
