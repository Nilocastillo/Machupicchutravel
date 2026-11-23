# Machu Picchu Travel

Frontend en Astro y Tailwind CSS. El inglés se sirve en `/`, el español en `/es/` y el portugués en `/pt/`. Las fichas de tours usan el slug de Strapi en el idioma de la página.

## Desarrollo local

Inicia Strapi desde el directorio `backend`.

```sh
npm run develop
```

Desde `frontend`, instala las dependencias e inicia Astro.

```sh
bun install
bun run dev --background
```

Astro consulta por defecto `http://127.0.0.1:1337`. Si usas otra instancia, copia `.env.example` a `.env` y configura `STRAPI_URL`. Si la instancia requiere autenticación, configura `STRAPI_READ_TOKEN` con acceso de lectura a Tours, Tarifarios e Información general de tours. El token se utiliza durante el renderizado de Astro.

## Contenido y compilación

- Tours, tarifas e información de las fichas se leen de Strapi con `status=published` y el idioma explícito. Los textos de la portada, contacto global, videos, enlaces y orden de destacados se editan en `src/data/site.json`.
- Las fotos locales de la web anterior respaldan a los destacados sin portada en Strapi. Si se carga una portada en Strapi, tiene prioridad.
- La portada toma los tres videos más recientes del RSS de YouTube al compilarse. El canal se configura con `youtubeChannelId` en `src/data/site.json`. Los tres videos de `testimonials` sirven de respaldo si el RSS no está disponible.
- Configura `SITE_URL` con el dominio público para generar enlaces canónicos y alternativos por idioma. En producción, `STRAPI_URL` debe apuntar a una instancia con medios accesibles para el visitante, o a una instancia que devuelva URLs públicas para esos medios.
- Ejecuta `bun run astro check` para validar tipos y `bun run build` para generar `dist/` con Strapi disponible. Regenera el sitio al publicar tours o cambiar precios. Si Strapi está fuera de servicio, Astro registra la incidencia y la portada muestra un aviso donde iría el catálogo.
# Machupicchutravel
