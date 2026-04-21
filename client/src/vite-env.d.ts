/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Canonical API origin used by both HTTP and Socket.IO clients. */
    readonly VITE_API_BASE_URL?: string;
    /** @deprecated Use `VITE_API_BASE_URL`. Kept for backward compatibility. */
    readonly VITE_SERVER_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
