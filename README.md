# 🔒 LockIn - Productivity Blocker

A full-stack web app + Chrome extension that helps users stay productive by blocking distracting and entertainment-based websites while allowing access to educational resources.

## 🌟 Features

- **Smart Website Blocking**: Block distracting sites (Instagram, TikTok, Reddit, Netflix) automatically
- **Educational Content Allow-listing**: Allow educational sites like Stack Overflow, GitHub, Coursera, Khan Academy
- **YouTube Smart Filtering**: AI-powered classification of YouTube videos as educational or entertainment
- **Real-time Sync**: Settings sync between Chrome extension and web dashboard every 30 seconds
- **Analytics Dashboard**: Track blocked sites, productivity streaks, and usage statistics
- **Focus Mode**: Toggle focus mode on/off based on your schedule
- **Gamification**: Daily streaks and productivity rewards

## 🛠 Tech Stack

### Frontend
- **Next.js 16** (App Router)
- **React** with TypeScript
- **TailwindCSS** for styling

### Backend
- **Next.js API Routes**
- **PostgreSQL** database
- **Prisma ORM** for database management

### Chrome Extension
- **Manifest V3**
- **React** + TypeScript for popup UI
- **Background Service Worker** for blocking logic
- **Content Scripts** for YouTube filtering

### AI/APIs
- **OpenAI API** (GPT-4o-mini) for content classification
- **YouTube Data API** (optional, for enhanced metadata)

## 📁 Project Structure

```
LockIn/
├── web-app/                 # Next.js web dashboard
│   ├── app/
│   │   ├── (auth)/         # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/    # Dashboard pages
│   │   │   └── dashboard/
│   │   ├── api/            # API routes
│   │   │   ├── auth/       # Auth endpoints
│   │   │   ├── preferences/
│   │   │   ├── analytics/
│   │   │   ├── classify/   # AI classification
│   │   │   └── sync/       # Extension sync
│   │   └── page.tsx
│   ├── lib/
│   │   ├── prisma.ts       # Prisma client
│   │   └── auth.ts         # JWT auth utilities
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
│
└── extension/              # Chrome extension
    ├── src/
    │   ├── background/     # Service worker
    │   ├── content/        # Content scripts
    │   └── popup/          # React popup UI
    ├── public/
    │   ├── manifest.json
    │   ├── popup.html
    │   └── blocked.html
    └── package.json
```

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** database
- **OpenAI API Key** (for AI classification)
- **Chrome browser** (for extension testing)

### 1. Database Setup

1. Install PostgreSQL locally or use a cloud provider (Supabase, Railway, etc.)

2. Create a database:
```bash
createdb lockin
```

3. Update the `DATABASE_URL` in `web-app/.env`

### 2. Web App Setup

```bash
cd web-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL, JWT secret, and API keys

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Start development server
npm run dev
```

The web app will be available at `http://localhost:3000`

### 3. Chrome Extension Setup

```bash
cd extension

# Install dependencies
npm install

# Build extension
npm run build
```

### 4. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension/dist` folder
5. The LockIn extension should now be installed

## 🔐 Environment Variables

Create a `.env` file in the `web-app` directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lockin?schema=public"

# JWT Secret (generate a random string)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# OpenAI API Key (for AI classification)
OPENAI_API_KEY="sk-your-openai-api-key-here"

# YouTube Data API Key (optional)
YOUTUBE_API_KEY="your-youtube-api-key-here"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 📝 Usage Guide

### Getting Started

1. **Register an Account**
   - Go to `http://localhost:3000`
   - Click "Sign up" and create an account
   - You'll be redirected to the dashboard

2. **Get Your Sync Token**
   - On the dashboard, scroll to "Extension Sync Token"
   - Copy the token displayed

3. **Connect Chrome Extension**
   - Click the LockIn extension icon in Chrome
   - Paste your sync token
   - Click "Connect"

4. **Customize Settings**
   - Add sites to whitelist (allowed sites)
   - Add sites to blacklist (blocked sites)
   - Toggle Focus Mode on/off
   - Settings sync automatically between extension and dashboard

### How It Works

#### Website Blocking
- When you visit a blacklisted site, you'll be redirected to a blocked page
- Whitelisted sites are always accessible
- Focus Mode can be toggled on/off from the extension popup

#### YouTube Smart Filtering
- When you watch a YouTube video, the extension analyzes it
- Uses AI to determine if it's educational or entertainment
- Entertainment videos are blocked with an overlay
- Educational videos play normally
- Classification results are cached for 7 days

#### Analytics
- View blocked site statistics on the dashboard
- Track your productivity streak
- See weekly and daily analytics

## 🗄 Database Schema

### User
- id, email, password (hashed), name
- Related: preferences, activity logs, streaks

### UserPreferences
- Focus mode enabled/disabled
- Whitelist and blacklist arrays
- Sync token for extension
- Focus schedule (optional)

### ActivityLog
- Tracks every blocked/allowed site visit
- Used for analytics and statistics

### Streak
- Current streak and longest streak
- Updated when sites are blocked

### ContentClassification
- AI classification results for URLs
- Caches classifications for 7 days
- Stores confidence scores

## 🔧 Development

### Web App Development
```bash
cd web-app
npm run dev     # Start dev server
npx prisma studio  # Open database GUI
```

### Extension Development
```bash
cd extension
npm run dev     # Watch mode for development
npm run build   # Production build
```

### Database Migrations
```bash
cd web-app
npx prisma migrate dev --name migration_name
npx prisma generate
```

## 🚢 Deployment

### Deploy Web App to Vercel

1. Push your code to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

Update `NEXT_PUBLIC_APP_URL` in extension to your production URL.

### Deploy Database

Use Railway, Supabase, or any PostgreSQL provider:
- Create a PostgreSQL instance
- Copy the connection string
- Update `DATABASE_URL` in your deployment

### Publish Chrome Extension

1. Build production version: `npm run build`
2. Zip the `dist` folder
3. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
4. Upload the zip file
5. Fill in store listing details
6. Submit for review

## 🎯 Key API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/me` - Get current user

### Preferences
- `GET /api/preferences` - Get user preferences
- `POST /api/preferences` - Update preferences

### Analytics
- `GET /api/analytics?period=week` - Get statistics
- `POST /api/analytics` - Log activity

### AI Classification
- `POST /api/classify` - Classify content as educational/entertainment

### Extension Sync
- `GET /api/sync?token=xxx` - Sync extension settings

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📜 License

MIT License - feel free to use this project for learning or production!

## 🐛 Troubleshooting

### Extension not blocking sites
- Check that Focus Mode is enabled
- Verify sites are in the blacklist
- Check browser console for errors

### Sync not working
- Verify sync token is correct
- Check that web app is running
- Look for network errors in extension console

### AI classification not working
- Verify OpenAI API key is set
- Check API quota/credits
- Review server logs for errors

### Database connection errors
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Run `npx prisma migrate dev`

## 📧 Support

For issues or questions, please open an issue on GitHub.

## 🎉 Acknowledgments

Built with:
- Next.js, React, TailwindCSS
- Prisma, PostgreSQL
- OpenAI GPT-4o-mini
- Chrome Extension Manifest V3

---

**Made with productivity in mind. Stay focused with LockIn!** 🔒
# LockIn
