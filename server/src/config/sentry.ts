import * as Sentry from '@sentry/node';

const toNumberOrDefault = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

export const initSentry = (): void => {
  const dsn = process.env.SENTRY_DSN;

  Sentry.init({
    dsn,
    enabled: Boolean(dsn),
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: toNumberOrDefault(process.env.SENTRY_TRACES_SAMPLE_RATE, 0),
  });
};

export { Sentry };
