# Chorizo - Chore Tracking App

## Project Overview
Chorizo is a family chore tracking web application designed primarily for mobile use (iPhone). Kids can mark off completed chores, report screen time, and track instrument practice. Parents can set chore schedules and monitor progress through a dashboard.

## Current Implementation Status

### ✅ Completed Features
1. **Database Schema**
   - `chores` table: Stores chore definitions with kid assignments and days of week
   - `chore_completions` table: Tracks when chores are marked complete
   - Week runs Monday through Sunday

2. **Parent View** (`/parents`)
   - Add new chores with name, description, kid assignment, and day of week
   - View all chores organized by kid
   - Delete chores
   - Add new kid names or select from existing

3. **Kid View** (`/kids`)
   - Shows today's chores plus any overdue from earlier in the week
   - Tap to toggle chore completion
   - Visual indicators: green for complete, red for overdue
   - Progress counter per kid

4. **Home Page**
   - Simple navigation to Kid and Parent views
   - Mobile-optimized design

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

## Development Commands
```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run lint      # Run linter
node init-db.mjs  # Initialize/reset database with sample data
```

## Database Management
- Database URL is stored in `.env.local` (pulled from Vercel)
- Currently using same database for dev and prod (will separate later)
- Schema file: `schema.sql`
- Database utilities: `app/lib/db.ts`

## Project Structure
```
app/
├── page.tsx           # Home page with navigation
├── layout.tsx         # Root layout
├── parents/           # Parent view
│   ├── page.tsx
│   ├── actions.ts     # Server actions
│   ├── chore-list.tsx
│   └── add-chore-form.tsx
├── kids/              # Kid view
│   ├── page.tsx
│   ├── actions.ts
│   └── chore-card.tsx
└── lib/
    └── db.ts          # Database queries and types
```

## Design Principles
1. **Mobile-first**: All UI optimized for iPhone screens
2. **Simple navigation**: Minimal clicks to complete tasks
3. **Visual feedback**: Clear indicators for chore status
4. **No authentication yet**: Single global user for MVP

## Sample Data
- **Kids**: Alex, Sam
- **Chores**: 
  - Alex: Make bed (Mon-Fri), Take out trash (Wed, Sat)
  - Sam: Clean room (Mon, Thu), Feed pet (Tue, Thu, Sat)

## Known Issues/TODOs
- Add authentication system
- Implement screen time tracking
- Add instrument practice logging
- Create weekly reports/summaries
- Add data persistence across weeks
- Implement reward system

## Testing Approach
Manual testing on:
- iPhone Safari
- Desktop Chrome (mobile view)
- Actual device testing recommended

## Deployment
Push to main branch triggers automatic Vercel deployment