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
   - `feedback` table: Kid feedback/suggestions (kid_name, message, completed_at, created_at)
   - Week runs Monday through Sunday

2. **User Selection System** (No Login Required)
   - Home page shows buttons for each kid and grey "Parents" button
   - "Who's this?" prompt using personal voice
   - Device-based persistence using localStorage
   - Automatic redirect to last selected view
   - Back arrow icon for user switching (no text)
   - No passwords needed - designed for family devices

3. **Parent View** (`/parents`)
   - **Header:**
     - Centered "Parents" title
     - Back arrow icon for user switching
   - **Feedback Section (Top):**
     - Yellow highlighted feedback from kids requiring attention
     - Mark as read/delete options for each feedback item
     - Shows kid name, timestamp, and message
   - **Dashboard:**
     - Combined view of all kids' outstanding chores and tasks
     - Kids sorted alphabetically, with completed kids shown last
     - Green border for kids with no outstanding items (no "All Done" text)
     - Shows upcoming task count badge when kids are caught up and have future tasks
     - Click entire green box to expand and show upcoming tasks (when they exist)
     - Click on any task to edit inline (rename, change description/date, delete)
     - Auto-refresh pauses during task editing
   - **Chore Management:**
     - View all chores in "Schedule" section sorted alphabetically
     - Icon-based edit/delete buttons (no text labels)
     - Single chore can be assigned to multiple kids on different days
     - Edit existing chores and their complete schedules (kids sorted alphabetically)
     - Delete chores with confirmation (cascades to schedules and completions)
   - **Task Management:**
     - "Add One-Time Task" heading inside form box
     - Form always expanded for quick access
     - Tasks shown in dashboard, no separate task list
     - Inline editing directly from dashboard
   - **Completed Feedback (Bottom):**
     - Shows previously read feedback for reference
     - Subtle styling with gray background
     - Can mark as unread or delete
   - **UI Elements:**
     - Back arrow icon for navigation (no text labels)
     - Settings gear icon at bottom
     - All forms expanded by default with headings inside boxes
     - Icon buttons throughout (X for remove, trash for delete, pencil for edit)
     - "Add Chore" heading also inside form box

4. **Kid View** (`/kids?name=KidName`)
   - **Header:**
     - Shows just kid's name (e.g., "Penny" not "Penny's Chores")
     - Back arrow and feedback icons
   - **Unified Display:**
     - Chores and tasks look identical (no visual distinction)
     - Day label aligned horizontally with title
     - Description takes full width below title
     - No status labels - color coding tells the story
     - Smart ordering:
       1. Uncompleted tasks for today or past (tasks prioritized)
       2. Uncompleted chores for today or past
       3. Upcoming uncompleted tasks (all future)
       4. Upcoming uncompleted chores
       5. All completed items mixed, sorted by completion time
   - **Color Scheme (simplified):**
     - Red background: Overdue (past due)
     - Blue background: Due today
     - Gray background: Future items
     - Green background: Completed items
   - **UI Elements:**
     - Back arrow icon for navigation
     - Speech bubble icon for feedback (top-right)
     - Clean cards with checkbox on left
     - Title and day label on same line
     - Description spans full width below
     - No relative time shown (removed for cleaner look)
   - **Feedback Feature:**
     - Speech bubble button in header opens feedback form
     - Personal prompt: "Got an idea or suggestion? Tell me!"
     - Simple textarea for kids to send messages
     - Messages appear instantly in parent dashboard
   - **Features:**
     - Instant updates without page refresh
     - Congratulations banner with personal message when done
     - Empty state: "No chores or tasks scheduled yet. I'll add some soon!"
     - Can complete tasks early (before due date)

5. **Testing**
   - Comprehensive integration tests for both chores and tasks
   - Tests exercise actual application functions from `app/lib/db.ts`, not raw SQL
   - Each test runs in isolation with a fresh database state (no test interference)
   - Tests cover CRUD operations, completion tracking, priority sorting, kid-specific filtering
   - Tests against remote Neon test database configured via TEST_DATABASE_URL
   - All 13 integration tests pass (7 chore tests, 6 task tests)
   - Single test file `test.ts` for simplicity
   - Database automatically uses TEST_DATABASE_URL when available for test isolation

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

## Code Style

- **Comments**: Avoid obvious comments. Only add comments for:
  - Complex algorithms that aren't immediately clear
  - Important business logic decisions
  - Workarounds or hacks that need explanation
  - Never comment what the code does (e.g., "// Fetch data", "// Add button")
  - Never use divider comments for sections (e.g., "/* Settings */")
  - Let component names, function names, and JSX structure self-document

## Copy & Tone

- **Voice**: Use first-person voice as if the parent is speaking directly to their kids
  - ✅ "Who's this?" instead of ❌ "Who are you?"
  - ✅ "Tell me!" instead of ❌ "Let your parents know!"
  - ✅ "I'll add some soon!" instead of ❌ "Ask a parent to add some!"
- **Tone**: Casual, friendly, and personal - like a parent talking to their kids
- **Avoid**: Third-party or formal language that sounds like an app talking
- **Examples**:
  - Feedback prompt: "Got an idea or suggestion? Tell me!"
  - Completion message: "You're all done for today! Go relax or get ahead on tomorrow if you want."
  - Empty state: "No chores or tasks scheduled yet. I'll add some soon!"

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
- Files excluded: `next-env.d.ts`, `next-dev.d.ts`, `init-db.mjs`, `test.ts`

### Important for Claude
The `npm run check` command is automatically executed via the Stop hook (`scripts/check-wrapper.sh`).
This ensures:
1. TypeScript types are correct (`npm run typecheck`)
2. ESLint rules pass (`npm run lint`)
3. Code is properly formatted (`npm run format:check`)

No need to manually run `npm run check` - it happens automatically!

**CRITICAL: Documentation Updates**
When making any behavioral changes or adding features:
1. **Always update CLAUDE.md** to reflect implementation changes
2. **Always update README.md** for user-facing features
3. Do this proactively without being asked
4. Update documentation in the same session as code changes
5. Keep feature lists, technical details, and project structure current

**CRITICAL: Test Updates Required**
- When adding new features or changing existing behavior, ALWAYS update the tests accordingly
- Tests must keep pace with application changes to maintain code quality
- Run `npm test` after making changes to ensure tests still pass
- Add new test cases for new functionality
- Update existing tests if behavior changes
- Tests are in `test.ts` and test the core database functions in `app/lib/db.ts`

### Hooks Configuration (for Claude Code CLI)
The project has hooks configured for code quality:
- PostToolUse: `scripts/claude-format-hook.sh` - Auto-formats files and runs linters
  - Prettier for formatting
  - ESLint for TypeScript/JavaScript linting (properly handles non-zero exit codes)
  - Shellcheck for shell scripts
  - Reports linting errors to stderr for visibility
- Stop hook: Runs `scripts/check-wrapper.sh` to validate the entire codebase with proper error handling

## Database Management
- Database URL is stored in `.env.local` (pulled from Vercel)
- Test database URL in `.env.test` as `TEST_DATABASE_URL`
- `app/lib/db.ts` automatically uses TEST_DATABASE_URL when available (for test isolation)
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
│   ├── tasks/         # Tasks CRUD endpoints
│   └── feedback/      # Feedback CRUD endpoints
├── parents/           # Parent view
│   ├── page.tsx       # Parent dashboard
│   ├── dashboard.tsx  # Kids status overview
│   ├── feedback-section.tsx # Feedback display component
│   ├── actions.ts     # Server actions
│   ├── chore-list.tsx # Chore schedule display
│   ├── add-chore-form.tsx
│   ├── edit-chore-form.tsx
│   └── add-task-form.tsx
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
