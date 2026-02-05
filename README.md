# Chorizo

A mobile-first family chore tracker. Kids mark off daily tasks, parents manage schedules and track progress. Built for simplicity - no accounts per kid, just a shared family password.

## Features

- **Schedule-based chores** - Assign recurring chores to kids on specific days
- **One-off tasks** - Create tasks with due dates for individual kids
- **Weekly incentives** - Kids earn screen time or $5 by completing their week
- **Flexible vs fixed chores** - Fixed must be done on the scheduled day, flexible anytime that week
- **Parent dashboard** - See all kids' progress at a glance, excuse missed items
- **Kid feedback** - Kids can send suggestions directly to parents
- **Device-based user selection** - Each device remembers who uses it

## Tech Stack

Next.js 16 · Neon Postgres · Tailwind CSS · Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- [Neon](https://neon.tech) database
- [Vercel](https://vercel.com) account

### Local Development

1. Clone and install:
   ```bash
   git clone https://github.com/lmarburger/chorizo.git
   cd chorizo
   npm install
   ```

2. Set up environment variables:
   ```bash
   npm i -g vercel
   vercel login
   vercel link
   vercel env pull .env.local
   ```

   Or create `.env.local` manually:
   ```
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   ```

3. Initialize the database:
   ```bash
   npm run migrate
   ```

4. Set up authentication:
   ```bash
   node scripts/setup-password.mjs
   ```
   Add the output (`FAMILY_PASSWORD_HASH_B64` and `JWT_SECRET`) to `.env.local` and Vercel environment variables.

5. Start the dev server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Push to `main` to auto-deploy to Vercel. Ensure your Vercel project has the required environment variables:
- `DATABASE_URL` - Neon connection string
- `FAMILY_PASSWORD_HASH_B64` - From setup script
- `JWT_SECRET` - From setup script

## Usage

**First visit**: Enter the family password. The database starts empty, so go to "Parents" to add your first kid and some chores.

**Parents** (`/parents`): Add kids, create recurring chores and one-off tasks, manage the weekly schedule, and review kid feedback.

**Kids** (`/kids`): See today's chores and tasks, tap to mark complete. Complete everything Mon-Fri to claim a reward.

## Development

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run check     # TypeScript + ESLint + Prettier
npm test          # Run tests
npm run migrate   # Apply database migrations
```

## License

MIT
