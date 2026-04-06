# Visitor Management System

A production-ready, QR-based visitor registration web application built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui.

## Architecture Choice

**Next.js Full-Stack (App Router)** was chosen over Next.js + FastAPI because:

- **Single deployment** — no CORS config, no separate backend server
- **Server-side rendering** for fast page loads
- **API routes** co-located with the frontend for maintainability
- **Prisma ORM** handles database operations elegantly in the same runtime
- For this scope (visitor management), a separate Python backend adds deployment complexity without significant benefit

## Features

- QR code-based visitor registration flow
- First-time visitor multi-step form with photo capture
- Existing user OTP-based login with profile autofill
- Admin dashboard with KPI cards, search, filters, and CSV export
- Email notifications (registration, check-in, admin alerts)
- Camera capture and photo upload
- Responsive design (mobile, tablet, desktop)
- Dark mode support

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: SQLite (via Prisma) — easily switchable to PostgreSQL
- **Auth**: JWT-based admin auth, OTP-based visitor auth
- **Email**: Nodemailer (configurable SMTP)
- **Forms**: React Hook Form + Zod validation

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your settings (defaults work for local dev)

# 3. Run database migrations
npx prisma migrate dev

# 4. Seed the database with sample data
npm run db:seed

# 5. Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

### Demo Credentials

| Role    | Email              | Password   |
|---------|--------------------|------------|
| Admin   | admin@visitor.com  | admin123   |

Sample visitor emails for OTP login: `rahul.sharma@example.com`, `priya.patel@example.com`

> **Note**: In development, the OTP code is returned in the API response for easy testing. Check the browser console or network tab.

## Pages

| URL | Description |
|-----|-------------|
| `/visit` | Public visitor registration page (QR landing) |
| `/visit/success` | Registration/check-in success page |
| `/admin/login` | Admin login |
| `/admin/dashboard` | Admin dashboard with stats |
| `/admin/visitors` | Visitor list with search/filters |
| `/admin/visitors/[id]` | Visitor detail page |

## QR Code Integration

The QR code should point to your deployed URL's `/visit` path:

```
https://yourdomain.com/visit
```

To generate a QR code:

1. **Online**: Use any QR generator (e.g., qr-code-generator.com) with your URL
2. **CLI**: 
   ```bash
   npx qrcode -o qr.png "http://localhost:3000/visit"
   ```
3. **Programmatic**: The `qrcode` npm package is included in dependencies

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/visitors` | Register new visitor |
| POST | `/api/otp/send` | Send OTP to visitor email |
| POST | `/api/otp/verify` | Verify OTP and get profile |
| POST | `/api/visits` | Submit new visit (existing user) |
| POST | `/api/upload` | Upload visitor photo |

### Admin (requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/admin/login` | Admin login |
| POST | `/api/auth/admin/logout` | Admin logout |
| GET | `/api/auth/admin/me` | Get current admin |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/visitors` | List visitors (paginated, filterable) |
| GET | `/api/visitors/[id]` | Get visitor details |
| GET | `/api/visitors/export` | Export visitors as CSV |
| PATCH | `/api/visits/check-in` | Check in a visitor |
| PATCH | `/api/visits/check-out` | Check out a visitor |

## Database Schema

```
VisitorProfile    VisitRecord        AdminUser
├── id            ├── id             ├── id
├── title         ├── visitorId      ├── name
├── firstName     ├── purpose        ├── email
├── lastName      ├── company        ├── passwordHash
├── email (unique)├── personToVisit  ├── role
├── mobile        ├── tagNumber      └── createdAt
├── address       ├── idProof
├── photoUrl      ├── gadgetInfo     OtpCode
├── createdAt     ├── entryTime      ├── id
└── lastLoginAt   ├── checkInTime    ├── visitorId
                  ├── checkOutTime   ├── code
                  ├── status         ├── expiresAt
                  └── createdAt      └── used

                  EmailLog
                  ├── id, to, subject, body, status, createdAt
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `JWT_SECRET` | Secret for admin JWT tokens | (required) |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP username/email | (optional) |
| `EMAIL_PASS` | SMTP password/app password | (optional) |
| `ADMIN_EMAIL` | Admin notification email | (optional) |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `http://localhost:3000` |

## Switching to PostgreSQL

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/visitor_management"
   ```
3. Run migrations:
   ```bash
   npx prisma migrate dev --name switch-to-postgres
   ```

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run db:seed      # Seed database
npm run db:migrate   # Run migrations
npm run db:reset     # Reset DB and re-seed
```

## Project Structure

```
src/
├── app/
│   ├── visit/           # Public visitor pages
│   ├── admin/           # Admin dashboard pages
│   └── api/             # API routes
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── photo-capture.tsx
│   ├── visitor-form-steps.tsx
│   └── dashboard-stats.tsx
└── lib/
    ├── prisma.ts        # Database client
    ├── auth.ts          # JWT & OTP utilities
    ├── email.ts         # Email sending
    ├── validations.ts   # Zod schemas
    └── utils.ts         # Tailwind utilities
```

## Future Improvements

- Real SMS-based OTP delivery
- Visitor badge printing
- Real-time dashboard updates (WebSocket)
- Multi-tenant support
- Visitor analytics charts
- Bulk import/export
- Audit logging
- Two-factor admin auth
- Visitor pre-registration by host
- Integration with access control systems
