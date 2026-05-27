import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Space, CategoryId } from '../types';

interface UseStudiosOptions {
  category?: CategoryId;
  search?: string;
  limit?: number;
}

export function useStudios({ category, search, limit = 20 }: UseStudiosOptions = {}) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('spaces')
        .select(`
          id, host_id, name, description, category, area, location,
          price_per_hour, capacity, amenities, images, image_urls,
          is_active, rating, total_reviews, created_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (search && search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setSpaces((data as Space[]) ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load studios');
    } finally {
      setIsLoading(false);
    }
  }, [category, search, limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { spaces, isLoading, error, refetch: fetch };
}

export function useSpace(id: string) {
  const [space, setSpace] = useState<Space | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('spaces')
        .select('*, profiles(full_name, avatar_url)')
        .eq('id', id)
        .single();
      if (fetchError) setError(fetchError.message);
      else setSpace(data as Space);
      setIsLoading(false);
    })();
  }, [id]);

  return { space, isLoading, error };
}
