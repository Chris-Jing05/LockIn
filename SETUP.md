# 🚀 Quick Setup Guide

## Option 1: Full Local Setup (15 minutes)

### Step 1: Install PostgreSQL

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb lockin
```

**Linux:**
```bash
sudo apt-get install postgresql
sudo service postgresql start
sudo -u postgres createdb lockin
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### Step 2: Setup Web App

```bash
cd web-app

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
DATABASE_URL="postgresql://localhost:5432/lockin?schema=public"
JWT_SECRET="change-this-to-a-random-secure-string"
OPENAI_API_KEY="your-openai-api-key"
YOUTUBE_API_KEY=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOF

# Setup database
npx prisma generate
npx prisma migrate dev --name init

# Start server
npm run dev
```

### Step 3: Build Chrome Extension

```bash
cd ../extension
npm install
npm run build
```

### Step 4: Load Extension

1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/dist` folder

### Step 5: Test It Out

1. Go to `http://localhost:3000`
2. Register an account
3. Copy your sync token from dashboard
4. Open extension popup
5. Paste sync token and click "Connect"
6. Try visiting `reddit.com` - it should be blocked!

---

## Option 2: Cloud Database (Easier)

Use Supabase for free PostgreSQL:

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Create a new project
3. Wait for database to provision
4. Go to Settings > Database
5. Copy the connection string

### Step 2: Update Web App

```bash
cd web-app
npm install

# Update .env with Supabase connection string
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres"
```

Then follow steps 2-5 from Option 1.

---

## 🔑 Getting API Keys

### OpenAI API Key (Required for AI features)

1. Go to https://platform.openai.com
2. Sign up or log in
3. Go to API Keys section
4. Create new key
5. Copy and add to `.env`

**Cost:** ~$0.0001 per classification (very cheap!)

### YouTube Data API (Optional)

1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Copy and add to `.env`

**Note:** YouTube API is optional. The extension uses page metadata by default.

---

## 🧪 Testing the Setup

### Test Web App

```bash
cd web-app
npm run dev
# Visit http://localhost:3000
# Register and login
```

### Test Extension

1. Load extension in Chrome
2. Visit a site like `instagram.com`
3. Should be blocked if in default blacklist
4. Check popup - should show blocked count

### Test YouTube AI Filtering

1. Make sure OpenAI API key is set
2. Visit a YouTube entertainment video
3. After 1-2 seconds, should see overlay if classified as entertainment
4. Try an educational video - should play normally

### Test Sync

1. Add a site to blacklist in web dashboard
2. Wait 30 seconds
3. Check extension popup - should show updated list

---

## 🐛 Common Issues

### "Cannot connect to database"
- Make sure PostgreSQL is running
- Check DATABASE_URL in .env
- Try: `psql lockin` to test connection

### "Extension not blocking sites"
- Check Focus Mode is enabled in popup
- Verify sites are in blacklist
- Check extension console (Inspect popup)

### "OpenAI API error"
- Verify API key is correct
- Check you have credits: https://platform.openai.com/usage
- Review error in browser console

### "Sync not working"
- Make sure web app is running on port 3000
- Check sync token matches in both places
- Wait 30 seconds for next sync

---

## 📦 What Gets Created

After setup, you'll have:

```
LockIn/
├── web-app/
│   ├── node_modules/       # Dependencies
│   ├── prisma/
│   │   └── migrations/     # Database migrations
│   ├── .env                # Your secrets (gitignored)
│   └── .next/              # Build output
│
└── extension/
    ├── node_modules/       # Dependencies
    └── dist/               # Built extension (load this in Chrome)
```

---

## 🎯 Next Steps

1. **Customize your lists**: Add your own sites to whitelist/blacklist
2. **Set up schedules**: Configure focus hours in the web app
3. **Monitor analytics**: Check your productivity stats daily
4. **Test AI classification**: Try different YouTube videos

---

## 💡 Development Tips

### Hot Reload for Extension

```bash
cd extension
npm run dev  # Watches for changes
# Reload extension in Chrome after changes
```

### Database GUI

```bash
cd web-app
npx prisma studio  # Opens visual database editor at localhost:5555
```

### View API Logs

```bash
cd web-app
npm run dev
# Check terminal for API request logs
```

---

## 🚀 You're All Set!

Your LockIn productivity app is now running locally. Start blocking distractions and staying focused!

**Need help?** Check the main README.md or open an issue on GitHub.
