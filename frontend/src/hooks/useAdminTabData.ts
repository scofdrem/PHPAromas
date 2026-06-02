import { useState, useEffect, useRef, useCallback } from 'react';

// ✅ Глобальный кэш + in-flight дедупликация (переживают unmount)
const globalCache = new Map<string, any>();
const inFlight = new Map<string, Promise<any>>();

export interface UseAdminTabDataResult<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  invalidateCache: () => void;
}

export function useAdminTabData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  fallback: T
): UseAdminTabDataResult<T> {
  const [data, setData] = useState<T>(fallback);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  
  // ✅ FIX: fetchFn в ref — не триггерит перерендер при смене ссылки
  const fetchFnRef = useRef(fetchFn);
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  // ✅ FIX: Только [key] в зависимостях — стабильно!
  const executeFetch = useCallback(async (controller: AbortController): Promise<T> => {
    // 1. Кэш-хит → мгновенный возврат
    if (globalCache.has(key)) {
      return globalCache.get(key);
    }

    // 2. In-flight запрос → ждём существующий (дедупликация)
    if (inFlight.has(key)) {
      return inFlight.get(key)!;
    }

    // 3. Новый запрос
    const request = fetchFnRef.current()
      .then((res) => {
        if (!controller.signal.aborted) {
          globalCache.set(key, res);
          return res;
        }
        throw new DOMException('Aborted', 'AbortError');
      })
      .finally(() => {
        inFlight.delete(key);
      });

    inFlight.set(key, request);
    return request;
  }, [key]); // ✅ ТОЛЬКО key — никаких fetchFn/fallback!

  useEffect(() => {
    // Если данные уже в кэше → не делаем запрос
    if (globalCache.has(key)) {
      setData(globalCache.get(key));
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    setError(null);

    executeFetch(controller)
      .then((res) => {
        if (!controller.signal.aborted) {
          setData(res);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted && err.name !== 'AbortError') {
          setError(err.message || 'Failed to load data');
          setData(fallback); // При ошибке не ломаем форму
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
      abortRef.current = null;
    };
  }, [executeFetch]); // ✅ executeFetch стабилен благодаря [key]

  // ✅ Инвалидация кэша
  const invalidateCache = useCallback(() => {
    globalCache.delete(key);
    inFlight.delete(key);
  }, [key]);

  // ✅ Принудительный refetch
  const refetch = useCallback(async () => {
    globalCache.delete(key);
    inFlight.delete(key);
    setIsLoading(true);
    setError(null);
    
    const controller = new AbortController();
    try {
      const res = await executeFetch(controller);
      if (!controller.signal.aborted) {
        setData(res);
      }
    } catch (err: any) {
      if (!controller.signal.aborted) {
        setError(err.message || 'Failed to refresh');
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [executeFetch]);

  return { 
    data, // ✅ Всегда T, никогда null/undefined
    isLoading, 
    error, 
    refetch, 
    invalidateCache 
  };
}