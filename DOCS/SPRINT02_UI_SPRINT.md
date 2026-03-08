# SPRINT02_UI_SPRINT.md

## 🎨 UI Specification - Sprint 02

### Overview
Sprint 02 agrega 3 nuevas pantallas:
1. **Canales WhatsApp** (lista + crear)
2. **Inbox** (lista de conversaciones)
3. **Chat** (timeline de mensajes)

Mantiene dark theme + Tailwind de Sprint 01.

---

## 1. Pantalla: Empresa > Canales WhatsApp

### Ruta
```
/org/:orgId/channels
```

### Acceso
- OWNER, SUPER_ADMIN
- AGENT: (403 Forbidden en Sprint 02)

### Layout

```
┌─────────────────────────────────────────┐
│ Canales WhatsApp                        │
│ [← Back]                    [+ Conectar]│
├─────────────────────────────────────────┤
│                                         │
│ Tabla: Número | Estado | Acciones      │
│ ┌──────────────────────────────────────┐│
│ │ +1 234-567-8900 ✓ Verificado        ││ Delete icon
│ │ Phone ID: Phone:123456789           ││
│ ├──────────────────────────────────────┤│
│ │ +91 98765-43210 ⏱ Pendiente         ││ Delete icon
│ │ Phone ID: Phone:987654321           ││
│ └──────────────────────────────────────┘│
│                                         │
│ [Sin canales? Conecta tu primer número]│
└─────────────────────────────────────────┘
```

### Componentes

#### Card Principal
```tsx
<div className="space-y-6">
  <div className="flex justify-between items-center">
    <h1>Canales WhatsApp</h1>
    <Button onClick={openModal}>+ Conectar Número</Button>
  </div>
  
  <div className="space-y-3">
    {channels.map(ch => (
      <ChannelItem key={ch.id} channel={ch} />
    ))}
  </div>
</div>
```

#### Channel Item
```tsx
<div className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
  <div>
    <p className="font-semibold">{formatPhone(ch.phone_number)}</p>
    <p className="text-sm text-gray-400">ID: {ch.phone_number_id}</p>
    <p className="text-xs text-gray-500 mt-1">
      {ch.verified_at ? '✓ Verificado' : '⏱ Pendiente'}
    </p>
  </div>
  <div className="flex gap-2">
    <Button size="sm" onClick={() => deleteChannel(ch.id)} variant="destructive">
      Eliminar
    </Button>
  </div>
</div>
```

### Modal: Conectar Número

```
┌───────────────────────────────────────┐
│ Conectar Número WhatsApp          [x] │
├───────────────────────────────────────┤
│                                       │
│ 1. Obtén phone_number_id de:         │
│    https://developers.facebook.com    │
│                                       │
│ Phone Number ID*                      │
│ [___________________________]          │
│                                       │
│ Access Token*                         │
│ [___________________________]          │
│ (será encriptado en la BD)            │
│                                       │
│ [Cancela]  [Validar y Conectar]      │
│                                       │
│ ✓ Conectado exitosamente! + 123     │
│ ✗ Token inválido. Verifica en FB    │
└───────────────────────────────────────┘
```

#### Form Fields
```tsx
<form onSubmit={handleConnect} className="space-y-4">
  <FormField>
    <Label>Phone Number ID *</Label>
    <Input 
      placeholder="Phone:123456789"
      {...register('phone_number_id')}
    />
  </FormField>
  
  <FormField>
    <Label>Access Token *</Label>
    <Input 
      type="password"
      placeholder="sk_live_..."
      {...register('access_token')}
    />
    <p className="text-xs text-gray-400 mt-1">
      Se encriptará en la BD. No será visible después.
    </p>
  </FormField>
  
  <div className="flex gap-2 justify-end">
    <Button variant="outline" onClick={closeModal}>Cancelar</Button>
    <Button type="submit" disabled={isLoading}>
      {isLoading ? '⏳ Validando...' : 'Validar y Conectar'}
    </Button>
  </div>
</form>
```

#### States
- **Loading**: Spinner, button disabled
- **Success**: Toast "✓ Número conectado exitosamente"
- **Error**: Toast "✗ Error: {msg}" (no mostrar token)

---

## 2. Pantalla: Inbox

### Ruta
```
/org/:orgId/inbox
```

### Acceso
- OWNER, AGENT, SUPER_ADMIN
- RLS: solo ven conversaciones de su org

### Layout (2-column)

```
┌──────────────────┬────────────────────────┐
│ Inbox            │                        │
│ [Filter: BOT  ▼] │ Selecciona un chat     │
│                  │                        │
│ ┌────────────┐   │                        │
│ │ +1234567890│   │                        │
│ │ John Doe   │   │                        │
│ │ Hola, ne.. │   │                        │
│ │ 14:30      │   │                        │
│ ├────────────┤   │                        │
│ │ +91987654   │   │                        │
│ │ Jane Smith │   │                        │
│ │ Gracias... │   │                        │
│ │ 12:15      │   │                        │
│ └────────────┘   │                        │
│ [Cargar más...]  │                        │
└──────────────────┴────────────────────────┘
```

### Left Column: Conversation List

#### Structure
```tsx
<div className="flex-1 border-r border-gray-700 overflow-y-auto">
  <div className="p-4 border-b border-gray-700">
    <Select 
      value={filterState}
      onChange={setFilterState}
    >
      <option value="">Todos</option>
      <option value="BOT">Bot</option>
      <option value="HUMAN">Humano</option>
      <option value="PENDING">Pendiente</option>
    </Select>
  </div>
  
  <div className="divide-y divide-gray-700">
    {conversations.map(conv => (
      <ConversationItem 
        key={conv.id}
        conv={conv}
        selected={selected?.id === conv.id}
        onClick={() => setSelected(conv)}
      />
    ))}
  </div>
  
  {hasMore && (
    <Button variant="outline" onClick={loadMore} className="w-full">
      Cargar más...
    </Button>
  )}
</div>
```

#### Conversation Item
```tsx
<div
  onClick={onClick}
  className={`p-3 cursor-pointer hover:bg-gray-700 transition ${
    selected ? 'bg-gray-700' : ''
  }`}
>
  <div className="flex justify-between items-start">
    <p className="font-semibold text-sm">{formatPhone(conv.phone_number)}</p>
    <span className={`px-2 py-1 text-xs rounded ${
      conv.state === 'BOT' ? 'bg-blue-600' :
      conv.state === 'HUMAN' ? 'bg-red-600' :
      'bg-yellow-600'
    }`}>
      {conv.state}
    </span>
  </div>
  <p className="text-xs text-gray-400 mt-1">{conv.contact_name}</p>
  <p className="text-sm text-gray-300 truncate mt-2">{conv.last_message_text}</p>
  <p className="text-xs text-gray-500 mt-1">{formatTime(conv.last_message_at)}</p>
</div>
```

#### State Badge Colors
- **BOT**: Blue (bg-blue-600)
- **HUMAN**: Red (bg-red-600)
- **PENDING**: Yellow (bg-yellow-600)

### Right Column: Chat Timeline

#### Structure (Empty)
```tsx
{!selected ? (
  <div className="flex-1 flex items-center justify-center text-gray-400">
    <p>Selecciona un chat para ver mensajes</p>
  </div>
) : (
  <div className="flex-1 flex flex-col overflow-hidden">
    <ChatHeader conversation={selected} />
    <ChatMessages conversation={selected} />
  </div>
)}
```

#### Chat Header
```tsx
<div className="border-b border-gray-700 p-4 flex justify-between items-center">
  <div>
    <h2 className="font-semibold">{formatPhone(selected.phone_number)}</h2>
    <p className="text-xs text-gray-400">{selected.contact_name}</p>
  </div>
  <Badge variant={selected.state === 'BOT' ? 'primary' : 'destructive'}>
    {selected.state}
  </Badge>
</div>
```

#### Chat Messages
```tsx
<div className="flex-1 overflow-y-auto p-4 space-y-3">
  {messages.map(msg => (
    <Message key={msg.id} message={msg} />
  ))}
  <div ref={messagesEndRef} />
</div>
```

#### Message Bubble
```tsx
<div className={`flex ${msg.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}>
  <div className={`max-w-xs px-4 py-2 rounded-lg ${
    msg.direction === 'inbound' 
      ? 'bg-gray-700 text-gray-100'
      : 'bg-blue-600 text-white'
  }`}>
    <p className="text-sm">{msg.body}</p>
    <p className="text-xs mt-1 opacity-70">
      {formatTime(msg.created_at)}
    </p>
  </div>
</div>
```

#### Note (Sprint 02)
Messages are **read-only**. No reply box (agregado en Sprint 03).

---

## 3. Component: Conversation Item (Reusable)

**Props**:
```tsx
interface ConversationItemProps {
  conv: Conversation;
  selected?: boolean;
  onClick?: () => void;
}
```

**Used in**: Inbox list

---

## 4. Component: Message Bubble (Reusable)

**Props**:
```tsx
interface MessageBubbleProps {
  message: Message;
}
```

**Used in**: Chat timeline

---

## 5. Navigation Updates

### Sidebar Menu (add)
```
Organization
├─ Dashboard
├─ Settings
├─ Users
├─ Bots
├─ Channels          ← NEW
│  └─ [WhatsApp]
├─ Inbox             ← NEW
└─ Audit Logs
```

### Breadcrumb Updates
- `/org/:orgId/channels` → "Org > Canales WhatsApp"
- `/org/:orgId/inbox` → "Org > Inbox"
- `/org/:orgId/inbox/:convId` → "Org > Inbox > Chat"

---

## 6. Dark Theme Tokens (Sprint 02)

| Component | Color | Code |
|-----------|-------|------|
| Background | Dark Gray | `#111827` (gray-900) |
| Panel | Medium Gray | `#1f2937` (gray-800) |
| Border | Light Gray | `#374151` (gray-700) |
| Text Primary | White | `#f3f4f6` (gray-100) |
| Text Secondary | Light Gray | `#9ca3af` (gray-400) |
| Badge BOT | Blue | `#2563eb` (blue-600) |
| Badge HUMAN | Red | `#dc2626` (red-600) |
| Badge PENDING | Yellow | `#eab308` (yellow-500) |
| Inbound Bubble | Gray | `#374151` (gray-700) |
| Outbound Bubble | Blue | `#2563eb` (blue-600) |

---

## 7. Responsive Design

### Mobile Layout (< 768px)
- Stack: Inbox (full) + Chat (overlay modal)
- Swipe to navigate between chats

### Tablet Layout (768px - 1024px)
- 2-column: list (30%) + chat (70%)

### Desktop Layout (> 1024px)
- 2-column: list (25%) + chat (75%)
- Sidebar navigation visible

---

## 8. Loading States

### Inbox List Loading
```
┌──────────────┐
│ ⏳ Cargando...│
├──────────────┤
│ 🔳 ░░░░░░   │
│ 🔳 ░░░░░░   │
│ 🔳 ░░░░░░   │
└──────────────┘
{skeleton loaders}
```

### Chat Loading
```
┌────────────────┐
│ ⏳ Cargando... │
├────────────────┤
│ 🔳             │
│ 🔳             │
│ 🔳             │
└────────────────┘
{skeleton loaders}
```

---

## 9. Empty States

### No Channels
```
┌────────────────────────┐
│                        │
│   📞 Sin números       │
│                        │
│   Conecta tu primer    │
│   número WhatsApp      │
│                        │
│   [+ Conectar]         │
│                        │
└────────────────────────┘
```

### No Conversations
```
┌────────────────────────┐
│                        │
│   💬 Sin chats         │
│                        │
│   Espera mensajes de   │
│   tu números conectados│
│                        │
└────────────────────────┘
```

### No Selection
```
┌────────────────────────┐
│                        │
│   👈 Selecciona un     │
│      chat               │
│                        │
└────────────────────────┘
```

---

## 10. Error States

### Invalid Token
```
┌────────────────────────────┐
│ ✗ Token inválido           │
│                            │
│ Verifica tu access token   │
│ en Facebook Developers     │
│                            │
│ [Reintentar] [Cancelar]    │
└────────────────────────────┘
```

### Webhook Error (User-facing)
```
Toast (top-right, 5s):
✗ Error al recibir mensaje. Intenta más tarde.
```

---

## 11. Accessibility

- [ ] ARIA labels en buttons
- [ ] Keyboard navigation (Tab, Enter)
- [ ] Contrast ratios ≥ 4.5:1 (dark theme checked)
- [ ] Focus rings visible
- [ ] Mobile: tap targets ≥ 44px

