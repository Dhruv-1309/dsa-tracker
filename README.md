<div align="center">

# ⚡ DSA Tracker

**A full-stack, production-grade algorithmic problem-solving tracker with automated spaced repetition, mistake categorization, and deep performance analytics.**

[![Java 21](https://img.shields.io/badge/Java-21-orange.svg?logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.1-brightgreen.svg?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.2-blue.svg?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.3-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-336791.svg?logo=postgresql)](https://www.postgresql.org/)
[![Security Hardened](https://img.shields.io/badge/Security-Hardened%20%26%20Audited-success.svg)](#-security-hardening--privacy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📖 Overview

Spreadsheets and static bookmark folders make reviewing Data Structures and Algorithms inefficient. **DSA Tracker** replaces manual logs with an intelligent revision workflow built to maximize retention and eliminate blind spots. 

By combining **automated spaced repetition**, **mistake categorization**, and **session attempt analytics**, DSA Tracker ensures you never forget how you solved a hard problem or repeat the same conceptual mistake.

---

## ✨ Key Features

### 📌 Problem Management & Tagging
- **Multi-Platform Support**: Track problems across LeetCode, HackerRank, Codeforces, NeetCode, and custom sources.
- **Difficulty Classification**: Categorize problems as `EASY`, `MEDIUM`, or `HARD` with platform URL validation.
- **Dynamic Multi-Topic Association**: Tag problems across multiple algorithmic paradigms (Dynamic Programming, Graphs, Sliding Window, Trees, Heaps, Backtracking, etc.).
- **Rich Markdown Notes**: Store personal takeaways, key observations, time/space complexity analysis, and approach summaries.

### 🧠 Intelligent Spaced Repetition (Revisit Queue)
- **Automated Scheduling**: Computes revisit priorities using an adaptive spaced repetition algorithm based on problem difficulty, recent mistake patterns, and custom intervals.
- **Active Recall Mode**: Practice mode automatically conceals your prior notes and solution approaches until you finish your attempt, preventing passive memorization.

### ⏱️ Attempt History & Mistake Taxonomy
- **Granular Attempt Metrics**: Record time elapsed, solution status (`SOLVED`, `ATTEMPTED`, `REVISIT`), and subjective confidence (`LOW`, `MEDIUM`, `HIGH`).
- **Targeted Mistake Taxonomy**: Tag failed or sub-optimal attempts with specific root causes:
  - `Time Limit Exceeded`
  - `Edge Case Failure`
  - `Off-by-One Error`
  - `Suboptimal Time/Space Complexity`
  - `Syntax / Type Error`
  - `Logic / Conceptual Flaw`

### 📊 Deep Analytics & Dashboard
- **Activity Heatmap**: Interactive GitHub-style 365-day commit heatmap showing daily practice consistency.
- **Difficulty Distribution**: Live visual progress bars tracking completion percentages by difficulty tier.
- **Topic Mastery Breakdown**: Real-time aggregation of solved problems mapped against algorithmic categories.
- **Consistency Tracking**: Live current streak, longest streak, and total time invested counters.

### 🛡️ Enterprise Security & Privacy Governance
- **Stateless JWT Authentication**: Secure HMAC-SHA256 token verification with dedicated server-side logout blacklisting (`POST /api/auth/logout`).
- **Two-Tier Rate Limiting**: In-memory token bucket rate limiter:
  - `5 requests/min` on authentication endpoints (`/api/auth/**`) to prevent brute-force attacks.
  - `120 requests/min` on all general API endpoints to prevent API abuse and denial of service.
- **Zero Secret & PII Leakage**:
  - All credentials, DB connection strings, and tokens strictly externalized to environment variables.
  - `User.passwordHash` and relational collections protected with `@JsonIgnore` and dedicated DTO projections (`UserProfileResponse`, `MistakeTagResponse`).
  - No database credentials or JWT secrets ever committed to version control.
- **Production Security Headers**: Configured with `Strict-Transport-Security` (HSTS), `Content-Security-Policy` (CSP), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and origin-restricted CORS.
- **Sanitized Error Handling**: `GlobalExceptionHandler` intercepts all backend errors, logging root causes securely to server logs while returning only sanitized messages with a unique `correlationId` to the client.
- **Stored XSS & Protocol Defense**: Strict URI schema validation (`http://` / `https://` only) prevents `javascript:` pseudo-protocol injection in problem URLs.
- **Cascading Account Deletion**: Self-service user privacy control (`DELETE /api/users/me`) safely wipes all user attempts, problems, and credentials in a single atomic transaction.

---

## 🛠️ Architecture & Tech Stack

### Backend
- **Framework**: Spring Boot 4.1.1 (Java 21)
- **Security**: Spring Security 6, JJWT (0.12.6), BCrypt Password Encoder
- **Database Access**: Spring Data JPA, Hibernate, PostgreSQL Driver
- **Validation**: Jakarta Bean Validation (`@Valid`, `@Size`, `@NotBlank`, `@Min`, `@Max`)
- **Configuration**: Zero-dependency automatic `.env` loader with fail-fast startup validation (`EnvironmentValidator`)

### Frontend
- **Framework**: React 19.2 (TypeScript)
- **Build Tool**: Vite 8.2
- **State & Data Fetching**: TanStack React Query v5
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v4, Motion Primitives / Framer Motion
- **Icons**: Lucide React, MUI Icons

---

## 📁 Project Structure

```text
dsa-tracker/
├── .env.example                     # Root environment configuration template
├── README.md                        # Project documentation
│
├── backend/                         # Spring Boot 4 API Application
│   ├── src/main/java/com/example/demo/
│   │   ├── config/                  # SecurityConfig, CorsConfig, ApplicationConfig
│   │   ├── controller/              # Auth, Problem, Attempt, Dashboard, Queue controllers
│   │   ├── dto/                     # Request and Response DTOs with Bean Validation
│   │   ├── exception/               # GlobalExceptionHandler with correlation IDs
│   │   ├── model/                   # JPA Entities: User, Problem, Attempt, Topic, MistakeTag
│   │   ├── repository/              # Spring Data JPA repositories
│   │   ├── security/                # JwtService, JwtAuthFilter, RateLimitingFilter, TokenBlacklist
│   │   └── service/                 # Core business logic and Spaced Repetition algorithms
│   ├── src/main/resources/
│   │   └── application.yml          # Production YAML configuration mapping to ENV vars
│   └── pom.xml                      # Maven dependencies and build plugins
│
└── frontend/                        # React 19 + TypeScript + Vite Application
    ├── src/
    │   ├── api/                     # Axios/Fetch client wrapper with auth interceptors
    │   ├── components/              # Navbar, RevisitModal, Heatmap, StatCards, ErrorBoundary
    │   ├── context/                 # AuthContext (token storage, login/logout, profile state)
    │   ├── pages/                   # Dashboard, ProblemList, ProblemForm, Attempts, RevisitQueue
    │   ├── types/                   # TypeScript interfaces (Problem, Attempt, User, Dashboard)
    │   └── utils/                   # Security helpers, URL sanitizers, date formatters
    ├── package.json                 # Node dependencies and scripts
    └── vite.config.ts               # Vite configuration with proxy to backend
```

---

## 🔌 API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user account | No |
| `POST` | `/api/auth/login` | Authenticate credentials and receive JWT | No |
| `POST` | `/api/auth/logout` | Invalidate current JWT and add to server blacklist | Yes |

### Problems (`/api/problems`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/problems` | List user problems (filterable by topic, difficulty, status) | Yes |
| `POST` | `/api/problems` | Create a new problem record with topic tags | Yes |
| `GET` | `/api/problems/{id}` | Retrieve specific problem details and notes | Yes |
| `PUT` | `/api/problems/{id}` | Update problem metadata, status, or notes | Yes |
| `DELETE` | `/api/problems/{id}` | Delete problem and cascading attempts | Yes |

### Attempts & Revisit Queue
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/attempts/problem/{id}` | List historical attempts for a problem | Yes |
| `POST` | `/api/attempts` | Log attempt (time taken, outcome, confidence, mistakes) | Yes |
| `GET` | `/api/revisit-queue` | Get prioritized spaced repetition revision queue | Yes |

### Dashboard & Analytics (`/api/dashboard`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Overall statistics (total solved, streak, difficulty counts) | Yes |
| `GET` | `/api/dashboard/heatmap` | Daily attempt frequency array for the last 365 days | Yes |
| `GET` | `/api/dashboard/topics` | Topic breakdown and mastery metrics | Yes |

### User Profile (`/api/users`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/me` | Retrieve authenticated user profile (email, name, timezone) | Yes |
| `DELETE` | `/api/users/me` | Cascading account deletion (permanently wipes all user data) | Yes |

---

## ⚙️ Environment Configuration

Copy `.env.example` to create your local `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default / Example | Required |
| :--- | :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | Complete JDBC URL (e.g. Supabase pooler) | `jdbc:postgresql://localhost:5432/postgres` | Optional |
| `DB_HOST` | Database server host | `localhost` | If URL omitted |
| `DB_PORT` | Database server port | `5432` | If URL omitted |
| `DB_NAME` | Database database name | `postgres` | If URL omitted |
| `DB_USER` | Database user username | `postgres` | If URL omitted |
| `DB_PASSWORD` | Database password | *None* | **Yes** |
| `JWT_SECRET_KEY` | 256-bit Base64-encoded signing key | *Generate with command below* | **Yes** |
| `JWT_EXPIRATION` | Token TTL in milliseconds | `86400000` (24 hours) | Optional |
| `FRONTEND_URL` | Allowed CORS origin URL | `http://localhost:5173` | Optional |

> **Generate a secure 256-bit Base64 key:**
> ```bash
> openssl rand -base64 32
> ```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Java 21+ JDK** installed and configured in `PATH`
- **Node.js 18+ & npm**
- **PostgreSQL 14+** (local instance, Docker container, or hosted Supabase / Neon)

### 2. Database Setup (Docker Option)
```bash
docker run --name dsa-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 -d postgres
```

### 3. Backend Setup (Spring Boot)
```bash
cd backend

# On Linux / macOS
./mvnw clean spring-boot:run

# On Windows PowerShell
.\mvnw.cmd clean spring-boot:run
```
The REST API will boot at `http://localhost:8080`.

### 4. Frontend Setup (React / Vite)
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🔒 Security Best Practices

- **Never Commit `.env` Files**: Keep `.env` strictly ignored.
- **Rotate Secrets Promptly**: If credentials are ever accidentally exposed, rotate them immediately in your database and auth provider.
- **Frontend Safe Variables**: In Vite, never prefix private keys or database passwords with `VITE_`, as anything with that prefix is exposed in client-side bundles.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
