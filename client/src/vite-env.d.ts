/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Canonical API origin used by both HTTP and Socket.IO clients. */
    readonly VITE_API_BASE_URL?: string;
    /** Google OAuth client id used by the login page. */
    readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
