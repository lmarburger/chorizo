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
```bash
# Pull from Vercel (if linked)
vercel env pull .env.local

# Or create .env.local manually with:
DATABASE_URL=your_neon_database_url_here
```

4. Initialize the database:
```bash
node init-db.mjs
```
This creates the necessary tables and adds sample data.

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
npm run dev       # Start development server
npm run build     # Build for production
npm run lint      # Run linter
```

## Deployment

The app auto-deploys to Vercel when you push to the main branch.

## Contributing

This is a personal family project, but feel free to fork and adapt for your own use!

## License

MIT

## Support

For questions or issues, please open a GitHub issue.