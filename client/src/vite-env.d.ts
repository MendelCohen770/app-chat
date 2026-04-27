/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Canonical API origin used by both HTTP and Socket.IO clients. */
    readonly VITE_API_BASE_URL?: string;
    /** Google OAuth client id used by the login page. */
    readonly VITE_GOOGLE_CLIENT_ID?: string;
    /** Sentry DSN for client-side error monitoring. */
    readonly VITE_SENTRY_DSN?: string;
    /** Sampling ratio for sending client traces to Sentry. */
    readonly VITE_SENTRY_TRACES_SAMPLE_RATE?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
