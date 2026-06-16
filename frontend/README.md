# Urban Oasis Frontend

Angular 21 + Tailwind CSS + Leaflet

## Scripts

```bash
pnpm start      # Servidor dev
pnpm build      # Build producción
pnpm test       # Tests
```

## Stack

- **Framework**: Angular 21 (standalone components)
- **Estilos**: Tailwind CSS 4
- **Mapas**: Leaflet + OpenStreetMap
- **Clima**: API externa (temperatura + viento)
- **Build**: Angular CLI

## Estructura

```
src/
├── app/
│   ├── components/    # Mapa, footer
│   ├── pages/         # Home
│   ├── services/      # Oasis, Weather
│   ├── models/        # Tipos de datos
│   └── enum/          # Constantes
├── styles.css         # Tailwind + utilidades
└── index.html
```

## Convenciones

- Commits: `type(scope): description` (una línea)
- Componentes standalone sin NgModules
- Signals para estado reactivo
- Mobile-first con `dvh` para viewport
