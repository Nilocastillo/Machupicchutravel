import { defaultLocale, localizedLocales, locales, tourPath, type Locale } from './site';

const strapiUrl = import.meta.env.STRAPI_URL || 'http://127.0.0.1:1337';
const token = import.meta.env.STRAPI_READ_TOKEN;
const published = { status: 'published' };

interface Media {
  url: string;
  width?: number;
  height?: number;
  alternativeText?: string | null;
  formats?: Record<string, Pick<Media, 'url' | 'width' | 'height'>> | null;
}

export interface Block {
  type: string;
  text?: string;
  children?: Block[];
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  url?: string;
  level?: number;
  format?: string;
  image?: Media;
}

interface Section {
  id: number;
  titulo: string;
  contenido: Block[];
}

type Price = number | string | null;

export interface Tour {
  documentId: string;
  locale: Locale;
  titulo: string;
  tituloCorto?: string | null;
  slug: string;
  imagen?: Media | null;
  descripcion?: Block[] | null;
  resumen?: Section[];
  itinerario?: Section[];
  incluye?: Block[] | null;
  noIncluye?: Block[] | null;
  seo?: { metaTitulo?: string | null; metaDescripcion?: string | null; metaImagen?: Media | null } | null;
  precios?: {
    tarifario?: {
      categorias?: { id: number; estrellas?: string | null; hoteles?: Block[] | null; precioSimple?: Price; precioDoble?: Price; precioTriple?: Price }[];
      trenes?: { id: number; tren: Block[]; costo: Price }[];
    } | null;
  } | null;
}

export interface TourInformation {
  datosLlegada?: Block[] | null;
  requisitosReserva?: Block[] | null;
  reservasConsultas?: { email: string; movil: string; enlaceMovil?: string | null }[];
}

async function readStrapi<T>(endpoint: string, locale: Locale, query: Record<string, string>) {
  const url = new URL(`${strapiUrl.replace(/\/$/, '')}/api/${endpoint}`);
  url.search = new URLSearchParams({ ...published, locale, ...query }).toString();
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Strapi /api/${endpoint} (${locale}): HTTP ${response.status}`);
  return response.json() as Promise<{ data: T; meta?: { pagination?: { pageCount: number } } }>;
}

const tourFields = {
  'populate[imagen]': 'true',
  'populate[resumen]': 'true',
  'populate[itinerario]': 'true',
  'populate[seo][populate][metaImagen]': 'true',
  'populate[precios][populate][tarifario][populate][categorias]': 'true',
  'populate[precios][populate][tarifario][populate][trenes]': 'true',
  'pagination[pageSize]': '50',
  'sort[0]': 'titulo:asc',
  'sort[1]': 'documentId:asc',
};

const catalog = new Map<Locale, ReturnType<typeof fetchTours>>();
const information = new Map<Locale, Promise<TourInformation | null>>();

async function fetchTours(locale: Locale) {
  try {
    const tours: Tour[] = [];
    let pageCount = 1;
    for (let page = 1; page <= pageCount; page++) {
      const result = await readStrapi<Tour[]>('tours', locale, {
        ...tourFields,
        'pagination[page]': String(page),
      });
      tours.push(...result.data);
      pageCount = result.meta?.pagination?.pageCount ?? 1;
    }
    return { tours, unavailable: false };
  } catch (error) {
    if (import.meta.env.STRAPI_REQUIRED === '1') {
      throw new Error(`No se pudo cargar el catálogo de Strapi (${locale}).`, { cause: error });
    }
    console.warn(`No se pudo cargar el catálogo de Strapi (${locale}).`, error);
    return { tours: [], unavailable: true };
  }
}

export function getTours(locale: Locale) {
  const cached = catalog.get(locale);
  if (cached) return cached;
  const result = fetchTours(locale);
  if (import.meta.env.PROD) catalog.set(locale, result);
  return result;
}

function getTourInformation(locale: Locale) {
  const cached = information.get(locale);
  if (cached) return cached;

  const result = readStrapi<TourInformation | null>('informacion-tour', locale, {
    'populate[reservasConsultas]': 'true',
  }).then(({ data }) => data).catch((error) => {
    console.warn(`No se pudo cargar la información general de tours (${locale}).`, error);
    return null;
  });
  if (import.meta.env.PROD) information.set(locale, result);
  return result;
}

export function safeUrl(value?: string | null, kind: 'link' | 'image' = 'link') {
  const raw = value?.trim();
  if (!raw) return undefined;
  try {
    const url = new URL(raw, kind === 'image' ? strapiUrl : 'https://example.invalid/');
    const protocols = kind === 'image' ? ['https:', 'http:'] : ['https:', 'http:', 'mailto:', 'tel:', 'sms:'];
    if (!protocols.includes(url.protocol)) return undefined;
    return kind !== 'image' && url.origin === 'https://example.invalid' ? raw : url.href;
  } catch {
    return undefined;
  }
}

export function mediaUrls(image?: Media | null) {
  const src = safeUrl(image?.url, 'image');
  if (!src) return undefined;

  const variants = new Map<number, string>();
  for (const format of [...Object.values(image?.formats ?? {}), image]) {
    const url = safeUrl(format?.url, 'image');
    if (url && format?.width) variants.set(format.width, url);
  }

  return {
    src,
    width: image?.width,
    height: image?.height,
    alt: image?.alternativeText,
    srcset: variants.size > 1
      ? [...variants].sort(([a], [b]) => a - b).map(([width, url]) => `${url} ${width}w`).join(', ')
      : undefined,
  };
}

export function hasContent(blocks?: Block[] | null): boolean {
  return blocks?.some((block) => Boolean(
    block.text?.trim() || (block.type === 'image' && safeUrl(block.image?.url, 'image')) || hasContent(block.children),
  )) ?? false;
}

export function blockText(blocks?: Block[] | null): string {
  return (blocks ?? []).map((block) => block.text ?? blockText(block.children)).join(' ').replace(/\s+/g, ' ').trim();
}

export function tourTitle(tour: Tour) {
  return tour.tituloCorto?.trim() || tour.titulo;
}

async function detailRoutes(targets: Locale[]) {
  const catalogs = new Map(await Promise.all(locales.map(async (locale) =>
    [locale, (await getTours(locale)).tours] as const,
  )));
  const all = [...catalogs.values()].flat();
  const translations = new Map<string, Partial<Record<Locale, string>>>();

  for (const tour of all) {
    const paths = translations.get(tour.documentId) ?? {};
    paths[tour.locale] = tourPath(tour.locale, tour.slug);
    translations.set(tour.documentId, paths);
  }

  const general = new Map(await Promise.all(targets.map(async (locale) =>
    [locale, await getTourInformation(locale)] as const,
  )));

  return all.filter(({ locale }) => targets.includes(locale)).map((tour) => ({
    tour,
    catalog: catalogs.get(tour.locale) ?? [],
    alternatives: translations.get(tour.documentId) ?? {},
    information: general.get(tour.locale) ?? null,
  }));
}

export async function defaultTourPaths() {
  return (await detailRoutes([defaultLocale])).map((props) => ({
    params: { slug: props.tour.slug },
    props,
  }));
}

export async function localizedTourPaths() {
  return (await detailRoutes(localizedLocales)).map((props) => ({
    params: { locale: props.tour.locale, slug: props.tour.slug },
    props,
  }));
}
