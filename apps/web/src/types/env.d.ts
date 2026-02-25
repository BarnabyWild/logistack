/**
 * Type definitions for environment variables
 */

namespace NodeJS {
  interface ProcessEnv {
    // API Configuration
    NEXT_PUBLIC_API_URL: string;
    NEXT_PUBLIC_WS_URL: string;

    // Mapbox Configuration
    NEXT_PUBLIC_MAPBOX_TOKEN: string;

    // App Configuration
    NEXT_PUBLIC_APP_NAME: string;
    NEXT_PUBLIC_APP_URL: string;

    // Feature Flags
    NEXT_PUBLIC_ENABLE_ANALYTICS: string;
    NEXT_PUBLIC_ENABLE_DEBUG: string;

    // Optional: Sentry
    NEXT_PUBLIC_SENTRY_DSN?: string;
    SENTRY_AUTH_TOKEN?: string;

    // Optional: Google Analytics
    NEXT_PUBLIC_GA_MEASUREMENT_ID?: string;
  }
}
