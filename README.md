# Chorizo - Family Chore Tracker

A simple, mobile-first web app for tracking family chores, screen time, and instrument practice. Built with Next.js, Vercel, and Neon Postgres.

## Features

### Current
- **Device-Based User Selection** (No Login Required):
  - "Who's this?" prompt with kid names and grey Parents button
  - Selection persists on device via localStorage
  - Back arrow icon for quick user switching
  - No passwords or usernames to remember
  
- **Parent Dashboard**:
  - Centered "Parents" title with back arrow
  - Feedback from kids shown at top (yellow highlighted when unread)
  - Combined view of all kids' outstanding items
  - Kids sorted alphabetically, completed kids shown last
  - Green border for kids with no outstanding work (clean, minimal design)
  - Shows upcoming task count when kids are caught up
  - Click green box to expand and view/edit upcoming tasks
  - Click any task to edit inline (title, description, due date, delete)
  - Auto-refresh pauses during editing
  - Completed feedback section at bottom for reference
  
- **Schedule-Based Chore Management**:
  - Single chore can be assigned to multiple kids on different days
  - **Fixed vs Flexible chores**: Fixed (🔒) must be done on scheduled day, flexible can be done any day
  - Visual weekly schedule grid sorted alphabetically
  - Kids sorted alphabetically in edit forms
  - Icon-based controls (edit/delete) for cleaner UI

- **Weekly Incentive System**:
  - Kids earn rewards by completing all chores and tasks Mon-Fri
  - Choose between 1 hour of screen time (Sat/Sun) OR $5
  - **Fixed chores**: Must be done on the exact scheduled day
  - **Flexible chores**: Can be done any day during the week (default)
  - **Excuse mechanism**: Parents can excuse missed items (counts as done)
  - Qualification status shown on parent dashboard (green/red borders)
  - Kids see reward claim banner when qualified
  
- **One-Off Tasks**:
  - "Add One-Time Task" heading inside form box
  - Create specific tasks with due dates (non-recurring)
  - Inline editing directly from parent dashboard
  - Tasks and chores combined in unified display
  - Always-expanded form for quick task creation
  
- **Unified Kids View**: 
  - Header shows just kid's name (e.g., "Penny")
  - Chores and tasks look identical (no visual distinction)
  - Day label aligned with title on same line
  - Description spans full width below title
  - No status labels - color coding tells the story
  - Stable, consistent sorting across all views
  - Feedback button (speech bubble) for sending ideas to parents
  
- **Simplified Visual System**:
  - Red: Overdue items
  - Blue: Today's items  
  - Gray: Future items
  - Green: Completed items
  - No orange "due soon" state - cleaner, simpler
  
- **Icon-Based UI**:
  - Back arrow for navigation
  - Gear icon for settings
  - X icon for removing items
  - Trash icon for deleting
  - Pencil icon for editing
  - Speech bubble for feedback
  
- **Feedback System**: 
  - Personal prompt: "Got an idea or suggestion? Tell me!"
  - Kids can send feedback/ideas directly to parents
  - Parents see feedback prominently at top of dashboard
  - Mark feedback as read/unread, delete when done
  - Completed feedback archived at bottom for reference
  
- **Simple Check-off System**: Tap to mark items complete/incomplete with instant updates
- **Multi-kid Support**: Track chores and tasks for multiple children
- **Mobile-Optimized**: Designed for iPhone use

### Coming Soon
- Screen time reporting
- Instrument practice tracking
- Weekly summaries and reports

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

**For existing databases:** If upgrading from a previous version, run the migration script:
```bash
node migrate-incentives.mjs
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Usage

### User Selection
When you first open the app, you'll see "Who's this?":
- Tap your name if you're a kid
- Tap the grey "Parents" button if you're a parent
- The app remembers your selection on this device
- Use the back arrow icon to switch users anytime

### For Parents
Navigate to `/parents` to:
- See centered "Parents" heading
- Review feedback from kids at top of page (yellow when unread)
- View dashboard showing each kid's outstanding chores and tasks
- See qualification status at a glance (green=qualified, red=disqualified, normal=in progress)
- See claimed rewards displayed as badges next to kid names
- Excuse overdue chores/tasks directly from dashboard
- Click green box to expand and see upcoming tasks (if any exist)
- Click any task in dashboard to edit inline
- Create recurring chores with Fixed/Flexible toggle ("Add Chore" heading)
- Add one-off tasks ("Add One-Time Task" heading in form)
- View chore schedule with 🔒 indicator for fixed chores
- Use icon buttons for all actions (edit, delete, remove)
- Access completed feedback archive at bottom
- Access settings via gear icon at bottom

### For Kids
Navigate to `/kids` to:
- See your name at the top (e.g., "Penny")
- View unified list of chores and tasks (visually identical)
- See day label next to title on same line
- Read full-width descriptions below titles
- Identify status by color alone (red=overdue, blue=today, gray=future)
- Get personal congratulations when all current work is complete
- **Claim weekly reward** when qualified (choose screen time or $5)
- Send feedback to parents via speech bubble button
- Navigate back with arrow icon

## Project Structure

```
app/
├── page.tsx              # User selection screen
├── parents/              # Parent management views
│   ├── page.tsx
│   ├── dashboard.tsx     # Kids status with qualification
│   ├── kid-status-items.tsx # Items with excuse button
│   ├── chore-list.tsx    # Schedule with fixed indicator
│   └── add-task-form.tsx # Task creation form
├── kids/                 # Kid views
│   ├── page.tsx
│   ├── kids-client.tsx   # Incentive claim UI
│   ├── chore-card.tsx    # Unified card for chores
│   └── task-card.tsx     # Unified card for tasks
├── api/                  # API endpoints
│   ├── kids/             # Get kid data + qualification
│   ├── tasks/            # Task CRUD operations
│   ├── chores/           # Chore operations
│   ├── excuse/           # Excuse chores/tasks
│   ├── incentive-claims/ # Claim rewards
│   └── dashboard/        # Parent dashboard data
└── lib/
    ├── db.ts             # Database queries and types
    └── sorting.ts        # Unified sorting logic
```

## Database Schema

- **chores**: Chore definitions (name, description, flexible)
- **chore_schedules**: Maps chores to kids and days (chore_id, kid_name, day_of_week)
- **chore_completions**: Tracks completions (chore_schedule_id, completed_date, completed_at, excused)
- **tasks**: One-off tasks (title, description, kid_name, due_date, completed_at, excused_at)
- **feedback**: Kid feedback/suggestions (kid_name, message, completed_at, created_at)
- **incentive_claims**: Weekly reward claims (kid_name, week_start_date, reward_type, claimed_at)

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

# Testing
npm test             # Run integration tests for chores and tasks

# Database
node init-db.mjs     # Initialize/reset database with sample data
```

### Code Quality

This project uses automated code quality tools:
- **TypeScript**: Strict type checking
- **ESLint**: Code quality and consistency rules
- **Prettier**: Automatic code formatting (2 spaces, double quotes)

Run `npm run check` before committing to ensure code quality.

### Testing

The project includes comprehensive integration tests that exercise the actual application code:

1. Create a test database in Neon
2. Add the connection string to `.env.test` as `TEST_DATABASE_URL`
3. Run `npm test` to execute the integration tests

**Test Features:**
- **True Integration Testing**: Tests use actual application functions from `app/lib/db.ts`, not raw SQL
- **Test Isolation**: Each test runs in a fresh database state to prevent test interference
- **Comprehensive Coverage**: 27 integration tests + 17 unit tests covering chores, tasks, sorting, qualification, and incentive system
- **Automatic Database Reset**: Tests automatically reset the database schema between runs (no sample data included)
- **Organized Structure**: Tests live in `tests/` with shared helpers
- **Smart DB Selection**: `app/lib/db.ts` automatically uses TEST_DATABASE_URL when available

## Deployment

The app auto-deploys to Vercel when you push to the main branch.

## Contributing

This is a personal family project, but feel free to fork and adapt for your own use!

## License

MIT

## Support

For questions or issues, please open a GitHub issue.
