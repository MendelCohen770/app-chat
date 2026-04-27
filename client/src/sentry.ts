import * as Sentry from "@sentry/react";

const toNumberOrDefault = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

export const initSentry = (): void => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  Sentry.init({
    dsn,
    enabled: Boolean(dsn),
    environment: import.meta.env.MODE,
    tracesSampleRate: toNumberOrDefault(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE, 0),
  });
};
