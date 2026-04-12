# Portfolio + monolito

Repositorio con la **landing estática** del portfolio (raíz del sitio servido por Caddy) y la **aplicación monolito**: portal web para catálogo comercial, proyectos, cotizaciones, asignación por roles y generación de documentos (PDF), con API en un solo backend.

## Arquitectura

| Capa | Tecnología |
|------|------------|
| Proxy / TLS / estáticos | [Caddy](https://caddyserver.com/) (`Caddyfile`) |
| Frontend SPA | React 18, Vite, Mantine 7, React Query, React Router (`monolito/frontend`) |
| Backend | Spring Boot 4, Java 21, GraphQL, REST, JPA, Spring Security (JWT) (`monolito/backend`) |
| Datos | PostgreSQL 17 |
| Caché / sesiones | Redis 7 |
| Objetos (imágenes, modelos 3D, planes) | MinIO (API S3-compatible) |
| CI / despliegue | Referencias en `.github/`, `amplify.yaml`, `terraform/` |

Caddy enruta:

- `/api/*` → backend (Spring)
- `/app/*` → build del frontend (basename `/app/`)
- `/images/*`, `/models/*`, `/plans/*` → MinIO (lectura pública vía proxy)
- `/` y estáticos → `index.html`, `assets/`, `preview/`, etc.

## Roles en el portal (`/app/`)

El frontend define rutas protegidas por rol, entre ellas:

- **Comercial:** catálogo, proyecto, P3, solicitudes, hilos
- **Cotizador / Diseñador / Desarrollo:** flujos de proyectos y productos
- **Asignación:** gestión de asignaciones (líderes)
- **Admin:** proyectos y usuarios

Autenticación vía JWT almacenado en cliente y comprobación de rol en rutas.

## Funcionalidades destacadas

- Catálogo de productos con variantes, variables, imágenes y modelos (GLB/GLTF) con previsualización
- Proyectos y cotizaciones; tablas editables según contexto
- Subida de medios validada (MIME/tamaño en cliente; magic bytes en servidor)
- **PDF de cotización:** HTML generado en cliente, envío al servicio de documentos; el backend incrusta imágenes desde MinIO (`/images/<key>`) y renderiza con OpenHTMLToPDF
- Hilos / mensajería asociada a proyectos (según módulos habilitados)

## Requisitos

- Docker y Docker Compose
- Opcional: variable `HOST_IP` si accedes desde otra máquina en LAN (URLs presignadas / enlaces a MinIO desde el navegador)

## Arranque local (Docker)

Desde la raíz del repositorio:

```bash
export HOST_IP=localhost   # o tu IP en la red, si aplica
docker compose up -d --build
```

- Sitio principal: `http://localhost` (landing)
- App: `http://localhost/app/` (ajusta si usas otro host)

Consola MinIO (si expones el puerto en tu entorno): suele ser el puerto `9001` del servicio; en el `docker-compose` actual solo Caddy publica `80` — para depuración MinIO puedes mapear `9001:9001` temporalmente.

## Desarrollo sin Docker (orientativo)

- **Backend:** JDK 21, `./mvnw spring-boot:run` en `monolito/backend` (configura Postgres, Redis, MinIO y URLs en `application.yaml` o variables de entorno)
- **Frontend:** Node 20+, `npm install && npm run dev` en `monolito/frontend` (proxy/API según tu setup)

## Estructura del repo

```
.
├── Caddyfile              # Reverse proxy
├── docker-compose.yml     # appdb, redis, minio, backend, frontend, caddy
├── index.html, assets/    # Landing portfolio
├── monolito/
│   ├── backend/           # Spring Boot (GraphQL + REST document)
│   └── frontend/          # Vite + React (portal-web)
├── preview/               # Previews estáticas
├── terraform/             # Infra (opcional)
└── .github/               # Workflows CI
```

## Seguridad

Las credenciales del `docker-compose` y `application.yaml` de ejemplo son **solo para desarrollo local**. En producción usa gestión de secretos (p. ej. Infisical), contraseñas fuertes y endpoints HTTPS terminados en Caddy.

## Licencia

Sin licencia pública indicada; uso interno / según organización.
