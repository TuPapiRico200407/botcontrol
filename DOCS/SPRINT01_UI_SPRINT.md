# UI_SPRINT.md — Sprint 01

## Pantallas y Flujos

### 1. Pantalla: Login
**URL:** `/login`  
**Acceso:** Anónimo (redirect si autenticado)  
**Propósito:** Iniciar sesión  

#### Componentes del UI Kit a usar:
- **Input (Email):** TextField con validación RFC
- **Button (Primary):** CTA "Enviar magic link"
- **Toast:** Feedback (error/éxito)
- **FormField:** Wrapper para label + error

#### Layout Estructura:
```
┌─────────────────────────────────────┐
│         BotControl Login            │ (Brand, centered)
├─────────────────────────────────────┤
│                                     │
│   Email Input [_____________]       │
│   Error: (si aplica)                │
│                                     │
│   [Enviar Magic Link]               │
│                                     │
│   ¿No tienes cuenta? Crea una       │
│                                     │
└─────────────────────────────────────┘
```

#### Reglas UI:
- Minimalista, sin bordes fuertes
- Input con border suave, shadow hover
- Botón primary (oscuro/contraste) con hover state
- Centrado verticalmente en pantalla
- Responsive (mobile: 100% width con padding)
- Toast en esquina inferior derecha

#### Estados:
- **Idle:** Input listo, botón enabled
- **Loading:** Botón disabled + spinner
- **Error:** Toast rojo, input con border rojo
- **Success:** Toast verde, redirige a siguiente paso (o a org)

**No-Alcance:** OAuth, 2FA, confirmación de password en Sprint 01.

---

### 2. Pantalla: Admin Dashboard
**URL:** `/admin`  
**Acceso:** SUPER_ADMIN solo  
**Propósito:** Vista general de empresas, usuarios, bots  

#### Componentes del UI Kit a usar:
- **AppShell:** Layout con sidebar + header + content
- **Button (Primary/Secondary):** CTA "Crear Empresa", acciones
- **DataTable:** Mostrar empresas (sin datos, placeholder)
- **Card:** Resumen (stats: # empresas, # usuarios, # bots pendientes)
- **Badge:** Estado activo/inactivo
- **EmptyState:** Si no hay empresas

#### Layout Estructura:
```
┌────────────────────────────────────────────────┐
│ Logo  |  BotControl Admin                       │ Header
├──────┬────────────────────────────────────────┤
│Sidebar│                                       │
│       │  [+ Crear Empresa]                    │ Content
│Home   │                                       │
│Empres.│  Cards: # Empresas, # Usuarios        │
│Auditoría│                                      │
│Usuarios│                                      │
│       │  Empresas (tabla/cards)               │
│       │  [Acme Inc] [Tech Corp] ...           │
│       │  (links a detalles)                   │
└──────┴────────────────────────────────────────┘
```

#### Reglas UI:
- Sidebar oscuro (dark background), texto claro
- Header con logo + username + logout
- Card stats con gradiente sutil
- DataTable con buscador (búsqueda por nombre/slug)
- Botón "+ Crear Empresa" en header de tabla
- Links a detalles en cada fila

#### Estados:
- **Idle:** Muestra empresas
- **Crear:** Abre modal CreateOrgModal
- **Click empresa:** Navega a /orgs/:id

**No-Alcance:** Filtros avanzados, exportación, gráficos.

---

### 3. Pantalla: Detalle Empresa (Admin)
**URL:** `/admin/orgs/:orgId` o `/orgs/:orgId` (admin view)  
**Acceso:** SUPER_ADMIN, OWNER (propia)  
**Propósito:** Gestionar empresa (Resumen, Bot/IA, Usuarios, Auditoría)  

#### Componentes del UI Kit a usar:
- **Tabs:** 4 tabs (Resumen, Bot/IA, Usuarios, Auditoría)
- **FormField:** Inputs nombre, slug
- **Button:** Guardar, Editar, Desactivar, Volver
- **Select:** Estado (activo/inactivo)
- **DataTable:** Usuarios, Auditoría
- **Modal:** Confirmar acción destructiva
- **Toast:** Feedback resultados

#### Estructura por Tab

##### Tab 1: Resumen
```
┌──────────────────────────────────┐
│  Resumen  Bot/IA  Usuarios  Audit│
├──────────────────────────────────┤
│                                  │
│  Nombre: [Acme Inc______] Editar │
│  Slug:   [acme-inc_____] Editar  │
│  Estado: [Activo ▼]              │
│  Link:   https://app.../acme-inc │
│          [Copiar]                │
│  Creado: 2026-03-01 por admin... │
│                                  │
│  [Desactivar]  [Volver]          │
└──────────────────────────────────┘
```

##### Tab 2: Bot/IA
```
┌──────────────────────────────────┐
│  Resumen  Bot/IA  Usuarios  Audit│
├──────────────────────────────────┤
│                                  │
│  Prompt:                         │
│  [Textarea multiline]            │
│                                  │
│  Modelo: [cerebras/gpt-3.5 ▼]    │
│  Temperatura: [0.7 ___]          │
│                                  │
│  Última actualización:           │
│  2026-03-03 14:00 por owner@...  │
│                                  │
│  [✓ Guardar]  [Cancelar]         │
└──────────────────────────────────┘
```

##### Tab 3: Usuarios
```
┌──────────────────────────────────┐
│  Resumen  Bot/IA  Usuarios  Audit│
├──────────────────────────────────┤
│                  [+ Invitar]     │
│                                  │
│  Email     | Rol    | Estado | \| │
│  owner@... | OWNER  | Activo | ⋯ │
│  agent1... | AGENT  | Activo | ⋯ │
│  agent2... | AGENT  | Revok. | ⋯ │
│                                  │
└──────────────────────────────────┘
```

Menu ⋯: Cambiar rol, Revocar acceso, Reactivar

##### Tab 4: Auditoría
```
┌──────────────────────────────────┐
│  Resumen  Bot/IA  Usuarios  Audit│
├──────────────────────────────────┤
│  Filtro: [Acción ▼] [Aplicar]    │
│                                  │
│  Fecha     | Actor    | Acción    │
│  2026-03-04| admin@...|update_bot │
│  2026-03-03| owner@...|edit_member│
│  2026-03-01| admin@...|create_org │
│                                  │
└──────────────────────────────────┘
```

#### Reglas UI:
- Tabs con underline suave
- FormField con validación inline
- Botones guardados con transición visual
- DataTable con paginación (10 items por página)
- Modal confirmar antes de desactivar
- Toast (verde) al guardar exitosamente
- Toast (rojo) si hay error

---

### 4. Modal: Crear Empresa
**Trigger:** Click "+ Crear Empresa"  
**Propósito:** Nuevo formulario de empresa  

#### Componentes:
- **Modal**
- **Input:** Nombre, Slug
- **Button:** Crear, Cancelar
- **FormField:** Labels + errors

```
┌──────────────────────────────┐
│  Crear Empresa           [X] │
├──────────────────────────────┤
│                              │
│  Nombre*  [______________]   │
│           Máx 100 caracteres │
│                              │
│  Slug*    [______________]   │
│           3+ chars, minúsc.  │
│                              │
│               [Crear] [Cancel]│
└──────────────────────────────┘
```

#### Validaciones UI:
- Nombre no vacío
- Slug válido (regexp live feedback)
- Botón Crear deshabilitado si hay errores
- Error messages inline bajo input

---

### 5. Modal: Invitar Usuario
**Trigger:** Click "+ Invitar" en tab Usuarios  
**Propósito:** Añadir nuevo miembro a empresa  

```
┌──────────────────────────────┐
│  Invitar Usuario         [X] │
├──────────────────────────────┤
│                              │
│  Email*   [______________]   │
│           (validación RFC)   │
│                              │
│  Rol*     [OWNER        ▼]   │
│           Opciones:          │
│           - OWNER            │
│           - AGENT            │
│                              │
│             [Invitar] [Cancel]│
└──────────────────────────────┘
```

#### Lógica:
- Si email existe + ya es miembro → error "Ya existe"
- Si email existe + no es miembro → crear membresía nueva
- Si email no existe → crear user + membresía

---

### 6. Pantalla: Portal Empresa (OWNER/AGENT)
**URL:** `/org/:orgId` (después de login)  
**Acceso:** Miembros con role OWNER/AGENT  
**Propósito:** Vista de empresa (Inbox placeholder, Settings, Auditoría)  

#### Componentes:
- **AppShell:** Sidebar + header
- **Tabs:** 3 tabs (Inbox placeholder, Settings, Auditoría)
- **EmptyState:** Inbox sin mensajes (futura funcionalidad)

#### Estructura

##### Tab 1: Inbox (Placeholder)
```
┌──────────────────────────────────┐
│ Logo        Org: Acme Inc  👤   │
├─────┬────────────────────────────┤
│ Inbox   │  [No hay conversaciones]│
│ Settings│  Inbox estará disponible│
│ Auditoría│  en próximo sprint      │
│         │                        │
│ Logout  │  [Recargar]            │
│         │                        │
└─────┴────────────────────────────┘
```

##### Tab 2: Settings (OWNER solo)
- Mismo que Admin detail, tab Bot/IA
- Si AGENT → EmptyState "Sin acceso"

##### Tab 3: Auditoría (OWNER solo)
- DataTable auditoría
- Si AGENT → EmptyState "Sin acceso"

#### Reglas UI:
- Sidebar con nombre de org destacado
- Botón Logout en sidebar
- Si AGENT intenta Settings/Auditoría → bloquear UI (disabled) + tooltip "No tienes acceso"
- EmptyState con icono + mensaje amable

---

## Componentes del UI Kit Usados

| Componente | Status | Sprint 01 Uso |
|-----------|--------|--------------|
| Button | Existente | Primary, Secondary, Danger (en modals confirm) |
| Input (TextField) | Existente | Email, nombre, slug, textarea |
| Select | Existente | Rol, modelo IA, estado |
| Modal | Existente (revisar) | CreateOrg, InviteUser, Confirm |
| DataTable | Existente (revisar) | Usuarios, empresas, auditoría |
| Tabs | Existente (revisar) | Detail org (4 tabs) |
| FormField | Existente (revisar) | Wrapper label + error |
| Badge | Existente | Estado (Activo/Inactivo) |
| Toast | Existente | Notificaciones resultado |
| EmptyState | Existente | Inbox, auditoría sin datos |
| AppShell | Existente (revisar) | Layout sidebar + header |
| Card | Existente (revisar) | Stats dashboard |

**Revisiones necesarias (en FASE 3):**
- Modal: ¿Soporta title + close button? ¿Size por defecto?
- DataTable: ¿Tiene buscador integrado? ¿Paginación?
- Tabs: ¿Border bottom? ¿Active state?
- AppShell: ¿Sidebar collapsible? ¿Header sticky?

---

## Estilo Global Obligatorio

- **Colores:** Neutros oscuros (gris #1a1a1a, blanco #f5f5f5, acentos suave azul)
- **Tipografía:** Sans-serif, legible (Inter, Roboto)
- **Espaciado:** Aire generoso (16px, 24px, 32px)
- **Bordes:** Suaves (radius 8px, 12px)
- **Sombras:** Sutiles (box-shadow: 0 2px 8px rgba(0,0,0,0.1))
- **Feedback:** Transiciones suaves (200ms ease-out)
- **Accesibilidad:** Contraste WCAG AA mínimo, focus ring visible

---

## Flujo de Navegación

```
[Login] → /login
  ↓ (exitoso)
[Dashboard] → /admin (SUPER_ADMIN)
            → /org/:id (OWNER/AGENT)
  ↓
[Org Detail] → /admin/orgs/:id (SUPER_ADMIN)
            → /org/:id (OWNER/AGENT)
             ├─ Tab: Resumen
             ├─ Tab: Bot/IA
             ├─ Tab: Usuarios (SUPER_ADMIN + OWNER)
             └─ Tab: Auditoría (SUPER_ADMIN + OWNER)
  ↓
[Modals]
  ├─ CreateOrg
  ├─ InviteUser
  └─ Confirm (generic)
```

---

**Estado:** SPEC DRAFT
