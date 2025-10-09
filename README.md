# Mood Tracker

A Next.js application to track founder mood during their startup journey. Sends daily mood check emails (morning and afternoon) and visualizes mood trends over time.

## Features

- **API Token Authentication**: Secure access to company-specific mood data
- **Founder Management**: Add/remove founders who will receive mood check emails
- **Automated Emails**: Sends mood check emails at 6 AM and 10 PM via Gmail
- **AI-Powered Sentiment Analysis**: Uses OpenRouter (GPT-4o-mini) to categorize mood responses (0-5 scale)
- **Interactive Dashboard**: View mood trends with All, Weekly, or Monthly views
- **Real-time Updates**: Dashboard auto-refreshes every 30 seconds
- **Click to View Replies**: Click on any entry to see the exact email response
- **Beautiful Visualizations**: Chart mood data over time with Recharts

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Email (Send)**: Gmail SMTP via Nodemailer
- **Email (Receive)**: Gmail IMAP polling
- **AI**: OpenRouter with Vercel AI SDK (GPT-4o-mini with low reasoning)
- **Deployment**: Vercel (with Vercel Postgres)

## Setup Instructions

### 1. Clone and Install

```bash
pnpm install
```

### 2. Set Up Gmail

#### Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Factor Authentication if not already enabled

#### Create App Password
1. Go to https://myaccount.google.com/apppasswords
2. Create a new app password for "Mail"
3. Save the 16-character password (format: `xxxx xxxx xxxx xxxx`)

#### Enable IMAP
1. Go to Gmail Settings → Forwarding and POP/IMAP
2. Enable IMAP access

### 3. Set Up Database

Create a `.env` file based on `.env.example`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mood"

# Gmail credentials
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your 16 char app password"

# OpenRouter for AI mood categorization
OPENROUTER_API_KEY="sk-or-your_api_key_here"

# Cron secret for securing cron endpoints
CRON_SECRET="your_random_secret_here"

# Base URL
NEXT_PUBLIC_BASE_URL="http://localhost:3002"
```

Run database migrations:

```bash
pnpm prisma migrate dev --name init
```

Generate Prisma client:

```bash
pnpm prisma generate
```

### 4. Seed Initial Data

Run the seed script to create an initial API key and founder:

```bash
pnpm prisma db seed
```

This creates:
- **API Token**: `desplega-dev-token-12345`
- **Company**: desplega.ai
- **Founder**: Taras (t@desplega.ai)

You can edit `prisma/seed.ts` to customize these values.

### 5. Configure OpenRouter

1. Sign up at [OpenRouter](https://openrouter.ai)
2. Get your API key
3. Add it to your `.env` file as `OPENROUTER_API_KEY`

### 6. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3002` and enter your API token (`desplega-dev-token-12345`).

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Configure environment variables in Vercel dashboard:
   - `DATABASE_URL` - (will be auto-filled after creating Vercel Postgres)
   - `GMAIL_USER` - Your Gmail address
   - `GMAIL_APP_PASSWORD` - Your Gmail app password
   - `OPENROUTER_API_KEY` - Your OpenRouter API key
   - `CRON_SECRET` - A random secret string (e.g., use `openssl rand -hex 32`)
   - `NEXT_PUBLIC_BASE_URL` - Your Vercel deployment URL
4. Deploy

### 3. Set Up Vercel Postgres

1. In your Vercel project, go to **Storage** tab
2. Create a new **Postgres** database
3. The `DATABASE_URL` will be automatically added to your environment variables
4. Run migrations from your local machine:

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Pull environment variables
vercel env pull .env.production

# Run migrations
DATABASE_URL="<your-vercel-postgres-url>" pnpm prisma migrate deploy
```

Or use Vercel's built-in migration on deploy by adding to `package.json`:

```json
"scripts": {
  "postbuild": "prisma migrate deploy"
}
```

### 4. Seed Production Database

After migrations, seed your production database:

```bash
# Using Vercel Postgres connection string
DATABASE_URL="<your-vercel-postgres-url>" pnpm prisma db seed
```

Or create API keys manually using Prisma Studio:

```bash
DATABASE_URL="<your-vercel-postgres-url>" pnpm prisma studio
```

### 5. Configure Cron Jobs

The cron jobs are pre-configured in `vercel.json`:

- **Morning emails**: 6:00 AM (UTC) - `0 6 * * *`
- **Afternoon emails**: 10:00 PM (UTC) - `0 22 * * *`
- **Process email replies**: Every 5 minutes - `*/5 * * * *`

**Note**: Adjust the cron schedule in `vercel.json` if you need different timezones.

Make sure `CRON_SECRET` is set in your Vercel environment variables.

### 6. Test the Deployment

1. Visit your Vercel URL
2. Enter your API token
3. Add founders in the configuration page
4. Manually trigger cron jobs to test:

```bash
# Test morning email
curl -X GET https://your-app.vercel.app/api/cron/send-morning-emails \
  -H "Authorization: Bearer your_cron_secret"

# Test email processing
curl -X GET https://your-app.vercel.app/api/cron/process-email-replies \
  -H "Authorization: Bearer your_cron_secret"
```

## Usage

### Initial Setup

1. **Access Dashboard**: Visit the app and enter your API token
2. **Configure Founders**:
   - Click "Configure Founders"
   - Add founder name and email address
   - Founders will automatically start receiving mood check emails

### Daily Workflow

1. **Automated Emails**: Founders receive emails at 6 AM and 10 PM asking about their mood
2. **Reply to Emails**: Founders simply reply to the email with how they're feeling
3. **AI Processing**: Every 5 minutes, the system:
   - Checks for new email replies via Gmail IMAP
   - Analyzes sentiment using GPT-4o-mini
   - Categorizes mood on a 0-5 scale
   - Stores the exact response text
4. **View Dashboard**:
   - Auto-refreshes every 30 seconds
   - Click on any entry to see the exact email reply
   - Filter by All, Weekly, or Monthly views
   - See average mood and trends over time

### Email Format

Founders receive simple, plain-text emails:

**Morning** (6 AM):
```
Hi [Name],

How are you feeling today?

Just reply to this email with how you're doing.
```

**Afternoon** (10 PM):
```
Hi [Name],

How was your day?

Just reply to this email with how you're doing.
```

### Dashboard Features

- **Auto-refresh**: Data updates every 30 seconds
- **Clickable entries**: Click any mood entry to see the exact email reply
- **Period filters**: View All, Weekly, or Monthly data
- **Statistics**: Total responses, average mood, pending responses
- **Interactive chart**: Hover over points to see details
- **Mood colors**: Visual color coding from red (terrible) to green (excellent)

## Mood Scale

- **0 - Terrible**: Very negative, depressed, hopeless
- **1 - Bad**: Negative, frustrated, struggling
- **2 - Meh**: Neutral-negative, uninspired
- **3 - Okay**: Neutral-positive, stable
- **4 - Good**: Positive, motivated, making progress
- **5 - Excellent**: Very positive, energized, thriving

## API Routes

### Authentication
- `POST /api/auth/validate` - Validate API token

### Founders Management
- `GET /api/founders` - Get all founders (requires auth)
- `POST /api/founders` - Create a founder (requires auth)
- `DELETE /api/founders/[id]` - Delete a founder (requires auth)
- `PATCH /api/founders/[id]` - Update a founder (requires auth)

### Mood Data
- `GET /api/mood?period=all|weekly|monthly` - Get mood entries (requires auth)

### Cron Jobs (Protected by CRON_SECRET)
- `GET /api/cron/send-morning-emails` - Send morning emails to all founders
- `GET /api/cron/send-afternoon-emails` - Send afternoon emails to all founders
- `GET /api/cron/process-email-replies` - Poll Gmail IMAP and process replies

### Testing
- `POST /api/test/process-mood` - Manually process a mood entry (dev only)

### Debugging
- `GET /api/debug/check-emails` - Check Gmail for unread emails (dev only)

## Database Schema

### ApiKey
- `id`: Unique identifier
- `token`: API token for authentication
- `companyName`: Company name
- `founders`: Related founders

### Founder
- `id`: Unique identifier
- `name`: Founder name
- `email`: Founder email (unique)
- `apiKeyId`: Reference to API key
- `moodEntries`: Related mood entries

### MoodEntry
- `id`: Unique identifier
- `founderId`: Reference to founder
- `mood`: Mood score (0-5)
- `timeOfDay`: "morning" or "afternoon"
- `emailSentAt`: When email was sent
- `respondedAt`: When founder responded
- `rawResponse`: Original email response text

## Troubleshooting

### Emails Not Being Sent

1. Check Gmail credentials in `.env`:
   ```bash
   # Verify GMAIL_USER and GMAIL_APP_PASSWORD are set correctly
   ```
2. Ensure Gmail IMAP is enabled in Gmail settings
3. Check if 2FA is enabled on your Google account
4. Verify the app password is correct (16 characters, no spaces)

### Email Replies Not Being Processed

1. Check if Gmail automatically archives emails - IMAP searches `[Gmail]/All Mail`
2. Verify email subject contains `[MoodCheck]` tag
3. Check dev server logs for IMAP connection errors
4. Manually trigger the processing:
   ```bash
   curl -X GET http://localhost:3002/api/cron/process-email-replies \
     -H "Authorization: Bearer your_random_secret_here"
   ```

### Dashboard Not Showing Data

1. Check if period filter is set correctly (use "All" to see everything)
2. Verify API token is valid
3. Check browser console for errors
4. Ensure database has mood entries:
   ```bash
   pnpm prisma studio
   ```

### Cron Jobs Not Running on Vercel

1. Verify `vercel.json` is in the project root
2. Check `CRON_SECRET` is set in Vercel environment variables
3. View cron logs in Vercel dashboard
4. Ensure your Vercel plan supports cron jobs

## Architecture Notes

- **Email Processing**: Uses Gmail IMAP to poll for replies instead of webhooks (works with auto-archiving)
- **AI Categorization**: Uses GPT-4o-mini with low reasoning effort for fast, cost-effective analysis
- **Database**: Prisma generates client to `app/generated/prisma` to avoid conflicts
- **Mood Storage**: Stores both the AI-categorized score (0-5) AND the exact email text
- **Auto-refresh**: Dashboard uses `setInterval` to fetch new data every 30 seconds

## License

MIT
