# Urban Oasis

App para encontrar refugios del calor en Sevilla: fuentes de agua potable, zonas de sombra y edificios con aire acondicionado. Ideal para días de calor extremo.

## Características

- Mapa interactivo con filtros por tipo de oasis (fuentes, sombra, A/A)
- Geolocalización en tiempo real con distancia a cada punto
- Clima actual (temperatura y viento) con alerta de calor extremo
- Modal informativo con alerta climática y reivindicación de más árboles
- Diseño mobile-first con Tailwind CSS
- Datos de OpenStreetMap vía Overpass API

## Estructura

```
urban-oasis/
├── frontend/          # Angular 21 + Leaflet + Tailwind CSS
├── backend/           # Spring Boot 3.5 + PostgreSQL + Hibernate
└── Dockerfile         # Build multi-stage para el backend
```

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 21 standalone, Tailwind CSS 4, Leaflet |
| Backend | Spring Boot 3.5, Java 21, Hibernate JPA |
| Base de datos | PostgreSQL |
| Datos | OpenStreetMap vía Overpass API |
| Deploy | VPS propia vía `.github/workflows/deploy.yml` (build + SCP + restart de servicio) |

## API Endpoints

Las rutas de escritura (`POST`/`PUT`/`DELETE`) requieren la cabecera `X-API-Key`; ver [backend/README.md](backend/README.md#configuración).

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/oasis` | Listar todos los spots |
| GET | `/api/oasis/{id}` | Obtener un spot |
| DELETE | `/api/oasis/type/{type}` | Borrar spots por tipo |
| POST | `/api/oasis/syncFountainsAndShades` | Sync manual fuentes + sombras |
| POST | `/api/oasis/syncACBuildings` | Sync manual edificios A/C |

## Desarrollo local

```bash
# Backend
cd backend && ./mvnw spring-boot:run

# Frontend
cd frontend && pnpm start
```

## Licencia

MIT
