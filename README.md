# Chorizo - Family Chore Tracker

A simple, mobile-first web app for tracking family chores, screen time, and instrument practice. Built with Next.js, Vercel, and Neon Postgres.

## Features

### Current
- **Chore Management**: Parents can create and assign chores for specific days of the week
- **Daily Chore View**: Kids see today's chores plus any incomplete chores from earlier in the week
- **Simple Check-off System**: Tap to mark chores complete/incomplete
- **Visual Status Indicators**: Green for complete, red for overdue chores
- **Multi-kid Support**: Track chores for multiple children

### Coming Soon
- Screen time reporting
- Instrument practice tracking
- User authentication
- Weekly summaries and reports
- Reward/points system

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Neon database account
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chorizo.git
cd chorizo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

First, install and configure Vercel CLI:
```bash
npm i -g vercel
vercel login
vercel link
```

Then pull environment variables:
```bash
vercel env pull .env.local
```

Or create `.env.local` manually with:
```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

4. Initialize the database:
```bash
node init-db.mjs
```
This creates the necessary tables and adds sample data (Alex and Sam with example chores).

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Usage

### For Parents
Navigate to `/parents` to:
- Add new chores with specific days and kid assignments
- View all scheduled chores organized by child
- Delete chores

### For Kids
Navigate to `/kids` to:
- See all chores due today
- View overdue chores from earlier in the week
- Tap chores to mark them complete

## Project Structure

```
app/
├── page.tsx           # Home navigation
├── parents/           # Parent management views
├── kids/             # Kid chore views
└── lib/
    └── db.ts         # Database queries
```

## Database Schema

- **chores**: Stores chore definitions (name, description, kid_name, day_of_week)
- **chore_completions**: Tracks when chores are completed (chore_id, completed_date)

## Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Database**: [Neon Postgres](https://neon.tech/) (serverless)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Hosting**: [Vercel](https://vercel.com/)
- **Language**: TypeScript

## Development

```bash
# Development
npm run dev          # Start development server (with Turbopack)
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run check        # Run all checks (type + lint + format)
npm run typecheck    # Check TypeScript types
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format code with Prettier
npm run format:check # Check formatting

# Database
node init-db.mjs     # Initialize/reset database with sample data
```

### Code Quality

This project uses automated code quality tools:
- **TypeScript**: Strict type checking
- **ESLint**: Code quality and consistency rules
- **Prettier**: Automatic code formatting (2 spaces, double quotes)

Run `npm run check` before committing to ensure code quality.

## Deployment

The app auto-deploys to Vercel when you push to the main branch.

## Contributing

This is a personal family project, but feel free to fork and adapt for your own use!

## License

MIT

## Support

For questions or issues, please open a GitHub issue.