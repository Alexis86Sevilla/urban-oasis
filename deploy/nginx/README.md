# Configuración de nginx (copia de referencia)

Estos archivos son una **copia de lo que corre en la VPS**, no algo que se despliegue
automáticamente. El workflow de despliegue solo sube la JAR y los estáticos; nginx se
configura a mano en el servidor.

Se versionan aquí para que la configuración no exista en un único sitio, y para dejar
registrado *por qué* está cada cosa.

## Dónde va cada archivo

| Archivo en este repositorio | Ruta en la VPS |
|---|---|
| `sites-available/urban-oasis` | `/etc/nginx/sites-available/urban-oasis` |
| `snippets/urban-oasis-cache.conf` | `/etc/nginx/snippets/urban-oasis-cache.conf` |
| `snippets/urban-oasis-api.conf` | `/etc/nginx/snippets/urban-oasis-api.conf` |
| `conf.d/urban-oasis-limits.conf` | `/etc/nginx/conf.d/urban-oasis-limits.conf` |

`sites-enabled/urban-oasis` es un enlace simbólico al archivo de `sites-available`.

## Decisiones que conviene no deshacer sin querer

**`add_header` no se hereda.** nginx descarta todas las cabeceras heredadas en cualquier
bloque `location` que declare un `add_header` propio. Por eso las reglas de caché usan
`expires` y el snippet de la API usa `gzip_*` y `limit_req`: ninguna es `add_header`, así
que las seis cabeceras de seguridad siguen aplicándose en todas las rutas. Si algún día se
añade un `add_header` dentro de un `location`, hay que repetir las seis ahí.

**`frame-ancestors` solo funciona como cabecera HTTP.** Los navegadores la ignoran cuando
la CSP llega en un `<meta>`. Por eso la CSP se sirve desde aquí y no desde `index.html`.

**HSTS está en `max-age=300` a propósito.** Un valor largo es irreversible desde el
servidor: si el certificado falla, los navegadores ya no permiten entrar. Subirlo a
`31536000` cuando el sitio lleve unos días estable. No añadir `preload` ni
`includeSubDomains` sin revisar antes todos los subdominios.

**`index.html`, `ngsw.json` y `ngsw-worker.js` no se cachean.** Sin eso el navegador aplica
caché heurística, el service worker no detecta los despliegues nuevos y los usuarios se
quedan en una versión antigua. Los assets con hash en el nombre sí se cachean un año.

**`gzip_proxied any` es imprescindible.** nginx no comprime respuestas de un backend
proxeado salvo que se indique. Sin esa línea, `GET /api/oasis` viajaba sin comprimir
(340 KB en lugar de 59 KB).

**El límite de peticiones vive en `conf.d/`** porque `limit_req_zone` solo es válido en el
contexto `http`, no dentro de un `server`.

## Cómo aplicar un cambio sin tirar el sitio

`nginx -t` valida la *sintaxis*, no el *contenido*: un bloque `server` sin `location` es
sintácticamente correcto y dejaría la API sin servir. Conviene comprobar también que el
archivo tiene lo que debe tener antes de recargar:

```bash
N=$(sudo grep -cE '^[[:space:]]*add_header' /etc/nginx/sites-available/urban-oasis)
if [ "$N" -eq 6 ]; then sudo nginx -t && sudo systemctl reload nginx; else echo "NO recargar"; fi
```

Pegar textos largos por SSH puede truncar líneas en silencio. Es más seguro editar con
ficheros pequeños y una línea de `include` que reescribir la configuración entera.
