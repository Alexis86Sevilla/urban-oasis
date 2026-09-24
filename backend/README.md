# Urban Oasis Backend

Spring Boot 3.5 + Java 21 + PostgreSQL

## Scripts

```bash
./mvnw spring-boot:run   # Servidor dev
./mvnw test               # Tests
./mvnw clean package      # Build JAR
```

## Stack

- **Framework**: Spring Boot 3.5.16
- **Java**: 21
- **Persistencia**: Hibernate JPA + PostgreSQL
- **Build**: Maven
- **Testing**: JUnit 5

## Estructura

```
src/main/java/com/urbanoasis/
├── api/controller/          # OasisSpotController (REST)
├── config/                  # CorsConfig, DataSourceConfig, SchedulingConfig
├── domain/
│   ├── model/               # OasisSpot, OasisType
│   ├── repository/          # JPA repositories
│   └── service/             # OasisSpotService (lógica de negocio)
├── infrastructure/
│   ├── client/
│   │   └── OverpassClient   # Cliente HTTP para Overpass API
│   │   └── dto/             # DTOs para respuesta de Overpass
│   └── scheduler/           # SyncScheduler, SyncRunner
└── BackendApplication.java
```

## API

Ver [README principal](../README.md#api-endpoints) para lista completa.

## Configuración

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `ADMIN_API_KEY` | Sí, para escritura | Clave enviada por el cliente en la cabecera `X-API-Key` para autenticar `POST`/`PUT`/`DELETE` en `/api/oasis/**`. Si no está configurada (o está vacía), esos endpoints quedan deshabilitados y responden `401 Unauthorized` (fail closed). `GET /api/oasis`, `GET /api/oasis/{id}` y las peticiones `OPTIONS` de CORS preflight siempre quedan públicas. No hay ningún valor real de esta clave en el repositorio. |
| `DATABASE_URL` / `DATABASE_USERNAME` / `DATABASE_PASSWORD` | Sí | Conexión PostgreSQL |
| `JPA_DDL_AUTO` | No | Estrategia de Hibernate DDL (por defecto `update`) |
| `CORS_ORIGINS` | No | Orígenes permitidos por CORS (por defecto `http://localhost:4200,https://urban-oasis.info,https://www.urban-oasis.info`) |
| `PORT` | No | Puerto del servidor (por defecto `8080`) |

## Scheduler

- `SyncScheduler`: cron `0 0 3,15 * * *` (3 AM y 3 PM)
- `SyncRunner`: al arrancar, si la DB está vacía, ejecuta la sincronización inicial automáticamente
- Overpass está rate-limiteado para IPs de cloud; el scheduler funciona cuando la IP no está baneada

## Despliegue

Definido en `.github/workflows/deploy.yml`: build de la JAR, copia por SCP y reinicio del servicio `systemd` en una VPS propia.

El servicio `urban-oasis` ejecuta la JAR desde `/opt/urban-oasis/` bajo el usuario de sistema
`urbanoasis` (sin shell ni home), no como `root`. Las variables de entorno se leen de
`/opt/urban-oasis/.env`, con permisos `640` y propiedad `urbanoasis:urbanoasis`.

Antes de reiniciar el servicio, el workflow ejecuta `chown urbanoasis:urbanoasis` sobre la JAR
recién copiada: sin ese paso llegaría con propiedad `root` y el servicio no podría leerla.

## Migraciones de esquema

Los cambios de esquema se gestionan con [Flyway](https://flywaydb.org/), en
`backend/src/main/resources/db/migration`. Cada archivo sigue el formato
`V<version>__descripcion.sql` (por ejemplo, `V1__baseline_oasis_spots.sql`).

- `spring.jpa.hibernate.ddl-auto` es `validate` por defecto: Hibernate solo comprueba
  que el esquema coincide con las entidades, ya no crea ni altera tablas.
- La base de datos de producción existente se adoptó mediante el baseline de Flyway
  (`baseline-on-migrate: true`, `baseline-version: 1`): `V1` reproduce el esquema
  que ya estaba en producción, se registra como ya aplicada y nunca se ejecuta
  contra producción; solo se ejecuta en bases de datos nuevas.
- `JPA_DDL_AUTO` sigue permitiendo sobrescribir el modo de Hibernate si alguna vez
  fuera necesario.

## Convenciones

- Commits: `type(scope): description` (solo una línea)
- Arquitectura hexagonal (domain, infrastructure, api separados)
- `@Transactional` en operaciones de escritura
- Upsert por `osmNodeId` para evitar duplicados
