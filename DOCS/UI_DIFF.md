# UI_DIFF.md — UI Kit Changes Sprint 01

## Summary
Refactor completo del UI kit a tema oscuro (dark) + creación de 3 componentes nuevos.

**Status:** COMPLETE

---

## Cambios Realizados

### 1. Tokens Globales (NEW)
**File:** `packages/ui/src/tokens.ts`

- Definición centralizada de colores (dark theme: grays 50–950)
- Paleta de accents (blue de primarios)
- Status colors (success/warning/error/info)
- Spacing (xs–2xl)
- Typography (family, sizes, weights)
- Border (radius, width, color)
- Shadow (sm–2xl)
- Transition (fast/base/slow)

**Razón:** Mantener consistencia global. Prohibir hardcode de colores.

---

### 2. Refactor de Componentes Existentes → Dark Theme

#### Button.tsx
- ❌ Removed: Tailwind indigo-600 (light), white background
- ✅ Added: blue-600 primary, gray-700 secondary, dark backgrounds
- ✅ Added: focus:ring-offset-gray-900 (para dark theme)
- ✅ Changed: rounded-lg (desde rounded-md, más moderno)
- ✅ Added: transition-all duration-200

#### Input.tsx + Textarea.tsx
- ❌ Removed: border-gray-300, bg-white, text-gray-700, placeholder-gray-400
- ✅ Added: border-gray-600, bg-gray-800, text-gray-100, placeholder-gray-500
- ✅ Added: label text-gray-300
- ✅ Added: error text-red-400 (desde red-600)
- ✅ Added: rounded-lg y transition-colors duration-200
- ✅ Added: min-h-[100px] en Textarea

#### Select.tsx
- ❌ Removed: bg-white, border-gray-300, text-gray-700
- ✅ Added: bg-gray-800, border-gray-600, text-gray-100
- ✅ Added: grayscale-800 bg en option elements
- ✅ Added: rounded-lg y transición

#### Modal.tsx
- ❌ Removed: bg-white (card), text-gray-900 (title)
- ✅ Added: bg-gray-800, text-gray-100
- ✅ Added: border border-gray-700
- ✅ Added: rounded-xl (más modernista)
- ✅ Added: shadow-2xl (más dramático)
- ✅ Increased overlay darkness: black/50 → black/70

#### DataTable.tsx
- ❌ Removed: bg-white (tbody), bg-gray-50 (thead), borders gray-200/100
- ✅ Added: bg-gray-800 (tabla), bg-gray-900 (header), borders gray-700
- ✅ Added: text-gray-300 (body), text-gray-400 (header)
- ✅ Added: hover:bg-gray-750 (hover state)
- ✅ Added: transition-colors duration-200

#### Tabs.tsx
- ❌ Removed: border-gray-200, text-gray-500 (inactive), border-indigo-600 (active)
- ✅ Added: border-gray-700, text-gray-400 (inactive), border-blue-500 (active)
- ✅ Added: text-blue-400 (active), hover:text-gray-300
- ✅ Added: bg-gray-800 (contenedor)
- ✅ Added: rounded-b-lg y padding

#### Badge.tsx
- ❌ Removed: bg-gray-100 (default), success/warning/danger variants con backgrounds claros
- ✅ Added: bg-gray-700 (default), bg-green-900/success, bg-yellow-900/warning, bg-red-900/danger, bg-blue-900/info
- ✅ Added: text foreground claro (gray-300, green-200, etc.)

#### EmptyState.tsx
- ❌ Removed: text-gray-300 (icon), text-gray-900 (title), text-gray-500 (description)
- ✅ Added: text-gray-600 (icon), text-gray-200 (title), text-gray-400 (description)

---

### 3. Nuevos Componentes

#### AppShell.tsx (NEW)
- Layout principal: sidebar (collapsible) + header + content + footer
- Sidebar items con active state, icons, labels
- Logo section en sideb

ar
- Logout button con styling diferenciado
- Responsive collapse button (◀/▶)
- Sticky header
- Scroll main content
- Dark theme totalmente integrado

#### FormField.tsx (NEW)
- Wrapper para inputs/selects/textareas
- Props: label (required), error, helper, required (show *)
- Estructura: label → input → error/helper text
- Validaciones de accesibilidad (labels)
- Reutilizable en todos los formularios

#### Card.tsx (NEW)
- Tarjeta content wrapper
- Props: title, description, children, footer, variant (default/highlight)
- Variant highlight: gradient azul para destacar
- Border gray-700, bg-gray-800
- Header + content + footer separados
- Elevación (shadow-md)

---

### 4. Actualización de Exports

**File:** `packages/ui/src/index.ts`

- ✅ Added: AppShell export
- ✅ Added: FormField export
- ✅ Added: Card export
- ✅ Added: export * from './tokens' (para use en apps)

---

## Beneficios

1. ✅ **Consistencia global** — Sin CSS ad-hoc, tokens reutilizables
2. ✅ **Dark theme profesional** — Oscuro minimalista + azul moderno
3. ✅ **Componentes completos** — AppShell reduce boilerplate de layout
4. ✅ **Mejor UX** — Transiciones suaves, focus rings visibles, contraste WCAG AA
5. ✅ **Escalable** — Nuevos componentes pueden reutilizar tokens

---

## Checklist de Validación

- [x] Todos los componentes compilables
- [x] Estilos dark theme consistentes
- [x] FormField integrado en workflows
- [x] AppShell listo para layouts
- [x] Card versátil (default + highlight)
- [x] Exports centralizados
- [x] Tokens exportados y accesibles
- [x] Tailwind no tiene custom config (inline classes)

---

## Impacto en Pantallas

### LoginPage
- ✅ Usa Button, Input, Toast
- ✅ Centering sin AppShell (público)

### AdminDashboard
- ✅ Usa AppShell (sidebar + header)
- ✅ Usa Card para stats
- ✅ Usa DataTable para orgs
- ✅ Usa Button para CTA

### AdminOrgDetail
- ✅ Usa Tabs (Resumen, Bot/IA, Usuarios, Auditoría)
- ✅ Usa FormField + Input/Select/Textarea en cada tab
- ✅ Usa Modal para confirmar acciones
- ✅ Usa DataTable para usuarios/auditoría
- ✅ Usa Badge para estados

### OrgDashboard
- ✅ Usa AppShell (portal org)
- ✅ Usa EmptyState (Inbox placeholder)
- ✅ Usa Tabs (Inbox, Settings, Auditoría)

---

**Date:** 2026-03-04  
**Theme:** Dark + Blue accent  
**Version:** UI Kit 1.0.0
