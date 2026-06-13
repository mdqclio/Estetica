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
│   │   ├── schema.prisma     Modelos Usuario y Cliente
│   │   └── seed.ts           Usuarios y clientes por defecto
│   └── src/
│       ├── modules/          auth · clientes · usuarios
│       ├── common/           guards (JwtAuthGuard, RolesGuard) + decorators (@Roles, @Public, @CurrentUser)
│       └── prisma/           PrismaService global
└── frontend/                React + TS + Tailwind
    └── src/
        ├── pages/            Login, ClientesList, ClienteForm, ClienteDetail, UsuariosList
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
cp .env.example .env          # ajusta DATABASE_URL, JWT_SECRET, PORT
npm install
npx prisma generate           # genera el cliente Prisma
npx prisma migrate dev --name init   # crea las tablas
npm run seed                  # carga usuarios y clientes de ejemplo
npm run start:dev             # API en http://localhost:3001/api
```

Variables en `backend/.env`:

```
DATABASE_URL="postgresql://usuario:password@localhost:5432/estetica?schema=public"
JWT_SECRET="cambia-esta-clave-super-secreta"
JWT_EXPIRES_IN="1d"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

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
| Gestionar usuarios            |  ✅   |      ❌       |     ❌       |

## Endpoints

### Auth
- `POST /api/auth/login` — pública
- `GET  /api/auth/me` — usuario autenticado

### Clientes
- `GET   /api/clientes` — listar/buscar (`?search=&page=&limit=&ativo=`) — todos
- `GET   /api/clientes/:id` — todos
- `POST  /api/clientes` — ADMIN, RECEPCIONISTA
- `PUT   /api/clientes/:id` — ADMIN, RECEPCIONISTA
- `PATCH /api/clientes/:id/inativar` — ADMIN, RECEPCIONISTA
- `PATCH /api/clientes/:id/reativar` — ADMIN

### Usuarios (solo ADMIN)
- `GET   /api/usuarios`
- `GET   /api/usuarios/:id`
- `POST  /api/usuarios`
- `PUT   /api/usuarios/:id`
- `PATCH /api/usuarios/:id/inativar`

---

## Levantar todo en local (resumen)

```bash
# Terminal 1 — backend
cd backend && npm install && npx prisma generate && npx prisma migrate dev --name init && npm run seed && npm run start:dev

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

Abre http://localhost:5173 e inicia sesión con `admin@estetica.com / admin123`.
