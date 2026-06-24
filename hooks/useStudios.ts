import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Space, CategoryId } from '../types';

interface UseStudiosOptions {
  category?: CategoryId;
  search?: string;
  limit?: number;
}

// The shared DB columns are title/area/max_guests/review_count/cover_image/
// status — NOT name/location/capacity/total_reviews/is_active. Alias them to the
// Space shape the screens expect; images is jsonb [{url}] so it's normalized to
// a string[] (cover first).
const SELECT_COLS =
  'id, host_id, name:title, slug, description, category, area, price_per_hour, day_rate, capacity:max_guests, amenities, images, cover_image, status, rating, total_reviews:review_count, created_at';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeSpace(row: any): Space {
  const imgs: string[] = [];
  if (row.cover_image) imgs.push(row.cover_image);
  if (Array.isArray(row.images)) {
    for (const im of row.images) {
      const url = typeof im === 'string' ? im : im?.url;
      if (url && !imgs.includes(url)) imgs.push(url);
    }
  }
  return {
    ...row,
    location: row.location ?? row.area ?? null,
    images: imgs,
    image_urls: imgs,
    is_active: row.status === 'active',
  } as Space;
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
        .select(SELECT_COLS)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (search && search.trim()) {
        query = query.or(`title.ilike.%${search.trim()}%,area.ilike.%${search.trim()}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setSpaces(((data as unknown as Record<string, unknown>[]) ?? []).map(normalizeSpace));
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
        .select(`${SELECT_COLS}, profiles:profiles!host_id(full_name, avatar_url)`)
        .eq('id', id)
        .single();
      if (fetchError) setError(fetchError.message);
      else setSpace(normalizeSpace(data));
      setIsLoading(false);
    })();
  }, [id]);

  return { space, isLoading, error };
}
