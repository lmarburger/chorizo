# Chorizo Maintenance Guide

Quick reference for maintaining this service. Read this when you come back after months away.

## First Steps When Returning

```bash
# 1. Check if production is working
npm run health-check

# 2. Check for pending dependency updates
# Look at GitHub for Dependabot PRs

# 3. If you need to make changes, verify local setup
npm install
npm test
```

## Dependency Updates

Dependabot creates PRs weekly for npm updates. To handle them:

1. Go to GitHub and review open Dependabot PRs
2. CI runs automatically on each PR - check if tests pass
3. Merge PRs that pass CI (minor/patch updates are grouped together)
4. For major version updates, review changelog before merging

If you want to update manually:
```bash
npm outdated          # See what's outdated
npm update            # Update to latest within semver range
npm install pkg@x.y.z # Update specific package
```

## Common Issues

### Production is down or broken

1. Check Vercel dashboard: https://vercel.com/dashboard
2. Look at deployment logs for errors
3. Check if recent commits broke something (CI should catch this)
4. Rollback to previous deployment if needed (Vercel dashboard)

### Database issues

1. Check Neon dashboard: https://console.neon.tech
2. Verify DATABASE_URL is correct in Vercel env vars
3. Run migrations if schema is out of sync:
   ```bash
   npm run migrate
   ```

### Tests failing

```bash
npm test              # Run all tests
```

Tests require TEST_DATABASE_URL in `.env.test`. If the test database is gone:
1. Create new Neon database for testing
2. Update TEST_DATABASE_URL in `.env.test`
3. Update GitHub secret `TEST_DATABASE_URL`

### CI failing on GitHub

1. Check the failed workflow run for error details
2. Most common issues:
   - Type errors: `npm run typecheck`
   - Lint errors: `npm run lint:fix`
   - Format errors: `npm run format`
   - Test failures: `npm test`

## Key Links

- **Production**: https://chorizo-eight.vercel.app
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Neon Database**: https://console.neon.tech
- **GitHub Repo**: Check your GitHub for the repo

## Database Migrations

Create a new migration when changing the schema:
```bash
npm run migrate:create -- descriptive-name
# Edit the new file in migrations/
npm run migrate  # Apply to dev/prod
```

For production-only migration:
```bash
npm run migrate -- --envPath .env.prod
```

## Code Quality Commands

```bash
npm run check        # Run ALL checks (typecheck + lint + format + tests)
npm run typecheck    # TypeScript only
npm run lint         # ESLint only
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier format all files
npm run format:check # Check formatting without changing
```

## Architecture Quick Reference

- **Framework**: Next.js 15+ with App Router
- **Database**: Neon Postgres (serverless)
- **Styling**: Tailwind CSS v4
- **Deployment**: Vercel (auto-deploys on push to main)
- **Tests**: Integration and unit tests in `tests/` directory

Key files:
- `app/lib/db.ts` - All database queries
- `app/lib/sorting.ts` - Chore/task sorting logic
- `tests/integration.test.ts` - Database integration tests
- `tests/qualification.test.ts` - Unit tests for qualification logic
- `CLAUDE.md` - Detailed project documentation
