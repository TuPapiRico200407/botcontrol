# SPRINT02_UI_KIT_SPECIFICATION.md

## 🎨 FASE 3: UI Kit Specification

### Overview
Extensión del UI Kit de Sprint 01 con 3 nuevos componentes + refinamiento de tokens para WhatsApp integration.

---

## 1. Design Tokens Updates

### Colores (Dark Theme)

#### Escala Gris
```
gray-50:   #f9fafb (no usado, muy claro)
gray-100:  #f3f4f6 (texto primario)
gray-200:  #e5e7eb (no usado)
gray-300:  #d1d5db (no usado)
gray-400:  #9ca3af (texto secundario/hint)
gray-500:  #6b7280 (borders ligeros)
gray-600:  #4b5563 (no usado)
gray-700:  #374151 (borders, hover)
gray-800:  #1f2937 (panels)
gray-900:  #111827 (background principal)
```

#### Colores Funcionales (WhatsApp)
```
blue-600:   #2563eb (bot, outbound messages, accents)
blue-700:   #1d4ed8 (hover bot)
blue-900:   #1e3a8a (info box background)

red-600:    #dc2626 (human, destructive actions)
red-700:    #b91c1c (hover destructive)
red-900:    #7f1d1d (error background)

yellow-500: #eab308 (pending, warnings)
yellow-600: #ca8a04 (hover pending)
yellow-900: #713f12 (warning background)

green-600:  #16a34a (success)
green-700:  #15803d (hover success)
```

#### Estado Badges
```
BOT:     bg-blue-600   text-white
HUMAN:   bg-red-600    text-white
PENDING: bg-yellow-500 text-gray-900
```

---

## 2. Spacing Scale

### Tokens
```
Space 0:   0px
Space 1:   4px
Space 2:   8px
Space 3:   12px
Space 4:   16px (default padding)
Space 5:   20px
Space 6:   24px
Space 8:   32px
Space 10:  40px
Space 12:  48px
```

### Usage
```
Button padding:          space-2 (vertical) × space-4 (horizontal)
Card padding:            space-4
Form field spacing:      space-4 (gap between fields)
List item padding:       space-3 (vertical) × space-3 (horizontal)
Modal padding:           space-6
Sidebar padding:         space-4
```

---

## 3. Typography

### Font Family
```
Font Stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
```

### Sizes
```
xs:  12px (line-height: 16px)  - helper text, timestamps
sm:  14px (line-height: 20px)  - body text, form labels
base: 16px (line-height: 24px) - default
lg: 18px (line-height: 28px)   - page titles (unused Sprint 02)
xl: 20px (line-height: 28px)   - main headings (unused Sprint 02)
```

### Weights
```
Normal:  400 (default)
Medium:  500 (labels, badges)
Semibold: 600 (headings, emphasize)
Bold:    700 (rare, emphasize heavily)
```

### Usage
```
Page Title:        font-semibold text-lg text-gray-100
List Title:        font-semibold text-sm text-gray-100
List Subtitle:     text-xs text-gray-400
Body Text:         text-sm text-gray-300
Button Text:       text-sm font-medium text-white
Badge Text:        text-xs font-medium
Timestamp:         text-xs text-gray-500
Helper/Hint:       text-xs text-gray-400
```

---

## 4. Border Radius

### Scale
```
none:    0px
xs:      2px
sm:      4px (default for form inputs)
base:    6px
md:      8px (default for cards)
lg:      10px
xl:      12px
full:    9999px (buttons, badges, circles)
```

### Usage
```
Buttons:        rounded-md (8px)
Inputs:         rounded-sm (4px)
Cards:          rounded-md (8px)
Badges:         rounded-full (circle)
List Items:     rounded-lg (10px)
Modals:         rounded-lg (10px)
Selects:        rounded-sm (4px)
```

---

## 5. Shadows

### Scale
```
none:     no shadow
sm:       box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.5)
base:     box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4)
md:       box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3)
lg:       box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2)
xl:       (no usar en dark theme)
```

### Usage
```
Message Bubbles:    shadow-sm
Cards/Panels:       shadow-base
Modals:             shadow-lg
Hover Effects:      shadow-md (on hover)
```

---

## 6. Animations & Transitions

### Timing
```
Fast:     150ms
Base:     200ms (default)
Slow:     300ms
Slower:   500ms (rare)
```

### Easing
```
in:       cubic-bezier(0.4, 0, 1, 1)      // ease-in
out:      cubic-bezier(0, 0, 0.2, 1)     // ease-out (default)
inOut:    cubic-bezier(0.4, 0, 0.2, 1)   // ease-in-out
```

### Animations

#### fadeIn
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn { animation: fadeIn 200ms ease-out; }
```

#### slideInRight
```css
@keyframes slideInRight {
  from { transform: translateX(20px); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}
.animate-slideInRight { animation: slideInRight 200ms ease-out; }
```

#### pulse (loading)
```css
@keyframes pulse {
  0%, 100%   { opacity: 1; }
  50%        { opacity: 0.5; }
}
.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
```

#### spin (loading spinner)
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.animate-spin { animation: spin 1s linear infinite; }
```

### Transitions
```
/* Default on many elements */
transition: background-color 200ms ease-out,
            color 200ms ease-out,
            border-color 200ms ease-out;

/* Hover effects */
.hover\:transition { transition: all 150ms ease-out; }
```

---

## 7. Component Defaults

### ConversationList
```
Container:
  - Background: bg-gray-900
  - Border: border-r border-gray-700
  - Padding: p-0 (items handle padding)

Item (Default):
  - Padding: p-3
  - Border: border-b border-gray-700
  - Hover: hover:bg-gray-800 transition
  - Cursor: cursor-pointer

Item (Selected):
  - Background: bg-gray-700
  - Border Left: border-l-2 border-blue-600
  - Highlight indicator

List Divider:
  - divide-y divide-gray-700

Empty State:
  - Icon size: 3xl
  - Title: font-semibold text-gray-100
  - Description: text-sm text-gray-400

Skeleton Loader:
  - Height: h-4 (text), h-3 (subtext)
  - Background: bg-gray-700
  - Animation: animate-pulse
  - Spacing: space-y-2
```

### ChatTimeline
```
Container:
  - Background: bg-gray-900
  - Padding: p-4
  - Overflow: overflow-y-auto

Messages Container:
  - Spacing: space-y-3
  - Height: flex-1 (fill available)

Message Bubble (Inbound):
  - Background: bg-gray-700
  - Text: text-gray-100
  - Max Width: max-w-xs
  - Padding: px-4 py-2
  - Border Radius: rounded-lg
  - Shadow: shadow-sm
  - Alignment: justify-start

Message Bubble (Outbound):
  - Background: bg-blue-600
  - Text: text-white
  - Max Width: max-w-xs
  - Padding: px-4 py-2
  - Border Radius: rounded-lg
  - Shadow: shadow-sm
  - Alignment: justify-end
  - Animation: animate-fadeIn

Timestamp:
  - Font Size: text-xs
  - Color: opacity-70 (of bubble text)
  - Margin: mt-1

Load More Button:
  - Position: border-t border-gray-700, py-2
  - Styling: variant="outline", size="sm"
```

### ChannelForm
```
Form Container:
  - Spacing: space-y-4
  - Form fields: space-y-4

Field Container:
  - Margin: mb-4
  - Label: block text-sm font-medium text-gray-100
  - Input: w-full, rounded-sm, bg-gray-800, text-gray-100, border border-gray-700
  - Help text: text-xs text-gray-400 mt-1
  - Error: text-xs text-red-400 mt-1

Input States:
  - Default: border border-gray-700
  - Focus: ring-1 ring-blue-600, border-blue-600
  - Error: border border-red-600, ring-1 ring-red-600
  - Disabled: bg-gray-900, opacity-50, cursor-not-allowed

Info Box:
  - Background: bg-blue-900/20
  - Border: border border-blue-700
  - Padding: p-3
  - Border Radius: rounded
  - Text: text-sm text-blue-200

Error Box:
  - Background: bg-red-900/20
  - Border: border border-red-700
  - Padding: p-3
  - Border Radius: rounded
  - Text: text-sm text-red-200

Button Group:
  - Margin: pt-4
  - Border Top: border-t border-gray-700
  - Spacing: flex gap-2 justify-end
  - Buttons: Primary + Outline variant
```

---

## 8. Responsive Design

### Breakpoints
```
Mobile:   < 640px   (no specific changes for Sprint 02)
Tablet:   640px-1024px
  - ConversationList: 35% width (from 25%)
  - ChatTimeline: 65% width (from 75%)

Desktop:  > 1024px
  - ConversationList: 25% width
  - ChatTimeline: 75% width
```

### Mobile Considerations
```
List items:   tap target ≥ 44px (usually p-3 = 48px ✓)
Message bubbles: max-w-sm (narrower on mobile)
Form inputs:   full width with max-w-lg
Buttons:       full width or min-w-[44px]
Modal:         full-screen or 95vw max
```

---

## 9. Accessibility

### Color Contrast
```
✓ Text on gray-700: #f3f4f6 on #374151 = 11.5:1 (AAA)
✓ Text on blue-600: #ffffff on #2563eb = 5.8:1 (AA)
✓ Text on red-600: #ffffff on #dc2626 = 4.8:1 (AA)
✗ Text on gray-800: #f3f4f6 on #1f2937 = 9.2:1 (AAA but low contrast)
```

### Focus Indicators
```
All interactive elements:
  - :focus { ring-2 ring-offset-2 ring-blue-600 }
  - Visible ring around buttons, inputs, links
  - Offset for contrast (offset-gray-900)
```

### ARIA Labels
```
ConversationList:
  - role="listbox"
  - aria-label="Conversation list"
  - Each item: role="option", aria-selected

ChatTimeline:
  - role="log" (live region)
  - aria-label="Message timeline"
  - aria-live="polite"

Buttons:
  - aria-label for icon-only buttons
  - aria-busy during loading
  - aria-disabled for disabled state
```

### Keyboard Navigation
```
ConversationList:
  - Tab: navigate between items
  - Enter/Space: select item
  - Arrow Keys: up/down through list (optional, nice-to-have)

ChatTimeline:
  - Read mode (no focus needed)

ChannelForm:
  - Tab: navigate through fields
  - Enter: submit form
  - Escape (in Modal): close
```

---

## 10. Dark Theme Implementation

### CSS Variables Approach (Optional)
```css
:root {
  --color-bg-primary: #111827;    /* gray-900 */
  --color-bg-secondary: #1f2937;  /* gray-800 */
  --color-bg-tertiary: #374151;   /* gray-700 */
  
  --color-text-primary: #f3f4f6;  /* gray-100 */
  --color-text-secondary: #9ca3af; /* gray-400 */
  
  --color-border: #374151;        /* gray-700 */
  
  --color-state-bot: #2563eb;     /* blue-600 */
  --color-state-human: #dc2626;   /* red-600 */
  --color-state-pending: #eab308; /* yellow-500 */
}
```

### Tailwind Approach (Current)
```tsx
className="bg-gray-900 text-gray-100 border border-gray-700"
```

---

## 11. Component Library Export

### File: packages/ui/src/index.ts
```typescript
// Existing (Sprint 01)
export { Badge } from './Badge';
export { Button } from './Button';
export { Card } from './Card';
export { DataTable } from './DataTable';
export { EmptyState } from './EmptyState';
export { FormField } from './FormField';
export { Input } from './Input';
export { Modal } from './Modal';
export { Select } from './Select';
export { Spinner } from './Spinner';
export { Tabs } from './Tabs';
export { Toast } from './Toast';
export { Textarea } from './Textarea';

// New (Sprint 02)
export { ConversationList } from './ConversationList';
export { ChatTimeline } from './ChatTimeline';
export { ChannelForm } from './ChannelForm';

// Types
export type { Conversation, Message, Channel } from './types/whatsapp';
```

---

## 12. Testing Checklist

### Visual Regression
- [ ] All components render correctly (light/dark)
- [ ] Spacing consistent (space-4 = 16px)
- [ ] Colors match tokens
- [ ] Borders and shadows correct
- [ ] Typography hierarchy clear

### Responsive
- [ ] Mobile: 375px width
- [ ] Tablet: 768px width
- [ ] Desktop: 1440px width
- [ ] No horizontal scrolling

### Accessibility
- [ ] Contrast ratios ≥ 4.5:1 (AA)
- [ ] Focus rings visible
- [ ] Keyboard navigation works
- [ ] Screen reader friendly

### Dark Mode
- [ ] No harsh contrast
- [ ] No white text on light backgrounds
- [ ] Skeleton loaders visible
- [ ] Hover states clear

---

## 13. Component Checklist

### ConversationList
- [ ] Renders list of conversations
- [ ] Selected item highlighted
- [ ] Filter by state works
- [ ] Empty state shown when needed
- [ ] Skeleton loaders on loading
- [ ] Pagination ready (button to load more)
- [ ] Responsive layout
- [ ] Accessibility: ARIA labels + keyboard nav
- [ ] Dark theme applied
- [ ] Animations smooth

### ChatTimeline
- [ ] Renders messages in chronological order
- [ ] Inbound/outbound bubbles styled correctly
- [ ] Timestamps visible and accurate
- [ ] Auto-scroll to latest message
- [ ] Skeleton loaders on loading
- [ ] Load more button functional
- [ ] Responsive (narrow on mobile)
- [ ] Accessibility: live region + ARIA labels
- [ ] Dark theme applied
- [ ] Animations smooth

### ChannelForm
- [ ] All fields render
- [ ] Validation messages shown
- [ ] Password fields masked
- [ ] Info box displays (help text)
- [ ] Error box shows (if error prop)
- [ ] Loading state: spinner + disabled button
- [ ] Success: form clears (internal state)
- [ ] Cancel button works
- [ ] Form submission validated
- [ ] Dark theme applied
- [ ] Accessibility: labels + focus rings

---

## 14. Design System Document

### Live Preview (storybook-like)
- All components with variants
- Dark theme toggle
- Responsive previewer
- Accessibility checker

### Guidelines
- Used in LayoutGrid
- Spacing between components
- When to use badges vs buttons
- Error vs warning styling

---

## Deliverables (FASE 3)

✅ Design tokens complete
✅ Spacing scale defined
✅ Typography system
✅ Border radius scale
✅ Shadows defined
✅ Animations documented
✅ Component defaults specified
✅ Responsive breakpoints
✅ Accessibility guidelines
✅ Dark theme tokens
✅ Component export list
✅ Testing checklist
✅ Design system structure

