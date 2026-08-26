# VERTEX Platform

A full-stack learning & earning platform built with React + Express + MongoDB.

## Tech Stack

- **Frontend**: React 18, Vite
- **Backend**: Node.js, Express
- **Database**: MongoDB (Atlas — shared cloud DB for all team members)
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

Then edit `server/.env` and fill in the `MONGODB_URI` from your team lead.

### 3. Run Dev Servers

```bash
# Both frontend + backend together:
npm run dev

# OR separately:
npm run dev --prefix server   # backend  → http://localhost:5000
npm run dev --prefix client   # frontend → http://localhost:5173
```

---

## 🗄️ Shared MongoDB Atlas Setup (Team)

All team members share **one** MongoDB Atlas cluster so data is consistent.

### One-Time Setup (Team Lead Only)

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) → Create free account
2. Click **"Build a Database"** → Choose **M0 Free Tier** → Select region → Create
3. **Database Access**: Create a user (e.g., `vertex_user`) with a strong password
4. **Network Access**: Add `0.0.0.0/0` (allow all IPs) for team access
5. **Connect**: Click Connect → Drivers → Copy the URI

The URI looks like:
```
mongodb+srv://vertex_user:<password>@cluster0.xxxxx.mongodb.net/vertex?retryWrites=true&w=majority
```

6. **Share this URI** with all team members via your secure channel (Discord, Notion, etc.)

### Each Team Member

1. Open `server/.env`
2. Replace `MONGODB_URI=...` with the shared Atlas URI
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
