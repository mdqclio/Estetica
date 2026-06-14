# HANDOFF — Sistema de gestión de estética

Documento de traspaso. Asume programador con experiencia pero algo oxidado; es
autocontenido. Para detalle de endpoints ver también el `README.md`.

---

## 1. Resumen del proyecto

App web para la gestión de un centro de estética: autenticación con JWT, control
de acceso por roles (RBAC), gestión de clientes/servicios, agenda de turnos,
dashboard de métricas y reportes financieros.

**Stack**

| Capa     | Tecnología |
| -------- | ---------- |
| Backend  | NestJS 10 · Prisma 5 · PostgreSQL · Passport-JWT · bcrypt · class-validator |
| Frontend | React 18 · TypeScript · Vite 5 · Tailwind CSS 3 · React Router 6 · axios |
| DB (prod)| Supabase (PostgreSQL gestionado) |
| Deploy   | Backend en Render · Frontend en Vercel |

**Módulos** (backend en `src/modules/`, cada uno con frontend asociado)

| Módulo         | Qué hace |
| -------------- | -------- |
| `auth`         | Login (`POST /auth/login`) y usuario actual (`GET /auth/me`). Emite/valida JWT. |
| `usuarios`     | ABM de usuarios del sistema (solo ADMIN). Incluye `GET /usuarios/profissionais` para selects. |
| `clientes`     | ABM de clientes con búsqueda, paginación e inativar/reativar. |
| `servicos`     | Catálogo de servicios (nombre, duración, precio). Lectura para todos; escritura solo ADMIN. |
| `agendamentos` | Turnos: cliente + servicio + profesional + horario. Calcula fin por duración, valida solapamiento. |
| `dashboard`    | Métricas operativas (turnos de hoy/semana, próximos, facturación semanal, etc.). Pantalla inicial. |
| `reportes`     | Reportes financieros por rango de fechas + export CSV (solo ADMIN). |

---

## 2. Mapa de arquitectura

### Estructura backend (`backend/`)

```
backend/
├── prisma/
│   ├── schema.prisma          Modelos: Usuario, Cliente, Servico, Agendamento (+ enums Perfil, StatusAgendamento)
│   ├── migrations/            Migraciones versionadas (se aplican con migrate deploy en prod)
│   └── seed.ts                Datos de ejemplo (usuarios, clientes, servicios, turnos)
└── src/
    ├── main.ts                Bootstrap: prefijo /api, CORS, ValidationPipe, JwtAuthGuard global, valida env
    ├── app.module.ts          Registro de todos los módulos
    ├── prisma/                PrismaService global (conexión)
    ├── common/
    │   ├── decorators/        @Roles, @Public, @CurrentUser
    │   └── guards/            JwtAuthGuard (global), RolesGuard
    └── modules/
        ├── auth/              controller + service + jwt.strategy + dto
        ├── usuarios/
        ├── clientes/
        ├── servicos/
        ├── agendamentos/
        ├── dashboard/
        └── reportes/          incluye reportes.calc.ts (lógica pura) + reportes.calc.spec.ts (tests)
```

Patrón de cada módulo: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/*.dto.ts`.
Autenticación global vía `JwtAuthGuard` (rutas públicas se marcan con `@Public()`).
Autorización por ruta vía `@Roles(...)` + `RolesGuard`.

### Estructura frontend (`frontend/src/`)

```
src/
├── main.tsx                   Punto de entrada
├── App.tsx                    Rutas (BrowserRouter). Protección con ProtectedRoute + RequireRole
├── context/AuthContext.tsx    Estado de auth (token en localStorage, usuario)
├── hooks/useAuth.ts           Acceso al contexto (login, logout, hasRole)
├── services/                  api.ts (axios + interceptor JWT) + un service por módulo
├── components/                Layout, Sidebar, ProtectedRoute, RequireRole
├── pages/                     Login, Dashboard, Clientes*, Usuarios*, Servicos*, Agendamentos*, Reportes
└── types/index.ts             Tipos compartidos (Usuario, Cliente, Servico, Agendamento, etc.)
```

- `api.ts` inyecta el JWT en cada request y, ante un 401, limpia el token y redirige a `/login`.
- `ProtectedRoute` exige estar autenticado; `RequireRole` exige un perfil concreto.

### Matriz de permisos RBAC

Tres perfiles: **ADMIN**, **RECEPCIONISTA**, **PROFISSIONAL**.

| Acción                                   | ADMIN | RECEPCIONISTA | PROFISSIONAL |
| ---------------------------------------- | :---: | :-----------: | :----------: |
| Listar / ver clientes                    |  ✅   |      ✅       |     ✅       |
| Crear / editar clientes                  |  ✅   |      ✅       |     ❌       |
| Inativar clientes                        |  ✅   |      ✅       |     ❌       |
| Reativar clientes                        |  ✅   |      ❌       |     ❌       |
| Listar / ver servicios                   |  ✅   |      ✅       |     ✅       |
| Crear / editar / (in)ativar servicios    |  ✅   |      ❌       |     ❌       |
| Ver turnos                               |  ✅   |      ✅       | ✅ (solo su agenda) |
| Crear / editar turnos                    |  ✅   |      ✅       |     ❌       |
| Cambiar estado de turnos                 |  ✅   |      ✅       |     ❌       |
| Ver dashboard                            |  ✅   |      ✅       | ✅ (solo su agenda) |
| Ver reportes financieros                 |  ✅   |      ❌       |     ❌       |
| Gestionar usuarios                       |  ✅   |      ❌       |     ❌       |

> El PROFISSIONAL solo ve turnos/métricas de **su propia agenda**: el filtro por
> `profissionalId = req.user.id` se aplica en el service, no solo en la UI.

---

## 3. Setup local desde cero

### Prerequisitos
- Node.js 18+ (probado con v22).
- PostgreSQL 13+ corriendo en local **o** Docker para levantar uno:
  ```bash
  docker run -d --name estetica-pg \
    -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=estetica \
    -p 127.0.0.1:5432:5432 postgres:16-alpine
  ```

### Clonar e instalar
```bash
git clone https://github.com/mdqclio/Estetica.git
cd Estetica
```

### Backend
```bash
cd backend
cp .env.example .env          # editar según la tabla de abajo
npm install
npx prisma generate           # genera el cliente Prisma
npx prisma migrate dev        # crea/aplica las tablas
npm run seed                  # carga datos de ejemplo
npm run start:dev             # API en http://localhost:3001/api
```

**Variables de `backend/.env`** (todas obligatorias salvo donde se indica):

| Variable        | Para qué | Cómo obtenerla |
| --------------- | -------- | -------------- |
| `DATABASE_URL`  | Conexión que usa la app en runtime (Prisma Client). | Local: `postgresql://postgres:postgres@localhost:5432/estetica?schema=public`. Prod (Supabase): cadena del **pooler**, puerto **6543**, agregando `?pgbouncer=true`. |
| `DIRECT_URL`    | Conexión directa que usa `prisma migrate` (no pasa por el pooler). | Local: igual que `DATABASE_URL`. Prod (Supabase): cadena de **conexión directa**, puerto **5432**. |
| `JWT_SECRET`    | Clave para firmar/verificar los JWT. **Obligatoria, sin default**: la app no arranca si falta. | Generar una aleatoria larga: `openssl rand -base64 48`. |
| `JWT_EXPIRES_IN`| Vigencia del token (opcional, default `1d`). | Ej. `1d`, `12h`. |
| `PORT`          | Puerto del backend (opcional, default `3001`). En Render lo asigna la plataforma. | Local: `3001`. |
| `FRONTEND_URL`  | Origen permitido por CORS. | Local: `http://localhost:5173`. Prod: URL del frontend en Vercel. |

> En local `DATABASE_URL` y `DIRECT_URL` apuntan a la misma base; la distinción
> solo importa en Supabase (ver §4).

### Frontend
```bash
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:3001/api
npm install
npm run dev                   # app en http://localhost:5173
```

**Variable de `frontend/.env`:**

| Variable       | Para qué | Valor |
| -------------- | -------- | ----- |
| `VITE_API_URL` | URL base de la API (incluye `/api`). Se incrusta en build. | Local: `http://localhost:3001/api`. Prod: `https://<tu-backend>.onrender.com/api`. |

### Login por defecto (tras el seed)

| Email                      | Contraseña       | Perfil        |
| -------------------------- | ---------------- | ------------- |
| admin@estetica.com         | admin123         | ADMIN         |
| recepcao@estetica.com      | recepcao123      | RECEPCIONISTA |
| profissional@estetica.com  | profissional123  | PROFISSIONAL  |

---

## 4. Deploy a producción

Orden obligatorio: **Supabase → Render → Vercel → volver a Render**. Cada paso
necesita una URL del anterior.

### 1) Supabase (base de datos)
1. Crear proyecto y definir contraseña de DB.
2. En **Project Settings → Database → Connection string** copiar:
   - **Transaction pooler** (puerto 6543) → `DATABASE_URL` (agregarle `?pgbouncer=true`).
   - **Direct connection** (puerto 5432) → `DIRECT_URL`.
3. Reemplazar `[YOUR-PASSWORD]` por la contraseña real.

### 2) Render (backend NestJS)
El repo trae `render.yaml`. Crear un **Web Service** apuntando al repo. Si se hace a mano:
- Root Directory: `backend`
- Build Command: `npm install && npm run build && npm run migrate:deploy`
- Start Command: `npm run start:prod`

Variables en Render:

| Variable        | Valor |
| --------------- | ----- |
| `DATABASE_URL`  | Pooler de Supabase (6543, `?pgbouncer=true`) |
| `DIRECT_URL`    | Conexión directa de Supabase (5432) |
| `JWT_SECRET`    | Aleatoria (`openssl rand -base64 48`) |
| `JWT_EXPIRES_IN`| `1d` |
| `FRONTEND_URL`  | URL del frontend en Vercel (se completa en el paso 3) |

> `PORT` lo inyecta Render, **no** declararlo. Seed inicial: una vez, en la Shell
> del servicio, `npm run seed:prod`.

### 3) Vercel (frontend React)
Importar el repo:
- Root Directory: `frontend`
- Framework: Vite (Build `npm run build`, Output `dist`)

| Variable       | Valor |
| -------------- | ----- |
| `VITE_API_URL` | `https://<tu-backend>.onrender.com/api` |

> Las `VITE_*` se incrustan en build: si cambia, hay que re-desplegar.

### 4) Cerrar CORS
Con la URL final de Vercel, volver a Render y poner `FRONTEND_URL` con esa URL.
El servicio reinicia y el backend acepta las requests del frontend.

| Plataforma | Variables |
| ---------- | --------- |
| Supabase   | (solo provee las cadenas de conexión) |
| Render     | `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL` |
| Vercel     | `VITE_API_URL` |

---

## 5. Decisiones de diseño no obvias

- **`preco` y `valor` son `Decimal`, no `Float`.** Estándar para dinero (evita
  errores de coma flotante). Prisma serializa `Decimal` como **string** en el JSON
  de respuesta — por eso en el frontend se castea con `Number(...)` antes de operar
  o formatear (ver `types`: `Servico.preco` es `string`).

- **`Agendamento.valor` es un snapshot del precio.** Al crear el turno se copia el
  `preco` del servicio en ese momento al campo `valor`. Si en una edición cambia el
  servicio, se re-snapshotea. **Los reportes financieros se calculan sobre `valor`,
  no sobre `servico.preco` actual**, para que cambiar el precio de un servicio no
  altere el histórico ya facturado. La migración correspondiente backfilleó los
  turnos viejos copiándoles el precio del servicio.

- **Dos conexiones a la DB en prod (`DATABASE_URL` + `DIRECT_URL`).** Supabase
  ofrece un pooler (pgbouncer, 6543) ideal para la app, pero `prisma migrate`
  necesita conexión directa (5432). El `schema.prisma` declara ambas (`url` y
  `directUrl`).

- **RBAC del PROFISSIONAL se aplica en el backend, no solo en la UI.** El service de
  `agendamentos`/`dashboard` fuerza `profissionalId = req.user.id`; ocultar botones
  en el front es solo cosmético.

- **`JWT_SECRET` sin valor por defecto.** Se lee con `ConfigService` (vía
  `registerAsync`) y la app falla al arrancar si falta — para no firmar tokens con
  una clave hardcodeada por accidente.

- **Solapamiento de turnos:** dos turnos del mismo profesional no pueden pisarse;
  los `CANCELADO` no bloquean y los adyacentes (fin = inicio) sí se permiten.

- **Reportes:** la lógica de cálculo vive en `reportes.calc.ts` (funciones puras,
  sin DB) y está cubierta por tests (`reportes.calc.spec.ts`, `npm test` en backend).
  El service solo trae los datos y delega los cálculos.

---

## 6. Continuar el desarrollo con Claude Code

Este proyecto se construyó con **Claude Code** (CLI de Anthropic). Podés seguir
usándolo para continuar: pedile features, fixes, refactors o explicaciones del
código. Sugerencias:
- Arrancá pidiéndole un recorrido del repo o que lea un módulo concreto.
- Pedile que siga las convenciones existentes (patrón modular, RBAC con `@Roles`,
  DTOs con class-validator) — están descritas acá y en el `README.md`.
- Para cambios de modelo: pedirle migración + actualización de seed + tests.

Más info: https://claude.com/claude-code
