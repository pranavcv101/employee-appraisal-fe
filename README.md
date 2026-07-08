# Appraisal Management — Frontend

React + TypeScript frontend for the employee appraisal platform. Supports company admin, HR, and employee portals with role-based sign-in.

## Stack

- **React 18** · **TypeScript** · **Vite**
- **React Router** · **Axios**
- Structured client logging (`src/utils/logger.ts`)

## Features

- **Role-based sign-in**: Company owner, HR, or Employee
- **Admin dashboard**: Manage HR accounts and employees
- **HR dashboard**: Add employees, create appraisal cycles, assign participants, proceed reviews, schedule meetings
- **Employee portal**: Self-appraisal, lead reviews, IDP meetings (sidebar navigation)

## Quick start (Docker)

From the project root (parent folder with `docker-compose.yml`):

```bash
docker compose up --build
```

App: http://localhost:5173

## Local development

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:8000` if the API is not on the default.

## Sign-in routes

| Route | Role |
|-------|------|
| `/signin` | Choose portal type |
| `/signin/admin` | Company owner |
| `/signin/hr` | HR |
| `/signin/employee` | Employee |
| `/signup` | Register new company (admin) |

## Dev login

Use password `mmmm` for any account during local development (backend dev bypass).

## Project layout

```
src/
├── api/            # Axios client and API modules
├── components/     # Shared and feature components
├── context/        # Auth context
├── pages/          # Route pages
├── utils/          # Logger, auth routing helpers
└── App.tsx         # Routes and protected routes
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 5173) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Related repo

Backend: [employee-appraisal-be](https://github.com/pranavcv101/employee-appraisal-be)
