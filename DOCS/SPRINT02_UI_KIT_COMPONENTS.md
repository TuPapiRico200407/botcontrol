# SPRINT02_UI_KIT_COMPONENTS.md

## 🎨 UI Components Specification - Sprint 02

### Overview
Sprint 02 agrega **3 nuevos componentes** al UI Kit:
- `ConversationList` - Listado de chats
- `ChatTimeline` - Timeline de mensajes
- `ChannelForm` - Formulario para registrar números WhatsApp

Mantiene todos los 14 componentes de Sprint 01.

---

## 1. Component: ConversationList

### Purpose
Mostrar listado de conversaciones con filtros y selección.

### Props
```typescript
interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  isLoading?: boolean;
  filter?: 'BOT' | 'HUMAN' | 'PENDING' | '';
}

interface Conversation {
  id: string;
  phone_number: string;
  contact_name?: string;
  state: 'BOT' | 'HUMAN' | 'PENDING';
  message_count: number;
  last_message_text?: string;
  last_message_at?: string;
}
```

### States
- **Default**: Renderizar lista
- **Loading**: Skeleton loaders
- **Empty**: EmptyState con icon 💬
- **Selected**: Highlight con bg-gray-700

### Design

```tsx
<div className="flex flex-col h-full bg-gray-900">
  {/* Header con filtro */}
  <div className="p-4 border-b border-gray-700">
    <Select 
      value={filter}
      options={[
        { value: '', label: 'Todos' },
        { value: 'BOT', label: '🤖 Bot' },
        { value: 'HUMAN', label: '👤 Humano' },
        { value: 'PENDING', label: '⏳ Pendiente' }
      ]}
    />
  </div>
  
  {/* List container */}
  <div className="flex-1 overflow-y-auto divide-y divide-gray-700">
    {isLoading ? (
      // Skeleton loaders
      [1, 2, 3].map(i => <ConversationSkeleton key={i} />)
    ) : conversations.length === 0 ? (
      // Empty state
      <EmptyState 
        icon="💬"
        title="Sin chats"
        description="Espera mensajes de tus números"
      />
    ) : (
      // List items
      conversations.map(conv => (
        <ConversationItem 
          key={conv.id}
          conv={conv}
          selected={selectedId === conv.id}
          onClick={() => onSelect?.(conv.id)}
        />
      ))
    )}
  </div>
</div>
```

### SubComponent: ConversationItem

```typescript
interface ConversationItemProps {
  conv: Conversation;
  selected?: boolean;
  onClick?: () => void;
}
```

```tsx
<div
  onClick={onClick}
  className={`p-3 cursor-pointer transition ${
    selected 
      ? 'bg-gray-700 border-l-2 border-blue-600'
      : 'hover:bg-gray-800'
  }`}
>
  <div className="flex justify-between items-start gap-2">
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-sm text-gray-100 truncate">
        {formatPhone(conv.phone_number)}
      </p>
      {conv.contact_name && (
        <p className="text-xs text-gray-400 truncate mt-0.5">
          {conv.contact_name}
        </p>
      )}
      {conv.last_message_text && (
        <p className="text-sm text-gray-300 truncate mt-1">
          {conv.last_message_text}
        </p>
      )}
    </div>
    
    <Badge 
      variant={
        conv.state === 'BOT' ? 'primary' :
        conv.state === 'HUMAN' ? 'destructive' :
        'warning'
      }
      size="sm"
    >
      {conv.state}
    </Badge>
  </div>
  
  <div className="flex justify-between items-center mt-2">
    <p className="text-xs text-gray-500">
      {conv.message_count} mensajes
    </p>
    <p className="text-xs text-gray-500">
      {formatTimeShort(conv.last_message_at)}
    </p>
  </div>
</div>
```

### Skeleton Loader
```tsx
<div className="p-3 space-y-2">
  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
  <div className="h-3 bg-gray-700 rounded w-full"></div>
</div>
```

### Dark Theme Tokens
| Element | Color | Code |
|---------|-------|------|
| Background | Gray-900 | `#111827` |
| Item Hover | Gray-800 | `#1f2937` |
| Selected | Gray-700 | `#374151` |
| Border | Gray-700 | `#374151` |
| Text Primary | Gray-100 | `#f3f4f6` |
| Text Secondary | Gray-400 | `#9ca3af` |
| Badge BOT | Blue | `#2563eb` |
| Badge HUMAN | Red | `#dc2626` |

---

## 2. Component: ChatTimeline

### Purpose
Mostrar timeline de mensajes en una conversación.

### Props
```typescript
interface ChatTimelineProps {
  messages: Message[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  canLoadMore?: boolean;
}

interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  created_at: string;
  type?: 'text' | 'image' | 'audio';
}
```

### States
- **Loading**: Skeleton loaders
- **Empty**: "No hay mensajes"
- **Normal**: Mostrar burbujas
- **End**: Auto-scroll al final

### Design

```tsx
<div className="flex flex-col h-full bg-gray-900">
  {/* Messages container */}
  <div className="flex-1 overflow-y-auto p-4 space-y-3">
    {isLoading ? (
      // Skeletos
      [1, 2, 3].map(i => <MessageSkeleton key={i} />)
    ) : messages.length === 0 ? (
      // Empty
      <div className="h-full flex items-center justify-center text-gray-400">
        <p>No hay mensajes</p>
      </div>
    ) : (
      // Messages
      messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))
    )}
    <div ref={messagesEndRef} />
  </div>
  
  {/* Load more button */}
  {canLoadMore && (
    <div className="px-4 py-2 border-t border-gray-700">
      <Button 
        variant="outline"
        size="sm"
        onClick={onLoadMore}
      >
        Cargar mensajes anteriores
      </Button>
    </div>
  )}
</div>
```

### SubComponent: MessageBubble

```typescript
interface MessageBubbleProps {
  message: Message;
}
```

```tsx
<div
  className={`flex ${
    message.direction === 'inbound' ? 'justify-start' : 'justify-end'
  } animate-fadeIn`}
>
  <div
    className={`max-w-xs px-4 py-2 rounded-lg shadow-sm ${
      message.direction === 'inbound'
        ? 'bg-gray-700 text-gray-100'
        : 'bg-blue-600 text-white'
    }`}
  >
    <p className="text-sm break-words">{message.body}</p>
    <p className={`text-xs mt-1 opacity-70`}>
      {formatTime(message.created_at)}
    </p>
  </div>
</div>
```

### Skeleton Loader
```tsx
<div className="flex justify-start">
  <div className="max-w-xs bg-gray-700 rounded-lg p-4 h-12 w-48 animate-pulse"></div>
</div>
```

### Dark Theme Tokens
| Element | Color | Code |
|---------|-------|------|
| Background | Gray-900 | `#111827` |
| Inbound Bubble | Gray-700 | `#374151` |
| Outbound Bubble | Blue-600 | `#2563eb` |
| Text Light | White | `#ffffff` |
| Text Dark | Gray-100 | `#f3f4f6` |
| Timestamp | Gray | `#9ca3af` |

---

## 3. Component: ChannelForm

### Purpose
Formulario para conectar nuevo número WhatsApp.

### Props
```typescript
interface ChannelFormProps {
  onSubmit?: (data: ChannelFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

interface ChannelFormData {
  phone_number_id: string;
  access_token: string;
}
```

### States
- **Default**: Mostrar inputs
- **Loading**: Spinner, button disabled
- **Success**: Toast + close modal
- **Error**: ErrorMessage rojo
- **Validation**: Red border + hint text

### Design

```tsx
<form onSubmit={handleSubmit} className="space-y-4">
  {/* Intro */}
  <div className="bg-blue-900/20 border border-blue-700 rounded p-3">
    <p className="text-sm text-blue-200">
      📱 Obtén el Phone Number ID y Access Token desde
      {' '}
      <a 
        href="https://developers.facebook.com" 
        target="_blank"
        className="underline hover:text-blue-300"
      >
        Facebook Developers
      </a>
    </p>
  </div>
  
  {/* Error message */}
  {error && (
    <div className="bg-red-900/20 border border-red-700 rounded p-3">
      <p className="text-sm text-red-200">{error}</p>
    </div>
  )}
  
  {/* Phone Number ID field */}
  <FormField>
    <Label htmlFor="phone_number_id" required>
      Phone Number ID
    </Label>
    <Input
      id="phone_number_id"
      type="text"
      placeholder="Phone:123456789"
      {...register('phone_number_id', {
        required: 'Requerido',
        minLength: { value: 5, message: 'Mínimo 5 caracteres' }
      })}
    />
    {errors.phone_number_id && (
      <p className="text-xs text-red-400 mt-1">
        {errors.phone_number_id.message}
      </p>
    )}
  </FormField>
  
  {/* Access Token field */}
  <FormField>
    <Label htmlFor="access_token" required>
      Access Token
    </Label>
    <Input
      id="access_token"
      type="password"
      placeholder="sk_live_..."
      {...register('access_token', {
        required: 'Requerido',
        minLength: { value: 10, message: 'Token muy corto' }
      })}
    />
    <p className="text-xs text-gray-400 mt-1">
      🔒 Se encriptará en la BD. No será visible después.
    </p>
    {errors.access_token && (
      <p className="text-xs text-red-400 mt-1">
        {errors.access_token.message}
      </p>
    )}
  </FormField>
  
  {/* Buttons */}
  <div className="flex gap-2 justify-end pt-4 border-t border-gray-700">
    <Button 
      type="button"
      variant="outline"
      onClick={onCancel}
      disabled={isLoading}
    >
      Cancelar
    </Button>
    <Button 
      type="submit"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" className="mr-2" />
          Validando...
        </>
      ) : (
        'Validar y Conectar'
      )}
    </Button>
  </div>
</form>
```

### Dark Theme Tokens
| Element | Color | Code |
|---------|-------|------|
| Background | Gray-900 | `#111827` |
| Input | Gray-800 | `#1f2937` |
| Input Border | Gray-700 | `#374151` |
| Input Text | Gray-100 | `#f3f4f6` |
| Label | Gray-100 | `#f3f4f6` |
| Hint Text | Gray-400 | `#9ca3af` |
| Error | Red | `#ef4444` |
| Info Box | Blue-900 | `#1e3a8a` |

---

## Integration Points

### In Web App

#### ChannelsPage.tsx
```tsx
import { ChannelForm } from '@botcontrol/ui';

<Modal open={showForm} onClose={closeForm}>
  <ChannelForm
    onSubmit={handleConnect}
    onCancel={closeForm}
    isLoading={connecting}
    error={error}
  />
</Modal>
```

#### InboxPage.tsx
```tsx
import { ConversationList, ChatTimeline } from '@botcontrol/ui';

<div className="flex h-screen gap-4">
  <ConversationList
    conversations={conversations}
    selectedId={selected?.id}
    onSelect={setSelected}
    filter={stateFilter}
  />
  
  {selected && (
    <ChatTimeline
      messages={messages}
      isLoading={loadingMessages}
    />
  )}
</div>
```

---

## File Structure

```
packages/ui/src/
├─ index.ts                    (export)
├─ Badge.tsx                   (existing)
├─ Button.tsx                  (existing)
├─ ...
├─ ConversationList.tsx        (NEW)
├─ ChatTimeline.tsx            (NEW)
├─ ChannelForm.tsx             (NEW)
└─ types/                       (NEW)
   └─ whatsapp.ts
```

---

## Utilities

### formatPhone
```typescript
function formatPhone(phone: string): string {
  // +1234567890 → +1 (234) 567-8900
  const cleaned = phone.replace(/\D/g, '');
  return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
}
```

### formatTime
```typescript
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}
```

### formatTimeShort
```typescript
function formatTimeShort(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  if (isSameDay(date, now)) {
    return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  } else if (isYesterday(date)) {
    return 'Ayer';
  } else {
    return date.toLocaleDateString('es', { month: 'short', day: 'numeric' });
  }
}
```

---

## Animations

### fadeIn
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}
```

---

## TypeScript Types

### packages/ui/src/types/whatsapp.ts
```typescript
export interface Conversation {
  id: string;
  phone_number: string;
  contact_name?: string;
  state: 'BOT' | 'HUMAN' | 'PENDING';
  message_count: number;
  last_message_text?: string;
  last_message_at?: string;
}

export interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  created_at: string;
  type?: 'text' | 'image' | 'audio';
}

export interface Channel {
  id: string;
  phone_number: string;
  phone_number_id: string;
  verified_at?: string;
  is_active: boolean;
}
```

