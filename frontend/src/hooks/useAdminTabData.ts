import { useState, useEffect, useRef, useCallback } from 'react';

// ✅ Кэш на уровне модуля + in-flight запросы для дедупликации
const globalCache = new Map<string, any>();
const inFlight = new Map<string, Promise<any>>();

export function useAdminTabData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  fallback: T
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ✅ Мемоизируем вызов, чтобы ссылка не менялась
  const executeFetch = useCallback(async (controller: AbortController) => {
    // 1. Проверяем кэш
    if (globalCache.has(key)) {
      return globalCache.get(key);
    }

    // 2. Проверяем in-flight запрос (дедупликация)
    if (inFlight.has(key)) {
      return inFlight.get(key);
    }

    // 3. Создаём новый запрос
    const request = fetchFn().then((res) => {
      if (!controller.signal.aborted) {
        globalCache.set(key, res);
        return res;
      }
      throw new DOMException('Aborted', 'AbortError');
    }).finally(() => {
      inFlight.delete(key);
    });

    inFlight.set(key, request);
    return request;
  }, [key, fetchFn]); // fetchFn здесь безопасен, т.к. используется внутри useCallback

  useEffect(() => {
    // Если данные уже есть — не делаем запрос
    if (globalCache.has(key)) {
      setData(globalCache.get(key));
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
          // При ошибке не ломаем форму
          setData(fallback);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    // ✅ Cleanup: отменяем запрос при unmount
    return () => {
      controller.abort();
      abortRef.current = null;
    };
  }, [key, executeFetch]); // ✅ Только key и мемоизированная функция

  return { data: data ?? fallback, isLoading, error };
}