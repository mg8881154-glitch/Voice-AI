/**
 * GET /api/fetch-image?q=dog
 *
 * Server-side image search. Three providers tried in order:
 *  1. Official Unsplash API  (requires NEXT_UNSPLASH_ACCESS_KEY — best quality)
 *  2. Unsplash Source CDN    (free, no key, direct CDN URL — default)
 *  3. Picsum Photos          (always works, generic placeholder)
 *
 * In-memory cache, max 200 entries, no TTL (fresh on server restart).
 */

import { NextRequest, NextResponse } from 'next/server';

export interface FetchImageResult {
  imageUrl:    string;
  thumbUrl:    string;
  title:       string;
  description: string;
  credit:      string;
  creditUrl:   string;
  query:       string;
}

const cache = new Map<string, FetchImageResult>();

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('q') ?? '';

  if (!rawQuery.trim()) {
    return NextResponse.json({ error: 'q parameter is required' }, { status: 400 });
  }

  const query    = rawQuery.trim().slice(0, 100);
  const cacheKey = query.toLowerCase();

  if (cache.has(cacheKey)) {
    return NextResponse.json(cache.get(cacheKey));
  }

  let result: FetchImageResult | null = null;

  // ── 1. Official Unsplash API (richest, requires key) ──────────────────────
  const unsplashKey = process.env.NEXT_UNSPLASH_ACCESS_KEY;
  if (unsplashKey && !result) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${unsplashKey}` } },
      );
      if (res.ok) {
        type UnsplashPhoto = {
          urls: { regular: string; thumb: string };
          alt_description?: string;
          description?: string;
          user: { name: string; links: { html: string } };
        };
        const data = (await res.json()) as { results: UnsplashPhoto[] };
        const photo = data.results[0];
        if (photo) {
          result = {
            imageUrl:    photo.urls.regular,
            thumbUrl:    photo.urls.thumb,
            title:       titleCase(photo.alt_description ?? query),
            description: photo.description ?? `Photo of ${query}`,
            credit:      photo.user.name,
            creditUrl:   `${photo.user.links.html}?utm_source=echosphere&utm_medium=referral`,
            query,
          };
        }
      }
    } catch { /* fall through */ }
  }

  // ── 2. Unsplash Source CDN (free, no key) ─────────────────────────────────
  // Uses a stable CDN URL pattern — does NOT redirect, returns image directly.
  if (!result) {
    try {
      // Build a deterministic but varied URL using the query as the path keyword.
      // Unsplash Source: https://source.unsplash.com/featured/800x450?{keyword}
      const keyword = encodeURIComponent(query);
      const imageUrl = `https://source.unsplash.com/featured/800x450?${keyword}`;
      const thumbUrl = `https://source.unsplash.com/featured/80x45?${keyword}`;

      // Verify the URL resolves (HEAD request)
      const probe = await fetch(imageUrl, { method: 'HEAD', redirect: 'follow' });
      if (probe.ok) {
        result = {
          imageUrl,
          thumbUrl,
          title:       titleCase(query),
          description: `Photo of ${query}`,
          credit:      'Unsplash',
          creditUrl:   `https://unsplash.com/s/photos/${encodeURIComponent(query)}?utm_source=echosphere&utm_medium=referral`,
          query,
        };
      }
    } catch { /* fall through */ }
  }

  // ── 3. Picsum fallback (always works) ─────────────────────────────────────
  if (!result) {
    const seed = query.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 1000;
    result = {
      imageUrl:    `https://picsum.photos/seed/${seed}/800/450`,
      thumbUrl:    `https://picsum.photos/seed/${seed}/80/45`,
      title:       titleCase(query),
      description: `Image of ${query}`,
      credit:      'Picsum Photos',
      creditUrl:   'https://picsum.photos',
      query,
    };
  }

  // Store in cache (evict oldest entry when full)
  if (cache.size >= 200) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(cacheKey, result);

  return NextResponse.json(result);
}
