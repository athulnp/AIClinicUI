# AI Dental OS — React UI

Multi-tenant frontend for the [Clinic OS API](../AIDentalTool/README.md).

## Features

- **Clinic staff login** — clinic code or clinic ID + username/password
- **Platform admin login** — SuperAdmin (manage clinics, select tenant via sidebar)
- **Dashboard** — patient / appointment / billing counts
- **Patients** — list, search, create, edit, delete
- **Appointments** — book, complete, cancel
- **Doctors** — list profiles, create (link to doctor user)
- **Billing** — invoices, record payments
- **Users** — staff management (Admin)
- **Clinics** — onboard tenants (SuperAdmin)
- **Profile** — update profile and password

## Prerequisites

- Node.js 20+
- API running at `http://localhost:5000` (see `AIDentalTool/ClinicOS.API`)

## Setup

```bash
cd AIDentalUI
npm install
cp .env.example .env
npm run dev
```

Open **http://localhost:5173**

Vite proxies `/api` → `http://localhost:5000` (see `vite.config.ts`).

## Demo logins

| Mode | Credentials |
|------|-------------|
| Clinic | Code `demo-dental` or ID `1`, user `admin`, pass `Admin@123` |
| Platform | user `superadmin`, pass `SuperAdmin@123` (no clinic field) |

SuperAdmin must **select a clinic** in the sidebar before using patients, appointments, etc.

## Build

```bash
npm run build
npm run preview
```

Set `VITE_API_BASE_URL=https://your-api-host` for production if not using the same origin reverse proxy.
