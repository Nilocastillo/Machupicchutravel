import type { APIRoute } from 'astro';
import { localUploadPaths } from '../../lib/strapi';

export const getStaticPaths = localUploadPaths;

export const GET: APIRoute<{ source: string }> = async ({ params, props }) => {
  const response = await fetch(props.source, {
    redirect: 'error',
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`No se pudo copiar ${params.filename} desde Strapi: HTTP ${response.status}`);
  }
  return new Response(response.body);
};
