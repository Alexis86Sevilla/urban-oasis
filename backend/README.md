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

### Seed manual

Los datos se cargan desde la máquina local (Overpass está rate-limiteado para IPs de cloud). Para cada tipo de oasis:

1. Ejecutar la query en Postman contra `https://overpass-api.de/api/interpreter`
2. Copiar el array `elements` de la respuesta
3. Hacer `POST /api/oasis/seed?type={TYPE}` con los elements como JSON body

## Scheduler

- `SyncScheduler`: cron `0 0 3,15 * * *` (3 AM y 3 PM)
- `SyncRunner`: al arrancar, si la DB está vacía, avisa que hay que seedear
- Overpass está rate-limiteado para IPs de cloud; el scheduler funciona cuando la IP no está baneada

## Despliegue

Definido en `render.yaml` (raíz del proyecto):

- Web service Docker en plan free
- PostgreSQL managed en Render
- Conexión automática vía `fromDatabase`

## Convenciones

- Commits: `type(scope): description` (solo una línea)
- Arquitectura hexagonal (domain, infrastructure, api separados)
- `@Transactional` en operaciones de escritura
- Upsert por `osmNodeId` para evitar duplicados
