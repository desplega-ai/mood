# Claude Context: Mood Tracker Project

## Project Overview

A Next.js app that tracks startup founder mood via daily email check-ins. Emails are sent twice daily (6 AM & 10 PM), founders reply, and AI categorizes their mood (0-5 scale). Data is visualized on a dashboard.

## Key Architecture Decisions

### Email System

- **Sending**: Gmail SMTP via Nodemailer (from `tarasyaremabcn@gmail.com`)
- **Receiving**: IMAP polling every 5 minutes (searches INBOX for last 24 hours)
- **Entry ID Tracking**: Each email subject includes `[MoodCheck-{entryId}]` for precise database matching
- **Database as Source of Truth**: Only processes emails with pending entries (`respondedAt: null`)

### AI Integration

- **Provider**: OpenRouter with GPT-4o-mini
- **Mood Categorization**: Analyzes email sentiment (0-5 scale)
- **Motivational Quotes**: Generates funny fake quotes from famous people for each email

### Database

- **ORM**: Prisma (client generated to `app/generated/prisma`)
- **Models**: ApiKey → Founder → MoodEntry
- **Entry ID**: Used in email subjects to link replies to specific mood entries

## Common Tasks

### Running the Project

```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm lint             # Check linting
pnpm lint:fix         # Auto-fix lint issues
pnpm format           # Format with Prettier
```

### Database Operations

```bash
pnpm prisma studio                   # Open Prisma Studio
pnpm prisma migrate dev --name init  # Create migration
pnpm prisma generate                 # Generate client
pnpm prisma db seed                  # Seed database
```

### Testing Cron Jobs

```bash
# Morning emails
curl -X GET http://localhost:3002/api/cron/send-morning-emails \
  -H "Authorization: Bearer your_random_secret_here"

# Process replies
curl -X GET http://localhost:3002/api/cron/process-email-replies \
  -H "Authorization: Bearer your_random_secret_here"
```

## Important Files

- **Email Logic**: `lib/gmail.ts` (sending), `lib/imap-client.ts` (receiving)
- **AI Logic**: `lib/ai.ts` (mood categorization, quote generation)
- **Cron Jobs**: `app/api/cron/*` (protected by CRON_SECRET)
- **Database Schema**: `prisma/schema.prisma`

## Environment Variables

Required in `.env`:

- `GMAIL_USER` - Gmail address for sending/receiving
- `GMAIL_APP_PASSWORD` - Gmail app password (NOT regular password)
- `OPENROUTER_API_KEY` - For AI mood categorization
- `CRON_SECRET` - Protects cron endpoints
- `NEXT_PUBLIC_BASE_URL` - Dashboard URL included in emails
- `DATABASE_URL` - PostgreSQL connection string

## Common Issues & Solutions

### Emails Not Processing

- **Check**: Email must be in INBOX (not archived) for up to 5 minutes
- **Verify**: Subject contains `[MoodCheck-{entryId}]`
- **Debug**: Check Vercel logs or run debug route `/api/debug/check-emails`

### Database Issues

- **Prisma Client**: Run `pnpm prisma generate` after schema changes
- **Migrations**: Use `prisma migrate dev` locally, `prisma migrate deploy` in production

### Build Errors

- **Type Errors**: Check Next.js 15 compatibility (params are now Promises)
- **Missing Types**: Install with `pnpm add -D @types/package-name`

## Development Tips

- **Lint Warnings**: Add `// eslint-disable-next-line` if intentional
- **Format Code**: Run `pnpm format` before committing
- **Test Emails**: Use debug routes or manually trigger crons
- **Check Logs**: Vercel dashboard has real-time logs for deployed app

## Deployment Notes

- **Platform**: Vercel (with Vercel Postgres)
- **Migrations**: Auto-run via `vercel-build` script in package.json
- **Cron Jobs**: Configured in `vercel.json` (requires paid plan)
- **Environment**: All env vars must be set in Vercel dashboard
