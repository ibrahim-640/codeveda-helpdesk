import { useCallback, useEffect, useState } from "react";
import { api } from "../api";

// GETs `path` and reports { data, loading, error }.
// reload() fetches again; mutate(fn) changes the loaded data in place.
export function useApi(path) {
  const [result, setResult] = useState({ path: null, data: null, error: null });
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    let cancelled = false; // ignore answers from outdated requests
    api(path)
      .then((data) => {
        if (!cancelled) setResult({ path, data, error: null });
      })
      .catch((error) => {
        if (!cancelled) setResult({ path, data: null, error });
      });
    return () => {
      cancelled = true;
    };
  }, [path, reloads]);

  const reload = useCallback(() => setReloads((n) => n + 1), []);
  const mutate = useCallback(
    (update) =>
      setResult((r) => (r.path === path ? { ...r, data: update(r.data) } : r)),
    [path]
  );

  // "Loading" means the stored result belongs to a different path
  const current = result.path === path;
  return {
    data: current ? result.data : null,
    error: current ? result.error : null,
    loading: !current,
    reload,
    mutate,
  };
}