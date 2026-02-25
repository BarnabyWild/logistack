# Logistack Web Frontend

Modern logistics management platform built with Next.js 14, React 18, and TypeScript.

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.4
- **Styling:** Tailwind CSS 3.4
- **State Management:**
  - TanStack Query (React Query) for server state
  - Zustand for client state
- **Forms:** React Hook Form + Zod validation
- **UI Components:** Radix UI + Shadcn/ui
- **Maps:** Mapbox GL JS / React Map GL
- **HTTP Client:** Axios
- **Package Manager:** pnpm

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages (login, register)
│   ├── dashboard/         # Dashboard pages
│   ├── loads/             # Load management pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components (buttons, inputs, etc.)
│   ├── features/         # Feature-specific components
│   └── layouts/          # Layout components
├── lib/                  # Utility libraries
│   ├── api/             # API client and endpoints
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Helper functions
│   ├── store/           # Zustand stores
│   └── validations/     # Zod schemas
├── types/               # TypeScript type definitions
└── styles/              # Global styles
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your configuration:
   - `NEXT_PUBLIC_API_URL`: Backend API URL
   - `NEXT_PUBLIC_MAPBOX_TOKEN`: Mapbox access token

### Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building

Create a production build:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

## 📝 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Create production build
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking
- `pnpm format` - Format code with Prettier

## 🎨 Styling

This project uses Tailwind CSS with a custom design system based on CSS variables. The color scheme supports both light and dark modes.

### Using Components

Components from Shadcn/ui are pre-configured with Radix UI primitives:

```tsx
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

export default function MyComponent() {
  return (
    <Button variant="primary">
      Click me
    </Button>
  );
}
```

## 🗺️ Maps Integration

Mapbox GL JS is configured for route visualization and tracking:

```tsx
import Map from 'react-map-gl';

export default function MapComponent() {
  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        longitude: -100,
        latitude: 40,
        zoom: 3.5
      }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
    />
  );
}
```

## 🔐 Authentication

Authentication is handled via JWT tokens:

- Access tokens stored in memory
- Refresh tokens stored in httpOnly cookies
- Automatic token refresh via API interceptors

## 📡 API Integration

API calls are managed through Axios with TanStack Query:

```tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export function useLoads() {
  return useQuery({
    queryKey: ['loads'],
    queryFn: () => api.get('/loads'),
  });
}
```

## 🧪 Type Safety

This project enforces strict TypeScript for maximum type safety:

- Shared types with backend via `@logistack/shared` package
- Zod schemas for runtime validation
- Strongly typed API responses

## 🚢 Deployment

### Vercel (Recommended)

This app is optimized for deployment on Vercel:

1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Docker

Build and run with Docker:

```bash
docker build -t logistack-web .
docker run -p 3000:3000 logistack-web
```

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Radix UI](https://www.radix-ui.com/)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/guides/)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

Proprietary - Logistack Platform
