# Personal Finance Tracker (MERN)

Full stack app: React (Vite) + Node/Express + MongoDB, with JWT authentication.

## Setup

You need Node.js 18+ and MongoDB (local, or a free MongoDB Atlas cluster).

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env     # then edit MONGO_URI and JWT_SECRET
npm run dev              # runs on http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:5000/api
npm run dev              # runs on http://localhost:5173
```

## Features
- **Auth**: signup/login, bcrypt-hashed passwords, JWT, validation
- **Dashboard**: total balance/income/expenses, recent transactions, monthly summary by category, income vs expense bars, budget indicator
- **Transactions**: add, edit, delete, filter by type/category/month, table (cards on mobile), CSV export
- **Budget & Categories**: monthly budget, add/delete categories, spent/remaining, green/amber/red indicator
- Every record belongs to a user and every query is scoped to `req.user`

## API
| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/register | Sign up |
| POST | /api/auth/login | Log in |
| GET | /api/auth/me | Current user |
| GET/POST | /api/transactions | List (filters: type, category, month, search) / create |
| PUT/DELETE | /api/transactions/:id | Update / delete |
| GET/POST | /api/categories | List / create |
| DELETE | /api/categories/:id | Delete |
| GET/PUT | /api/budget?month=YYYY-MM | Get summary / set monthly budget |
| GET | /api/dashboard?month=YYYY-MM | Dashboard data |

## Deployment
- **Database**: MongoDB Atlas, copy the connection string into `MONGO_URI`
- **Backend**: Render or Railway. Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your frontend URL)
- **Frontend**: Vercel or Netlify. Set `VITE_API_URL` to `https://<your-backend>/api`. Add a rewrite of all routes to `/index.html` so React Router works on refresh
