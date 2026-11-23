import site from '../data/site.json';

const videoLimit = 3;
const entities: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

interface RecommendationVideo {
  id: string;
  title: string;
  image?: string;
}

function decodeTitle(title: string) {
  return title.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, name: string) => {
    if (!name.startsWith('#')) return entities[name] ?? entity;
    const hexadecimal = name[1].toLowerCase() === 'x';
    const codePoint = Number.parseInt(name.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
    return codePoint > 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
  });
}

async function fetchRecommendations(): Promise<RecommendationVideo[]> {
  const videos = new Map<string, RecommendationVideo>();
  try {
    const url = new URL('https://www.youtube.com/feeds/videos.xml');
    url.searchParams.set('channel_id', site.youtubeChannelId);
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const xml = await response.text();
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].flatMap(([, entry]) => {
      const id = entry.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
      const title = entry.match(/<title>([^<]+)<\/title>/)?.[1].trim();
      const published = Date.parse(entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? '');

      return id && title && Number.isFinite(published) ? [{ id, title: decodeTitle(title), published }] : [];
    });

    for (const { id, title } of entries.sort((a, b) => b.published - a.published)) {
      if (!videos.has(id)) videos.set(id, { id, title });
      if (videos.size === videoLimit) return [...videos.values()];
    }
  } catch (error) {
    console.warn('No se pudo consultar el RSS de YouTube. Se mostrarán los videos de respaldo.', error);
  }

  for (const video of site.testimonials) {
    if (!videos.has(video.id)) videos.set(video.id, video);
    if (videos.size === videoLimit) break;
  }

  return [...videos.values()];
}

let buildRecommendations: Promise<RecommendationVideo[]> | undefined;

export function getRecommendationVideos() {
  if (import.meta.env.PROD) return buildRecommendations ??= fetchRecommendations();
  return fetchRecommendations();
}
