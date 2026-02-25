# @logistack/ui

Reusable React UI components library with Tailwind CSS and Shadcn/ui for Logistack.

## Overview

This package provides a collection of accessible, customizable React components built with:
- **React 18**: Modern React with hooks and TypeScript support
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Unstyled, accessible component primitives
- **class-variance-authority**: For component variant management
- **Lucide React**: Beautiful icon library

## Installation

This package is part of the Logistack monorepo and is installed automatically when you install the workspace dependencies.

```bash
npm install
```

## Usage

Import components from the package:

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Label } from '@logistack/ui'

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
          <Button>Sign In</Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

## Available Components

### Button
A versatile button component with multiple variants and sizes.

**Variants**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
**Sizes**: `default`, `sm`, `lg`, `icon`

```tsx
<Button variant="default" size="lg">Click me</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost" size="icon">
  <Icon />
</Button>
```

### Input
A styled input field component.

```tsx
<Input type="email" placeholder="Enter email" />
<Input type="password" placeholder="Enter password" />
```

### Label
An accessible label component built on Radix UI.

```tsx
<Label htmlFor="username">Username</Label>
<Input id="username" />
```

### Card
A flexible card container with header, content, and footer sections.

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    Main content
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>
```

## Utilities

### cn()
A utility function for merging Tailwind CSS classes with clsx.

```tsx
import { cn } from '@logistack/ui'

const className = cn(
  "base-class",
  condition && "conditional-class",
  "another-class"
)
```

## Theme Configuration

The components use CSS variables for theming. Define these variables in your application:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}
```

## TypeScript

This package is fully typed with TypeScript. All components export their prop types for easy integration:

```tsx
import type { ButtonProps, InputProps } from '@logistack/ui'
```

## Development

### Type Checking

```bash
npm run typecheck
```

### Adding New Components

1. Create a new component file in `src/components/`
2. Export the component from `src/index.ts`
3. Add proper TypeScript types
4. Follow the existing component patterns

## Dependencies

### Core Dependencies
- `react`, `react-dom`: React framework
- `class-variance-authority`: Variant management
- `clsx`, `tailwind-merge`: Class name utilities
- `lucide-react`: Icons
- `@radix-ui/*`: Accessible component primitives

### Dev Dependencies
- `typescript`: Type checking
- `tailwindcss`: Styling framework
- `tailwindcss-animate`: Animation utilities
- `autoprefixer`, `postcss`: CSS processing

## License

Private package - part of Logistack monorepo.
