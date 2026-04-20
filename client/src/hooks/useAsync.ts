import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseAsyncResult<T> {
  data: T | null;
  error: Error | null;
  status: AsyncStatus;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isIdle: boolean;
  refetch: () => Promise<void>;
  setData: (data: T | null) => void;
}

interface UseAsyncOptions {
  /** Automatically run on mount / when deps change. Default: true */
  immediate?: boolean;
  /** Dependencies that should trigger a refetch when changed. */
  deps?: ReadonlyArray<unknown>;
}

/**
 * Generic async-state hook used by the app to standardize loading / error / empty UX.
 *
 * Usage:
 *   const { data, isLoading, isError, refetch } = useAsync(() => fetchThings(id), { deps: [id] });
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  options: UseAsyncOptions = {},
): UseAsyncResult<T> {
  const { immediate = true, deps = [] } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<AsyncStatus>(immediate ? 'loading' : 'idle');

  const mountedRef = useRef(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const result = await fnRef.current();
      if (!mountedRef.current) return;
      setData(result);
      setStatus('success');
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err : new Error(String(err)));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!immediate) return;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    data,
    error,
    status,
    isLoading: status === 'loading',
    isError: status === 'error',
    isSuccess: status === 'success',
    isIdle: status === 'idle',
    refetch: run,
    setData,
  };
}

export default useAsync;
