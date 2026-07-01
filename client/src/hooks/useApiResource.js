import { useEffect, useState } from 'react';

export default function useApiResource(loadResource, dependencies = []) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        await loadResource();
      } catch (resourceError) {
        if (alive) {
          setError(resourceError.message || 'Unable to load data');
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, dependencies);

  return { loading, error };
}
