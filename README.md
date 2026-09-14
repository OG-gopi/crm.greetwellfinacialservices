# Greetwell Financial Services - Management Portal

A COMPLETE, production-style, end-to-end Financial Services Management Portal built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, **Node.js**, **Express**, **Prisma ORM**, **SQLite/PostgreSQL**, and **JWT Role-Based Access Control (RBAC)**.

---

## 🚀 Key Features & Architecture

- **Full-Stack Connectivity**: Connected Frontend + Backend + Database + Authentication + RBAC + Notifications + Audit Logs + File Management.
- **Unified Vercel Single-Project Architecture**: Single Vercel project serving static Vite frontend (`https://<domain>/`) and Vercel Serverless Function Express API (`https://<domain>/api/*`) with zero cross-domain CORS overhead.
- **Granular RBAC System**:
  - `SUPER_ADMIN`: Full system access, agent creation/invitation, application assignment, verification center, CMS products, audit logs, global settings.
  - `LOAN_AGENT`: Scoped strictly to assigned customers, loan applications, documents, follow-up tasks, notes/messages.
  - `INSURANCE_AGENT`: Scoped strictly to assigned customers, insurance policies, documents, follow-up tasks, notes/messages.
  - `INVESTMENT_AGENT`: Scoped strictly to assigned customers, investment applications, investment products, documents, follow-up tasks.
  - `CUSTOMER`: Create applications, upload verification documents, respond to requirements, view customer-visible notes.
- **Agent Invitation & Role Enforcement**: Super Admin invites agents with pre-assigned roles. Agents activate password via secure invitation tokens. Roles cannot be self-selected or changed by agents.
- **Role-Compatible Application Assignment**: Applications are created by customers (`LOAN`, `INSURANCE`, `INVESTMENT`). Super Admin assigns compatible agents (e.g. Loan applications can only be assigned to Loan Agents).
- **Document Management & Data Verification Center**: File upload abstraction, document verification (`VERIFIED`, `REJECTED`, `REPLACEMENT_REQUIRED`), and audit logging.
- **Notification & Audit System**: Real-time notifications for status changes, assignments, uploads, and immutable audit trail.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router DOM v6, Axios.
- **Backend**: Node.js, Express.js, TypeScript, JWT (jsonwebtoken), bcryptjs, Multer, Nodemailer.
- **Database**: Prisma ORM with SQLite (`dev.db` zero-config local storage, PostgreSQL schema ready).
- **Testing**: Vitest & Supertest API/RBAC test suite.

---

## 🔑 Default Development Credentials

| Role | Email | Password | Allowed Dashboards & Modules |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@greetwell.com` | `Admin@123456` | Full Control (`/admin/*`) |
| **Loan Agent** | `loan.agent@greetwell.com` | `Agent@123456` | Loan Portal (`/loan-agent/*`) |
| **Insurance Agent** | `insurance.agent@greetwell.com` | `Agent@123456` | Insurance Portal (`/insurance-agent/*`) |
| **Investment Agent**| `investment.agent@greetwell.com` | `Agent@123456` | Investment Portal (`/investment-agent/*`) |
| **Customer** | `john.doe@example.com` | `Customer@123456` | Customer Portal (`/customer/*`) |

---

## ⚡ Quick Start Guide

### Prerequisites
- Node.js v18+ and npm v9+

### 1. Database Setup & Seeding
```bash
cd backend
npm install
npm run db:push
npm run db:seed
```

### 2. Run Automated API & RBAC Test Suite
```bash
cd backend
npm test
```

### 3. Start Backend API Server
```bash
cd backend
npm run dev
# Server starts at http://localhost:5000/api
```

### 4. Start Frontend Client Application
```bash
cd frontend
npm install
npm run dev
# Application runs at http://localhost:3000
```

---

## 📡 Core API Summary

- `POST /api/auth/login` - Authenticate user & issue JWT
- `POST /api/auth/register` - Customer self-registration
- `GET /api/auth/invite/:token` - Verify invitation token
- `POST /api/auth/invite/:token/accept` - Setup password & activate account
- `GET /api/users` - User directory (RBAC filtered)
- `POST /api/users/create-agent` - Super Admin creates/invites agent
- `GET /api/applications` - List applications (Role scoped)
- `POST /api/applications` - Submit application (`LOAN`, `INSURANCE`, `INVESTMENT`)
- `PUT /api/applications/:id/assign` - Super Admin assigns compatible agent
- `PUT /api/applications/:id/status` - Transition status workflow
- `POST /api/documents/upload` - Upload document file
- `PUT /api/documents/:id/verify` - Verify/Reject document
- `GET /api/audit-logs` - System audit log trail
- `GET /api/dashboard/stats` - Role-specific metrics & statistics
