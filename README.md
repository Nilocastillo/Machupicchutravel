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

## Despliegue en Cloudflare Workers

El Worker `machupicchu-travel` sirve los archivos estáticos de `dist/`. Astro consulta Strapi durante el build. Si el catálogo de algún idioma falla, `bun run build:workers` detiene el despliegue para conservar las fichas publicadas.

| Variable de compilación | Valor |
| --- | --- |
| `STRAPI_URL` | URL de Strapi accesible desde la máquina que ejecuta el build. Para Workers Builds, usa la URL HTTPS de tu instancia publicada. |
| `STRAPI_READ_TOKEN` | Secreto de compilación si la API requiere autenticación. Dale acceso de lectura a Tours, Tarifarios e Información general de tours. |
| `SITE_URL` | URL HTTPS pública del frontend, en el dominio final o en `machupicchu-travel.<tu-subdominio>.workers.dev`. |

### Desde tu máquina

Con Node.js 22.23.4 o posterior y Bun, instala las dependencias. Define las variables en tu entorno o copia `.env.example` a `.env` y completa los valores. Para probar el resultado con el runtime de Workers, ejecuta `bun run build:workers` y luego `bun run preview:workers`.

```sh
bun install --frozen-lockfile
bun run wrangler login
bun run deploy
```

### Desde Git con Workers Builds

Importa el repositorio en **Workers & Pages** y configura el proyecto con estos valores.

| Opción | Valor |
| --- | --- |
| Worker name | `machupicchu-travel` |
| Production branch | `main` |
| Root directory | `/` |
| Build command | `bun run build:workers` |
| Deploy command | `bun run wrangler deploy` |

Agrega las variables en **Settings → Build → Build variables and secrets**. Guarda `STRAPI_READ_TOKEN` como secreto si tu instancia lo requiere. [Configuración de Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)

Para usar un dominio propio, añade `"routes": [{ "pattern": "tu-dominio.com", "custom_domain": true }]` en `wrangler.jsonc`, actualiza `SITE_URL` y despliega de nuevo. Cloudflare debe gestionar la zona del dominio. [Dominios personalizados en Workers](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

Para regenerar el HTML al publicar contenido o actualizar tarifas, puedes crear un Deploy Hook de la rama `main` en **Settings → Builds → Deploy Hooks** y usar su URL como destino del webhook de Strapi. [Deploy Hooks de Workers](https://developers.cloudflare.com/workers/ci-cd/builds/deploy-hooks/)
