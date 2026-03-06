# UI Kit

The `packages/ui` package contains all the shared, strictly-enforced user interface components for this project.

## Rules of Usage
1. **Never write raw HTML/CSS per screen.** Always compose screens using the building blocks provided here.
2. We use Tailwind CSS under the hood inside `packages/ui`, heavily relying on composition and strict class mapping.
3. Every component should be exported cleanly from `packages/ui` index.

## Components List
- **Button**: Actions, form submits, modal triggers.
- **Input/Textarea**: For generic user entry.
- **Select**: Drop-downs and option select.
- **Modal/Dialog**: Overlay elements.
- **DataTable**: Tabular display with strict properties (e.g. simple pagination logic).
- **EmptyState**: Standardized visual placeholders when data is empty.
- **Badge**: Tiny labels indicating status (e.g. Roles, Active).
- **Tabs**: View switching inside the same screen context.
- **Toast/Notifications**: Ephemeral feedback.
- **Loader/Spinner**: Pending operations.

## Basic Usage

```tsx
import { Button, Input } from '@botcontrol/ui';

export function ExampleForm() {
  return (
    <form>
      <Input label="Email address" name="email" type="email" />
      <Button variant="primary">Submit</Button>
    </form>
  );
}
```
