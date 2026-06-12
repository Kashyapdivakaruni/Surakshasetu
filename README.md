# Suraksha Setu

**"Life-Saving Response Bridge"**

Suraksha Setu is a smart accident emergency response platform using secure vehicle QR codes. It connects Citizens, EMS/Ambulance personnel, Hospitals, Police, and emergency contacts through a single digital emergency workflow.

## Privacy-First QR Design
Suraksha Setu solves the primary risk of public medical data leaks. 
- The QR contains **no personal or medical data**.
- It holds only a secure URL token.
- If an unauthorized civilian scans the QR, they only see a protected access page.
- Authorized EMS and Police access the records strictly behind a role-based login portal.

## Key Features
1. **Secure QR Generation**: Citizen dashboard to manage profile and generate QR.
2. **EMS Command**: QR scanning, victim identification, and vitals logging.
3. **Hospital Pre-Arrival Alert**: Hospitals receive live case data and ETA.
4. **Mock Tracking**: Live ambulance tracking via animated map for the family.
5. **Role-Based Access Control**: Strict data silos. Police cannot see medical data; public scanning the QR sees nothing.
6. **No Paid APIs Required**: Uses CSS-based animations for tracking to avoid paid external maps.

## Tech Stack
- **Frontend**: Next.js (App Router), React, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Next.js Route Handlers
- **Database / ORM**: Prisma with PostgreSQL (Production) / SQLite (Local)
- **Authentication**: JWT / Cookies with `bcryptjs`

## Local Setup (Development)

The project uses SQLite for local development so you can run it instantly without setting up a Postgres server.

```bash
# 1. Install dependencies
npm install

# 2. Setup Environment Variables
# Copy .env.example to .env
cp .env.example .env

# 3. Apply Prisma migrations and generate client
npm run prisma:migrate

# 4. Seed the database with test users
npm run seed

# 5. Start the development server
npm run dev
```

### Local Test Credentials
The seed script generates 4 test users (all with password: `password123`):
- `citizen@demo.com`
- `ems@demo.com`
- `hospital@demo.com`
- `police@demo.com`

## Production Deployment on Vercel

Suraksha Setu is fully database-backed and designed to be deployed with a **PostgreSQL** database on Vercel. 

1. Create a PostgreSQL database using providers like **Neon**, **Supabase**, **Railway**, or **Vercel Postgres**.
2. Get your connection string (e.g., `postgresql://user:password@host/db?sslmode=require`).
3. Push this repository to GitHub and import it to Vercel.
4. In the Vercel Environment Variables, configure:
   - `DATABASE_URL` = `"postgresql://..."`
   - `JWT_SECRET` = `"your_strong_random_secret_here"`
   - `APP_URL` = `"https://your-deployment-url.vercel.app"`
   - `NEXT_PUBLIC_APP_NAME` = `"Suraksha Setu"`
5. **IMPORTANT:** Go to Vercel Settings > General > Build & Development Settings and ensure the Build Command includes the DB migration:
   - `npx prisma generate && npx prisma migrate deploy && next build`
6. Deploy!

*(Note: In-memory storage is completely disabled; real users, QR codes, and cases will persist in your PostgreSQL database.)*

## LiveKit Video Consultation Configuration

To enable real-time video consultation between EMS Paramedics and Hospital Doctors, you need a LiveKit account (a free-tier project is available at [LiveKit Cloud](https://livekit.io/cloud)).

### 1. Environment Variables Configuration
Ensure the following variables are configured:
- `LIVEKIT_API_KEY`: Your LiveKit Project API Key.
- `LIVEKIT_API_SECRET`: Your LiveKit Project API Secret.
- `LIVEKIT_URL`: The WebSocket host address (e.g. `wss://your-project.livekit.cloud`).
- `NEXT_PUBLIC_LIVEKIT_URL`: Same as `LIVEKIT_URL` (publicly accessible by the WebRTC client in the browser).

### 2. Local Testing
Copy the keys to your `.env` file. You can start the dev server and test calls by accepting a case on the hospital portal and clicking **Start Video Consultation**.

