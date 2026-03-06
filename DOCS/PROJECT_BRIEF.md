# PROJECT_BRIEF.md

## Objetivo
Construir una plataforma central (panel web) para administrar bots de WhatsApp por empresa, con:
- **Panel principal (Super Admin)**: solo para ti, donde ves y gestionas todas las empresas, bots y números.
- **Portal por empresa (Owner/Agent)**: acceso por link (y login) para que cada empresa vea su **inbox/chat** y opere atención humana cuando el bot no pueda.
- Integración con **WhatsApp Cloud API** (números por empresa, WABA compartido).
- Respuestas automáticas con **IA Cerebras**.
- Soporte de mensajes **texto, imágenes, audios y PDFs**.

## Alcance
### Incluye
- Multi-empresa (tenants) con aislamiento de datos.
- 3 roles: **SUPER_ADMIN**, **OWNER**, **AGENT**.
- Inbox estilo “WhatsApp Web”: lista de conversaciones + vista chat.
- Estados de conversación: **BOT / HUMAN / PENDING** (handoff).
- Configuración por empresa: bot + IA (modelo/proveedor) y reglas de handoff.
- Auditoría de cambios (mínimo): quién cambió qué y cuándo.
- WhatsApp webhook: recepción y envío de mensajes.
- Media (imagen/audio/pdf): almacenar y mostrar; extracción de texto/transcripción para IA (pipeline).

### No-alcance (por ahora)
- Facturación / suscripciones / cobros automáticos.
- Campañas masivas y mensajes fuera de ventana con templates (solo si se decide después).
- Flujos complejos tipo CRM completo (pipeline ventas, etc.).
- Multi-panel para múltiples super-admin (panel principal será solo tuyo).

## Usuarios/Roles
- **SUPER_ADMIN** (tú): acceso total (empresas, números, bots, usuarios, auditoría, health).
- **OWNER** (dueño de empresa): ve y gestiona SOLO su empresa: inbox + configuración bot/IA + auditoría (según permiso).
- **AGENT** (atención): ve SOLO inbox de su empresa, responde, toma/libera chats, tags/notas. Sin acceso a credenciales sensibles.

## Módulos
1) **Auth & RBAC**
   - Login (Supabase Auth) + control de acceso por rol
   - Membresías por empresa (org_members)

2) **Empresas**
   - Crear/editar empresa
   - Link de acceso al portal (scoped a la empresa)

3) **Bots & IA**
   - Config bot (prompt base, parámetros)
   - Config IA (Cerebras model, temperatura, etc.)
   - Override opcional por conversación (asignar bot/modelo)

4) **WhatsApp Channels**
   - Números por empresa (WABA compartido)
   - Webhook recepción + envío

5) **Inbox & Handoff**
   - Conversaciones + mensajes
   - Estados BOT/HUMAN/PENDING
   - Asignación a agentes
   - Tags + notas internas

6) **Media Pipeline**
   - Guardar archivos (Supabase Storage)
   - Extraer texto/transcribir (procesadores pluggables)
   - Adjuntar transcript/texto al mensaje para uso de IA
   - Fallback a handoff si falla

7) **Auditoría & Health**
   - Audit log por empresa
   - Registro mínimo de eventos críticos (webhook errors, cambios config)

## Reglas duras
- Aislamiento por empresa: un OWNER/AGENT **no ve** datos de otras empresas.
- Configuración de bot/IA solo por roles permitidos.
- Handoff: cuando se activa, el bot **no responde** hasta que se devuelva a BOT.
- WABA compartido permitido; **número único por empresa**.

## Restricciones técnicas (stack definido)
- **Frontend**: Cloudflare Pages (app web).
- **API/Webhook**: Cloudflare Workers.
- **BD/Auth/Realtime/Storage**: Supabase (Postgres + RLS + Storage).
- **IA**: Cerebras (API compatible tipo OpenAI).

## Riesgos
- Procesamiento de audio/imagen/pdf puede requerir servicios adicionales (Workers no ejecutan modelos pesados).
- Cumplimiento WhatsApp (ventanas de 24h / templates) si luego se quiere mensajería proactiva.
- Manejo seguro de credenciales (tokens WhatsApp, keys IA): cifrado y acceso mínimo.
- Escalabilidad real-time (inbox) según volumen (mitigar con paginación + índices + realtime selectivo).