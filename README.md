# Estética · Sistema de gestión

Sistema web para la gestión de un centro de estética: autenticación con JWT,
control de acceso por roles (RBAC) y gestión de clientes y usuarios.

## Stack

| Capa     | Tecnología                                            |
| -------- | ----------------------------------------------------- |
| Backend  | NestJS · Prisma · PostgreSQL · Passport-JWT · bcrypt  |
| Frontend | React · TypeScript · Vite · Tailwind CSS · React Router · axios |

## Estructura

```
estetica/
├── backend/                 NestJS + Prisma + PostgreSQL
│   ├── prisma/
│   │   ├── schema.prisma     Modelos Usuario, Cliente, Servico y Agendamento
│   │   └── seed.ts           Usuarios y clientes por defecto
│   └── src/
│       ├── modules/          auth · clientes · usuarios · servicos · agendamentos · dashboard · reportes
│       ├── common/           guards (JwtAuthGuard, RolesGuard) + decorators (@Roles, @Public, @CurrentUser)
│       └── prisma/           PrismaService global
└── frontend/                React + TS + Tailwind
    └── src/
        ├── pages/            Dashboard, Login, Clientes*, Usuarios*, Servicos*, Agendamentos*, Reportes
        ├── components/       Layout, Sidebar, ProtectedRoute
        ├── services/         api (axios + interceptor JWT), clientes, usuarios, auth
        ├── hooks/            useAuth
        ├── context/          AuthContext
        └── types/            tipos compartidos
```

## Requisitos previos

- Node.js 18+ (probado con v22)
- PostgreSQL 13+ en ejecución

---

## 1. Configurar la base de datos

Crea una base de datos PostgreSQL, por ejemplo:

```bash
createdb estetica
# o desde psql:  CREATE DATABASE estetica;
```

## 2. Backend

```bash
cd backend
cp .env.example .env          # ajusta DATABASE_URL, DIRECT_URL, JWT_SECRET, PORT
npm install
npx prisma generate           # genera el cliente Prisma
npx prisma migrate dev        # aplica las migraciones (crea las tablas)
npm run seed                  # carga usuarios y clientes de ejemplo
npm run start:dev             # API en http://localhost:3001/api
```

Variables en `backend/.env`:

```
DATABASE_URL="postgresql://usuario:password@localhost:5432/estetica?schema=public"
DIRECT_URL="postgresql://usuario:password@localhost:5432/estetica?schema=public"
JWT_SECRET="cambia-esta-clave-super-secreta"
JWT_EXPIRES_IN="1d"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

> En local `DATABASE_URL` y `DIRECT_URL` apuntan a la misma base. La distinción
> solo importa en Supabase (ver sección **Deploy**).

## 3. Frontend

```bash
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:3001/api
npm install
npm run dev                   # app en http://localhost:5173
```

---

## Usuarios por defecto (seed)

| Email                  | Contraseña    | Perfil        |
| ---------------------- | ------------- | ------------- |
| admin@estetica.com     | admin123      | ADMIN         |
| recepcao@estetica.com  | recepcao123   | RECEPCIONISTA |
| profissional@estetica.com | profissional123 | PROFISSIONAL |

## Reglas RBAC

| Acción                        | ADMIN | RECEPCIONISTA | PROFISSIONAL |
| ----------------------------- | :---: | :-----------: | :----------: |
| Listar / ver clientes         |  ✅   |      ✅       |     ✅       |
| Crear / editar clientes       |  ✅   |      ✅       |     ❌       |
| Inativar clientes             |  ✅   |      ✅       |     ❌       |
| Reativar clientes             |  ✅   |      ❌       |     ❌       |
| Listar / ver servicios        |  ✅   |      ✅       |     ✅       |
| Crear / editar / (in)ativar servicios | ✅ |   ❌       |     ❌       |
| Ver turnos                    |  ✅   |      ✅       | ✅ (solo su agenda) |
| Crear / editar turnos         |  ✅   |      ✅       |     ❌       |
| Cambiar estado de turnos      |  ✅   |      ✅       |     ❌       |
| Ver dashboard                 |  ✅   |      ✅       | ✅ (solo su agenda) |
| Ver reportes financieros      |  ✅   |      ❌       |     ❌       |
| Gestionar usuarios            |  ✅   |      ❌       |     ❌       |

## Endpoints

### Auth
- `POST /api/auth/login` — pública
- `GET  /api/auth/me` — usuario autenticado

### Dashboard
- `GET /api/dashboard/metrics` — todos (PROFISSIONAL recibe métricas acotadas a su agenda)

  Devuelve: `clientesAtivos`, `turnosHoje`, `turnosSemana`, `turnosPorStatus`,
  `proximosTurnos` (5), `faturamentoEstimado` (suma de `preco` de servicios en turnos
  `CONCLUIDO` de la semana), `servicosMaisSolicitados` (top 5), `turnosPorDia` (semana
  actual, lun→dom) y `periodo`. Es la pantalla inicial tras el login.

### Clientes
- `GET   /api/clientes` — listar/buscar (`?search=&page=&limit=&ativo=`) — todos
- `GET   /api/clientes/:id` — todos
- `POST  /api/clientes` — ADMIN, RECEPCIONISTA
- `PUT   /api/clientes/:id` — ADMIN, RECEPCIONISTA
- `PATCH /api/clientes/:id/inativar` — ADMIN, RECEPCIONISTA
- `PATCH /api/clientes/:id/reativar` — ADMIN

### Usuarios (solo ADMIN)
- `GET   /api/usuarios`
- `GET   /api/usuarios/profissionais` — lista reducida (id, nome) de profesionales activos — ADMIN, RECEPCIONISTA
- `GET   /api/usuarios/:id`
- `POST  /api/usuarios`
- `PUT   /api/usuarios/:id`
- `PATCH /api/usuarios/:id/inativar`

### Servicios
- `GET   /api/servicos` — listar/buscar (`?search=&page=&limit=&ativo=`) — todos
- `GET   /api/servicos/:id` — todos
- `POST  /api/servicos` — ADMIN
- `PUT   /api/servicos/:id` — ADMIN
- `PATCH /api/servicos/:id/inativar` — ADMIN
- `PATCH /api/servicos/:id/reativar` — ADMIN

### Agendamentos (turnos)
- `GET   /api/agendamentos` — listar/filtrar (`?dataInicio=&dataFim=&profissionalId=&clienteId=&status=&page=&limit=`) — todos (PROFISSIONAL solo su agenda)
- `GET   /api/agendamentos/:id` — todos (PROFISSIONAL solo si es propio)
- `POST  /api/agendamentos` — ADMIN, RECEPCIONISTA
- `PUT   /api/agendamentos/:id` — ADMIN, RECEPCIONISTA
- `PATCH /api/agendamentos/:id/status` — ADMIN, RECEPCIONISTA (body `{ "status": "CONFIRMADO|CONCLUIDO|CANCELADO" }`)

Reglas de negocio:
- Si no se envía `dataHoraFim`, se calcula con `dataHoraInicio + servico.duracaoMinutos`.
- El `profissionalId` debe ser un usuario con perfil `PROFISSIONAL` y activo.
- No se permiten dos turnos del mismo profesional que se solapen en el tiempo (los `CANCELADO` no bloquean). Turnos adyacentes (fin = inicio) sí se permiten.
- Al crear el turno se guarda `valor` = `preco` del servicio en ese momento (snapshot). Si en una edición cambia el servicio, se re-snapshotea con el nuevo precio. Los reportes financieros usan este `valor`, no el `preco` actual del servicio.

### Reportes financieros (solo ADMIN)
Todos requieren rango de fechas (`?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`) y se basan en `valor` de turnos `CONCLUIDO`.
- `GET /api/reportes/resumen` — reporte consolidado del período: faturamento total, ticket promedio, tasa de cancelación, turnos por status, faturamento por servicio y por profesional, serie temporal (por día o por mes según el rango) y comparativa con el período anterior equivalente.
- `GET /api/reportes/export` — mismo período exportado a CSV descargable (UTF-8 con BOM para Excel).

---

## Levantar todo en local (resumen)

```bash
# Terminal 1 — backend
cd backend && npm install && npx prisma generate && npx prisma migrate dev && npm run seed && npm run start:dev

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

Abre http://localhost:5173 e inicia sesión con `admin@estetica.com / admin123`.

---

## Deploy a producción

Arquitectura: **base de datos en Supabase** · **backend (NestJS) en Render** · **frontend (React) en Vercel**.

El orden importa: primero la base (Supabase), luego el backend (Render) y por
último el frontend (Vercel), porque cada paso necesita la URL del anterior.

### 1. Base de datos — Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) y define una contraseña de base de datos.
2. Ve a **Project Settings → Database → Connection string** y copia las dos cadenas:
   - **Transaction pooler** (puerto **6543**) → será `DATABASE_URL`. Añádele `?pgbouncer=true` al final.
   - **Direct connection** (puerto **5432**) → será `DIRECT_URL`.
3. Reemplaza `[YOUR-PASSWORD]` en ambas por la contraseña real.

| Variable       | Cadena de Supabase            | Puerto | Para qué                          |
| -------------- | ----------------------------- | :----: | --------------------------------- |
| `DATABASE_URL` | Transaction pooler + `?pgbouncer=true` |  6543  | La app en runtime (Prisma Client) |
| `DIRECT_URL`   | Direct connection             |  5432  | `prisma migrate deploy`           |

> Por qué dos: el pooler (6543) maneja muchas conexiones cortas — ideal para la
> app. Las migraciones necesitan una conexión directa (5432) sin pgbouncer.

### 2. Backend — Render

El repo incluye `render.yaml` (Blueprint). Crea un **Web Service** apuntando a
este repo; Render detecta la config. Si lo configuras a mano:

- **Root Directory:** `backend`
- **Build Command:** `npm install && npm run build && npm run migrate:deploy`
- **Start Command:** `npm run start:prod`

El build genera el cliente Prisma, compila Nest y aplica las migraciones con
`prisma migrate deploy` (nunca `migrate dev` en producción).

Variables de entorno en Render (**Environment**):

| Variable         | Valor                                                        |
| ---------------- | ------------------------------------------------------------ |
| `DATABASE_URL`   | Pooler de Supabase (6543, `?pgbouncer=true`)                 |
| `DIRECT_URL`     | Conexión directa de Supabase (5432)                          |
| `JWT_SECRET`     | Clave aleatoria larga — `openssl rand -base64 48`            |
| `JWT_EXPIRES_IN` | `1d`                                                         |
| `FRONTEND_URL`   | URL del frontend en Vercel (la obtienes en el paso 3)        |

> `PORT` lo inyecta Render automáticamente — **no** lo declares.

**Seed (una sola vez):** tras el primer deploy, abre la **Shell** del servicio en
Render y corre `npm run seed:prod` para crear los usuarios por defecto. Es
idempotente (usa `upsert`), pero corre solo una vez.

### 3. Frontend — Vercel

Importa el repo en [vercel.com](https://vercel.com):

- **Root Directory:** `frontend`
- **Framework Preset:** Vite (Build `npm run build`, Output `dist`)

Variable de entorno en Vercel:

| Variable       | Valor                                          |
| -------------- | ---------------------------------------------- |
| `VITE_API_URL` | `https://<tu-backend>.onrender.com/api`        |

> Las variables `VITE_*` se incrustan en build. Si cambias `VITE_API_URL`,
> vuelve a desplegar (redeploy) el frontend.

### 4. Cerrar el círculo de CORS

Cuando Vercel te dé la URL final del frontend, vuelve a Render y pon esa URL en
`FRONTEND_URL`. Render reiniciará el servicio y el backend aceptará las
peticiones del frontend (CORS).

### Resumen de variables por plataforma

| Plataforma   | Variables                                                            |
| ------------ | -------------------------------------------------------------------- |
| **Supabase** | (provee las cadenas de conexión — no se configuran variables aquí)   |
| **Render**   | `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL` |
| **Vercel**   | `VITE_API_URL`                                                       |
