# VERTEX

VERTEX is a futuristic learning and earning platform built with React, Express, and PostgreSQL.

## Stack

- Frontend: React, JSX, CSS, Vite
- Backend: Node.js, Express.js
- Database: PostgreSQL
- Auth: JWT, bcrypt password hashing, role-based access control
- Payments: PayPal service adapter scaffold

## Run Locally

```bash
npm run install:all
cp server/.env.example server/.env
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000/api/health`

# in termenal 

for frontend : 'cd client'
                 'npm run dev'

for backend  : ' npm run dev --prefix server '

# for postgresesql 
  & "C:\Program Files\PostgreSQL\13\bin\psql.exe" -h localhost -p 5433 -U postgresDocuments\OneDrive\Desktop\project_v>

  not :- psql 13 is based  in your system 


## Database

Create a PostgreSQL database, set `DATABASE_URL` in `server/.env`, then run the SQL in:

```bash
server/config/schema.sql
```

## Notes

The app includes production-ready structure, sample data-driven UI, security middleware, protected routes, monthly ranking cron, wallet conversion logic, ID upload handling, and PayPal integration placeholders. Replace placeholder PayPal calls and Apple OAuth client values with real production credentials before launch.
