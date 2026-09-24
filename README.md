# DSA Tracker

A full-stack, production-ready Data Structures and Algorithms revision tracker built with **Spring Boot 4**, **React 19**, **TypeScript**, **PostgreSQL**, **Tailwind CSS**, and **Motion Primitives / Framer Motion**.

---

## ⚠️ Security Notice & Secret Management

> [!WARNING]
> ### Critical Deployment & Credential Rotation Guidelines
> - **Zero Hardcoded Secrets**: All sensitive keys, tokens, database credentials, and signing secrets have been moved exclusively to environment variables. No secrets exist as literals in the codebase.
> - **Rotate Historical Secrets Immediately**: If you previously committed any real credentials, test database passwords, or private keys to this repository, **rotate them immediately in your identity and database providers**. Git history retains all committed lines indefinitely even if deleted in recent commits.
> - **Never Commit `.env` Files**: All `.env` and `.env.*` files are excluded by `.gitignore`. Never force-commit or track them. Use `.env.example` as a template for local development and cloud secret managers (e.g., Doppler, AWS Secrets Manager, Vault, Railway / Render / Fly.io environment config) for production.
> - **Frontend Exposure Risk**: In Vite / React, any environment variable prefixed with `VITE_` is statically injected into the client JavaScript bundle and is publicly readable by anyone inspecting the browser source or network traffic. **Never prefix private tokens, database passwords, or JWT secrets with `VITE_`.**
> - **Supabase / Stripe / 3rd Party APIs**:
>   - Keep service role keys, Stripe secret keys, and database connection strings strictly on the backend.
>   - Only expose public client keys (e.g. Stripe Publishable Key) to the frontend.
>   - If using Supabase, ensure Row Level Security (RLS) is strictly enabled on every table before exposing public anon keys.

---

## Features

- **Problem Management**: Track DSA questions with LeetCode links, difficulty, multi-tag categories, and custom notes.
- **Smart Revisit Queue**: Spaced repetition tracking based on difficulty, mistake tags, and custom review intervals.
- **Visual Analytics**: Interactive activity heatmap, topic breakdown charts, and solved metrics.
- **Polished UI/UX**: Motion Primitives animations, fluid number counters, responsive drawer navigation, and clean Material/Tailwind styling.
- **Secure Authentication**: Stateless JWT-based authentication with BCrypt password hashing.

---

## Environment Variables Configuration

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

| Variable | Description | Default / Example | Target Service |
| :--- | :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` / `DATABASE_URL` | Full JDBC connection string (optional) | `jdbc:postgresql://localhost:5432/postgres` | Backend |
| `DB_HOST` | Database host | `localhost` | Backend |
| `DB_PORT` | Database port | `5432` | Backend |
| `DB_NAME` | Database name | `postgres` | Backend |
| `DB_USER` | Database username | `postgres` | Backend |
| `DB_PASSWORD` | Database password (**Required**) | *Set in environment* | Backend |
| `JWT_SECRET_KEY` | 256-bit Base64-encoded secret key (**Required**) | `openssl rand -base64 32` | Backend |
| `JWT_EXPIRATION` | Token validity in milliseconds | `86400000` (24h) | Backend |

> Tip: Generate a secure 256-bit base64 secret for JWT via terminal:
> ```bash
> openssl rand -base64 32
> ```

---

## Local Development Setup

### 1. Prerequisites
- **Java 21+**
- **Node.js 18+ & npm**
- **PostgreSQL 14+** (or Docker)

### 2. Database
Run PostgreSQL with Docker:
```bash
docker run --name postgres-scaffold -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

### 3. Backend (Spring Boot)
```bash
cd backend
./mvnw spring-boot:run
```
The backend API starts at `http://localhost:8080`.

### 4. Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev
```
The frontend dev server runs at `http://localhost:5173` with proxying to `/api`.

---

## License
MIT
