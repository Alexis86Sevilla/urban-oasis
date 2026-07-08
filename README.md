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
├── render.yaml        # Render Blueprint (web service + DB)
└── Dockerfile         # Build multi-stage para Render
```

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 21 standalone, Tailwind CSS 4, Leaflet |
| Backend | Spring Boot 3.5, Java 21, Hibernate JPA |
| Base de datos | PostgreSQL (Render) |
| Datos | OpenStreetMap vía Overpass API |
| Deploy | Render (backend) + Cloudflare Pages (frontend) |

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/oasis` | Listar todos los spots |
| GET | `/api/oasis/{id}` | Obtener un spot |
| POST | `/api/oasis/seed?type=TYPE` | Seed manual de datos Overpass |
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
