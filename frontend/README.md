# Urban Oasis Frontend

Angular 21 + Tailwind CSS 4 + Leaflet

## Scripts

```bash
pnpm start      # Servidor dev
pnpm build      # Build producción
pnpm test       # Tests
```

## Stack

- **Framework**: Angular 21 (standalone components, signals, OnPush)
- **Estilos**: Tailwind CSS 4
- **Mapas**: Leaflet + OpenStreetMap tiles
- **Clima**: API externa (temperatura + viento)
- **Build**: Angular CLI + Vite

## Estructura

```
src/
├── app/
│   ├── components/
│   │   └── map-view/      # Mapa Leaflet con marcadores y popups
│   ├── pages/
│   │   └── home/          # Página principal con filtros, clima, info modal
│   ├── services/
│   │   ├── oasis.ts       # API de oasis (con URL dinámica local/prod)
│   │   └── wheater.ts     # Servicio de clima
│   ├── models/            # Tipos de datos
│   └── enum/              # OasisSpotType
├── styles.css             # Tailwind + utilidades
└── index.html
```

## API URL

El frontend detecta automáticamente el entorno:

- `localhost` → `http://localhost:8080/api/oasis`
- Producción → `https://urban-oasis-backend.onrender.com/api/oasis`

## Convenciones

- Commits: `type(scope): description` (solo una línea)
- Componentes standalone sin NgModules
- Signals para estado reactivo
- Mobile-first con safe-area-inset para notches
