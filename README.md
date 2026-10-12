# VERTEX Platform

A full-stack learning & earning platform built with React + Express + MongoDB.

## Tech Stack

- **Frontend**: React 18, Vite
- **Backend**: Node.js, Express
- **Database**: MongoDB via Mongoose
- **Auth**: JWT, Google OAuth, bcrypt

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/prajwal0426/project_v.git
cd project_v
npm run install:all
```

### 2. Set Up Environment

```bash
cp server/.env.example server/.env
```

Then edit `server/.env` with the MongoDB URI supplied through your team's approved secret-management channel.

### 3. Run Dev Servers

```bash
# Both frontend + backend together:
npm run dev

# OR separately:
npm run dev --prefix server   # backend  → http://localhost:5000
npm run dev --prefix client   # frontend → http://localhost:5173
```

---

## 🗄️ MongoDB Setup

### One-Time Setup (Team Lead Only)

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) → Create free account
2. Click **"Build a Database"** → Choose **M0 Free Tier** → Select region → Create
3. **Database Access**: Create a user (e.g., `vertex_user`) with a strong password
4. **Network Access**: Allow only the specific deployment and developer IP ranges that require access. Do not allow all IP addresses in production.
5. **Connect**: Click Connect → Drivers → Copy the URI

The URI looks like:
```
mongodb+srv://vertex_user:<password>@cluster0.xxxxx.mongodb.net/vertex?retryWrites=true&w=majority
```

6. Store the URI in an approved secret manager. Never commit it or post it in chat, tickets, or source control.

### Each Team Member

1. Open `server/.env`
2. Set `MONGODB_URI` from the approved secret manager
3. Run `npm run dev --prefix server`

---

## 🔑 Environment Variables

### `server/.env`

| Variable | Description |
|---|---|
| `MONGODB_URI` | **Shared Atlas URI** — get from team lead |
| `JWT_SECRET` | Random 64-char string (same for all devs) |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |

## PostgreSQL Recovery Import

The active application uses MongoDB only. PostgreSQL is retained solely as a source for the offline recovery importer; no application route reads it.

1. Back up and keep the PostgreSQL database unchanged.
2. Configure `POSTGRES_MIGRATION_URL` only in a local, uncommitted environment file.
3. Run a read-only count pass first: `npm run migrate:postgres --prefix server`.
4. Review the count report and MongoDB indexes before requesting approval to write data.
5. After explicit approval, run with `MIGRATION_WRITE=true` and `MIGRATION_CONFIRM=I_UNDERSTAND_THIS_WRITES_TO_MONGODB` in the environment.

The importer preserves the source UUID in `legacyPostgresId`, processes rows in bounded batches, and skips orphaned relationships for review rather than inventing references. It never drops, truncates, or writes to PostgreSQL.

## Operational Notes

- User/company passwords remain bcrypt hashes and are excluded from ordinary model reads.
- MongoDB deployment should be a replica set before introducing multi-document financial transactions or a live payout provider.
- Withdrawals use integer paise and conditional wallet updates. The included PayPal service is a sandbox stub, not a verified live payout integration.

### `client/.env`

| Variable | Description |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Same as GOOGLE_CLIENT_ID above |

---

## 📋 API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/user/register` | Register user |
| POST | `/api/auth/user/login` | Login user |
| POST | `/api/auth/company/register` | Register company |
| POST | `/api/auth/company/login` | Login company |
| POST | `/api/auth/admin/login` | Admin login |
| POST | `/api/auth/google` | Google OAuth |
| GET | `/api/dashboard/user` | User dashboard |
| GET | `/api/dashboard/company` | Company dashboard |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/rankings` | Get rankings |
| GET | `/api/wallet` | Get wallet |

---

## 🏗️ Project Structure

```
project_v/
├── client/           # React frontend (Vite)
│   ├── src/
│   │   ├── pages/    # Route pages
│   │   ├── components/
│   │   ├── context/  # Auth & App state
│   │   ├── services/ # API calls
│   │   └── styles/
│   └── .env          # VITE_GOOGLE_CLIENT_ID
├── server/           # Express backend
│   ├── src/
│   │   ├── config/   # db.js (MongoDB)
│   │   ├── models/   # Mongoose schemas
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── services/
│   └── .env          # MONGODB_URI + all secrets
└── package.json      # Root scripts
```
