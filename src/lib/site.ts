import type { ImageMetadata } from 'astro';
import site from '../data/site.json';

export type Locale = keyof typeof site.copy;
export const defaultLocale = 'en';
export const locales = Object.keys(site.copy) as Locale[];
export const localizedLocales = locales.filter((locale) => locale !== defaultLocale);

export function homePath(locale: Locale) {
  return locale === defaultLocale ? '/' : `/${locale}/`;
}

export function tourPath(locale: Locale, slug: string) {
  return `${homePath(locale)}tours/${encodeURIComponent(slug)}/`;
}

const photos = import.meta.glob<ImageMetadata>('../assets/travel/*.webp', {
  eager: true,
  import: 'default',
});

export function travelImage(name: string) {
  return photos[`../assets/travel/${name}.webp`];
}

export const featured = new Map(site.featuredTours.map((tour) => [tour.documentId, tour]));
export const youtubeVideo = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const youtubeChannel = site.socials.find(({ label }) => label === 'YouTube')!.url;

export const externalLink = { target: '_blank', rel: 'noopener noreferrer' } as const;

export function externalLinkAttributes(href: string) {
  return /^(?:https?:)?\/\//i.test(href) ? externalLink : {};
}
