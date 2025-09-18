# Chorizo - Chore Tracking App

## Project Overview
Chorizo is a family chore tracking web application designed primarily for mobile use (iPhone). Kids can mark off completed chores, report screen time, and track instrument practice. Parents can set chore schedules and monitor progress through a dashboard.

## Current Implementation Status

### ✅ Completed Features
1. **Database Schema**
   - `chores` table: Stores unique chore definitions (name, description)
   - `chore_schedules` table: Maps chores to kids and days (one chore can have multiple schedules)
   - `chore_completions` table: Tracks when chores are marked complete with timestamps
   - `tasks` table: One-off tasks with due dates (title, description, kid_name, due_date, completed_at)
   - Week runs Monday through Sunday

2. **User Selection System** (No Login Required)
   - Home page shows buttons for each kid and "Parents" button
   - Device-based persistence using localStorage
   - Automatic redirect to last selected view
   - "Switch User" button available on all views
   - No passwords needed - designed for family devices

3. **Parent View** (`/parents`)
   - **Chores Management:**
     - Add new chores with flexible scheduling
     - Single chore can be assigned to multiple kids on different days
     - Edit existing chores and their complete schedules
     - View all chores with weekly schedule grid
     - Delete chores with confirmation (cascades to schedules and completions)
   - **Tasks Management:**
     - Add one-time tasks with title, description, kid assignment, and due date
     - Edit existing tasks inline
     - View pending tasks sorted by due date
     - View recently completed tasks (past week)
     - Delete tasks with confirmation
     - Visual indicators: Red (overdue), Orange (due soon), Green (completed)
   - Add new kid names or select from existing
   - Forms reset/close properly after submission

4. **Kid View** (`/kids?name=KidName`)
   - **Mixed Display of Chores and Tasks:**
     - Smart ordering:
       1. Uncompleted tasks for today or past (tasks prioritized)
       2. Uncompleted chores for today or past
       3. Upcoming uncompleted tasks (all future)
       4. Upcoming uncompleted chores
       5. All completed items mixed, sorted by completion time
   - **Chores:**
     - Shows entire week's chores
     - Blue background: Today's chores
     - Red background: Overdue chores
     - Gray: Future chores
     - Green: Completed chores
   - **Tasks:**
     - Shows ALL tasks (not limited to current week)
     - Can complete tasks early (before due date)
     - Purple "Task" label to distinguish from chores
     - Red background: Overdue (past due date)
     - Blue background: Due today
     - Orange background: Due soon (1-2 days)
     - Gray: Future tasks
     - Green: Completed
   - Instant updates without page refresh
   - Progress counter shows items to do (today/past only)
   - Congratulations banner when all current items completed
   - Relative time display for completed items

5. **Testing**
   - Comprehensive integration tests for both chores and tasks
   - Tests exercise actual application functions from `app/lib/db.ts`, not raw SQL
   - Each test runs in isolation with a fresh database state (no test interference)
   - Tests cover CRUD operations, completion tracking, priority sorting, kid-specific filtering
   - Tests against remote Neon test database configured via TEST_DATABASE_URL
   - All 13 integration tests pass (7 chore tests, 6 task tests)
   - All features have test coverage

### 🚧 Planned Features
- Screen time reporting
- Instrument practice tracking
- Authentication (separate kid/parent accounts)
- Weekly summary/reporting
- Rewards/points system
- Push notifications for reminders

## Technical Stack
- **Framework**: Next.js 15.5 with App Router and Turbopack
- **Database**: Neon Postgres (serverless)
- **Styling**: Tailwind CSS v4
- **Deployment**: Vercel
- **Language**: TypeScript
- **Package Manager**: npm
- **Node Version**: 18+

## Development Commands
```bash
# Development
npm run dev       # Start development server (with Turbopack)
npm run build     # Build for production
npm start         # Start production server

# Code Quality (IMPORTANT: Run before committing!)
npm run check     # Run all checks (typecheck + lint + format check) - uses wrapper script for proper error handling
npm run typecheck # Check TypeScript types
npm run lint      # Run ESLint
npm run lint:fix  # Run ESLint and auto-fix issues
npm run format    # Format code with Prettier
npm run format:check # Check if code is formatted

# Testing
npm test          # Run integration tests

# Database
node init-db.mjs      # Initialize/reset production database with sample data
```

## Code Quality Tools
- **ESLint**: Configured for Next.js and TypeScript with React rules
- **Prettier**: Auto-formatting with consistent style (2 spaces, 120 line width, double quotes)
- **TypeScript**: Strict mode enabled for type safety
- **Auto-formatting hooks**: Files are automatically formatted on save via PostToolUse hooks

### Prettier Configuration
- **Indentation**: 2 spaces for all file types
- **Line width**: 120 characters
- **Quotes**: Double quotes
- **Semicolons**: Required
- **Trailing commas**: ES5 style
- **Bracket same line**: Yes (JSX brackets on same line as last prop)
- **Arrow parens**: Avoid when possible
- **Tailwind CSS**: Classes automatically sorted

### Linting Configuration
- ESLint v9 with flat config (`eslint.config.mjs`)
- TypeScript strict mode enabled
- React hooks rules enforced
- Prettier integration (ESLint won't conflict with formatting)
- Files excluded: `next-env.d.ts`, `next-dev.d.ts`, init scripts

### Important for Claude
The `npm run check` command is automatically executed via the Stop hook (`scripts/check-wrapper.sh`).
This ensures:
1. TypeScript types are correct (`npm run typecheck`)
2. ESLint rules pass (`npm run lint`)
3. Code is properly formatted (`npm run format:check`)

No need to manually run `npm run check` - it happens automatically!

### Hooks Configuration (for Claude Code CLI)
The project has hooks configured for code quality:
- PostToolUse: `scripts/claude-format-hook.sh` - Auto-formats files and runs linters
  - Prettier for formatting
  - ESLint for TypeScript/JavaScript linting
  - Shellcheck for shell scripts
- Stop hook: Runs `scripts/check-wrapper.sh` to validate the entire codebase with proper error handling

## Database Management
- Database URL is stored in `.env.local` (pulled from Vercel)
- Currently using same database for dev and prod (will separate later)
- Schema file: `schema.sql`
- Database utilities: `app/lib/db.ts`

## Project Structure
```
app/
├── page.tsx           # Home page with kid/parent selection
├── layout.tsx         # Root layout
├── api/               # API endpoints
│   ├── chores/        # Chores endpoints
│   ├── kids/          # Kids data and kid-specific endpoints
│   └── tasks/         # Tasks CRUD endpoints
├── parents/           # Parent view
│   ├── page.tsx       # Parent dashboard
│   ├── actions.ts     # Server actions
│   ├── chore-list.tsx
│   ├── add-chore-form.tsx
│   ├── edit-chore-form.tsx
│   ├── task-list.tsx
│   ├── add-task-form.tsx
│   └── edit-task-form.tsx
├── kids/              # Kid view
│   ├── page.tsx       # Kid's chore/task view
│   ├── actions.ts
│   ├── chore-card.tsx
│   └── task-card.tsx
└── lib/
    └── db.ts          # Database queries and types (chores + tasks)
```

## Design Principles
1. **Mobile-first**: All UI optimized for iPhone screens
2. **Simple navigation**: Minimal clicks to complete tasks
3. **Visual feedback**: Clear indicators for chore status
4. **No authentication yet**: Single global user for MVP

## Sample Data
- **Kids**: Alex, Sam
- **Chores with Schedules**: 
  - **Make bed**: Alex (Mon-Fri)
  - **Take out trash**: Alex (Wed, Sat)
  - **Clean room**: Sam (Mon, Thu)
  - **Feed pet**: Sam (Tue, Thu, Sat)
  - **Do the dishes**: Alternates - Alex (Mon, Wed, Fri, Sun), Sam (Tue, Thu, Sat)
  - **Practice piano**: Both kids (Mon-Fri)
- **Sample Tasks** (from migration):
  - **Pack for trip**: Alex (due in 3 days)
  - **Science project**: Sam (due in 5 days)
  - **Library books**: Alex (due tomorrow)

## Known Issues/TODOs
- Add authentication system
- Implement screen time tracking
- Add instrument practice logging
- Create weekly reports/summaries
- Add data persistence across weeks
- Implement reward system

## Testing Approach

### Database Testing
- **Framework**: TypeScript integration tests (`test.ts`)
- **Test Database**: Separate Neon database configured via TEST_DATABASE_URL in `.env.test`
- **Approach**: Tests actual application functions from `app/lib/db.ts`, not raw SQL
- **Isolation**: Each test runs in a fresh database state (drops/recreates schema)
- **Coverage**: 13 comprehensive tests covering all CRUD operations for both chores and tasks
- **Setup**: Add test database URL to `.env.test` as TEST_DATABASE_URL

### Manual Testing
- iPhone Safari
- Desktop Chrome (mobile view)
- Actual device testing recommended

## Deployment
Push to main branch triggers automatic Vercel deployment