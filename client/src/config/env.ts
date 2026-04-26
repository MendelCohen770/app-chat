/**
 * Single source of truth for client-side environment configuration.
 *
 * All client code should read the API origin from here instead of
 * `import.meta.env` directly so configuration stays consistent across HTTP
 * and Socket.IO calls.
 */

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

const readEnv = (key: string): string | undefined => {
    const value = (import.meta.env as Record<string, string | undefined>)[key];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
};

const rawBaseUrl = readEnv('VITE_API_BASE_URL') ?? DEFAULT_API_BASE_URL;

// Strip a single trailing slash so callers can safely do `${API_BASE_URL}/path`.
export const API_BASE_URL: string = rawBaseUrl.replace(/\/+$/, '');

/**
 * Build a full URL for media paths returned by the server. Absolute URLs
 * (http/https/data/blob) are returned as-is; relative paths are prefixed
 * with the API origin so they can be loaded by the browser.
 */
export const resolveMediaUrl = (url?: string | null): string => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
        return url;
    }
    const normalized = url.startsWith('/') ? url : `/${url}`;
    return `${API_BASE_URL}${normalized}`;
};
