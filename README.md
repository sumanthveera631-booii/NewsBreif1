# NewsBrief 5.0 - Decoupled Architecture

**Premium AI Current Affairs Learning Companion** — A gamified, decoupled full-stack application with an independent Express backend and Vite+React frontend. Competitive exam aspirants (UPSC, Banking, SSC) read briefings in under 15 seconds, complete interactive active-recall quizzes, and master systematic revision schedules powered by live RSS scraping and Gemini 2.5 Flash Lite AI.

---

## 🏗️ Architecture Overview

NewsBrief 5.0 is built as a **decoupled microservice architecture**:

- **Backend (`/backend`)**: Express.js server with Passport.js authentication, MongoDB, live RSS scraping, and Gemini AI integration
- **Frontend (`/frontend`)**: Vite+React SPA with react-router-dom, Tailwind CSS v4, and responsive multi-column layouts

### Why Decoupled?

✅ **Security**: API keys (GEMINI_API_KEY, MONGODB_URI, etc.) never exposed to frontend  
✅ **Scalability**: Backend can scale independently; frontend is static-friendly  
✅ **Independent Deployment**: Deploy frontend to Vercel, backend to Heroku/Railway/etc.  
✅ **Flexibility**: Easy to add mobile app (React Native) consuming the same backend API

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB Atlas + Mongoose ODM
- **Authentication**: Passport.js (Google OAuth 2.0 + Local Email/Password)
- **Sessions**: express-session with connect-mongo store
- **AI**: Google Gemini 2.5 Flash Lite API
- **Scraping**: rss-parser + cheerio for article extraction
- **Scheduling**: node-cron for daily 1 AM pipeline
- **Email**: Resend API for admin digests
- **Validation**: Zod

### Frontend
- **Framework**: React 19 + Vite
- **Routing**: react-router-dom v6
- **Styling**: Tailwind CSS v4, custom design tokens, glassmorphism
- **State**: Zustand (persisted)
- **Auth Context**: Custom React Context (replaces next-auth)
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

---

## 📂 Project Structure

```
NewsBrief/
├── backend/
│   ├── config/
│   │   ├── db.js                    # MongoDB connection pooling
│   │   └── passport.js              # Passport.js strategies (Google + Local)
│   ├── models/
│   │   ├── User.js                  # User (email, password hash, exam pref, etc.)
│   │   ├── Article.js               # Article (title, summaries, MCQs, imageUrl)
│   │   ├── QuizAttempt.js           # Quiz attempt logs
│   │   └── RevisionQueue.js         # Spaced repetition scheduler
│   ├── middleware/
│   │   └── auth.js                  # ensureAuthenticated, ensureAdmin guards
│   ├── routes/
│   │   ├── auth.js                  # POST /auth/login, /auth/register, GET /auth/google, /auth/me, /auth/logout
│   │   ├── articles.js              # GET /articles, /articles/:id
│   │   ├── quiz.js                  # GET /quiz/questions, POST /quiz/attempt
│   │   ├── user.js                  # GET /user/profile, PUT /user/preference, POST /user/bookmark, /user/onboard
│   │   ├── revision.js              # GET /revision, POST /revision/schedule, /revision/complete
│   │   ├── ai.js                    # POST /ai/explain
│   │   └── admin.js                 # GET /admin/metrics
│   ├── services/
│   │   ├── scraper.js               # Live RSS → Gemini → MongoDB pipeline
│   │   └── ai.js                    # askGemini wrapper (SDK + REST fallback)
│   ├── cron/
│   │   └── pipelineCron.js          # Scheduled 1 AM daily ingest via node-cron
│   ├── server.js                    # Express app initialization + middleware + route mounting
│   ├── .env                         # ⚠️ SECRETS (added to .gitignore)
│   └── package.json
│
├── frontend/
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── assets/
│   │   │   └── index.css            # All design tokens, glassmorphism, neo-skeuomorphism, animations
│   │   ├── components/
│   │   │   ├── TopBar.jsx           # Header with streak, XP, profile
│   │   │   ├── BottomNav.jsx        # Mobile bottom navigation (hidden on lg:)
│   │   │   ├── DesktopSidebar.jsx   # Left sidebar for lg: breakpoint
│   │   │   ├── RightPanel.jsx       # Right sidebar (stats, bookmarks, revisions)
│   │   │   ├── AppLayout.jsx        # Shared wrapper (responsive grid layout)
│   │   │   ├── NewsCard.jsx         # Card with imageUrl banner
│   │   │   ├── AIDrawer.jsx         # AI explainer slide panel
│   │   │   └── WatchDemoModal.jsx   # Onboarding product demo
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # useAuth() hook, session management
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx      # High-conversion landing
│   │   │   ├── LoginPage.jsx        # Google OAuth + email/password
│   │   │   ├── OnboardingPage.jsx   # Setup wizard (exam, level, goal)
│   │   │   ├── DashboardPage.jsx    # Main feed, article list
│   │   │   ├── ArticlePage.jsx      # Kindle-like reader, AI drawer
│   │   │   ├── QuizPage.jsx         # Gamified MCQ (2-phase: select → evaluate)
│   │   │   ├── RevisionPage.jsx     # Spaced repetition queue
│   │   │   ├── SearchPage.jsx       # Advanced search filters
│   │   │   ├── ProfilePage.jsx      # Achievements, bookmarks, history
│   │   │   └── AdminPage.jsx        # System metrics, pipeline trigger
│   │   ├── store/
│   │   │   └── appStore.js          # Zustand store (exam pref, bookmarks, profile)
│   │   ├── App.jsx                  # React Router route definitions
│   │   ├── main.jsx                 # Vite entry point
│   │   └── index.css                # Imported in main.jsx
│   ├── index.html
│   ├── vite.config.js               # Vite + React plugin + TailwindCSS v4
│   └── package.json
│
├── .gitignore                       # Ignores backend/.env, frontend/node_modules, etc.
└── README.md                        # (this file)
```

---

## ⚙️ Environment Setup

### Backend
Create `backend/.env`:
```env
# MongoDB
MONGODB_URI="mongodb+srv://user:pass@cluster0.mongodb.net/newsbrief?retryWrites=true&w=majority"

# Authentication
SESSION_SECRET="your-random-session-secret-32-chars-min"
NEXTAUTH_SECRET="your-jwt-secret"

# Google OAuth
GOOGLE_CLIENT_ID="123456789.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-YourSecretKey"

# Gemini AI
GEMINI_API_KEY="AIzaSyDxxx..."

# Resend (Email)
RESEND_API_KEY="re_xxx..."

# Admin
ADMIN_EMAIL="admin@yourdomain.com"

# Cron
CRON_SECRET="your-cron-authorization-bearer-token"

# Frontend URL (for OAuth callback and CORS)
CLIENT_URL="http://localhost:5173"

# Server port
PORT=5000
```

### Frontend
Create `frontend/.env`:
```env
VITE_API_URL="http://localhost:5000"
```

---

## 🚀 Installation & Running

### Backend Setup
```bash
cd backend
npm install
npm run dev                 # Starts on http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev                 # Starts on http://localhost:5173
```

The frontend dev server is configured to proxy `/api` calls to `http://localhost:5000` (see `vite.config.js`).

---

## 📡 API Endpoints

All endpoints require authentication (except `/auth/login`, `/auth/register`, `/auth/google/callback`).

### Authentication (`/api/auth`)
- `GET /auth/google` — Redirect to Google OAuth
- `GET /auth/google/callback` — OAuth callback (handled by Passport)
- `POST /auth/login` — Local email/password login
- `POST /auth/register` — Register new user with email/password
- `GET /auth/me` — Get current session user
- `POST /auth/logout` — Destroy session

### Articles (`/api/articles`)
- `GET /articles?exam=UPSC&date=today&search=keyword` — Article feed with filters
- `GET /articles/:id` — Single article details

### Quiz (`/api/quiz`)
- `GET /quiz/questions?exam=UPSC` — Get 5 random MCQs from last 7 days
- `POST /quiz/attempt` — Log quiz completion, award XP & streaks

### User (`/api/user`)
- `GET /user/profile` — Full profile with bookmarks, quiz history, revision stats
- `PUT /user/preference` — Update exam preference
- `POST /user/bookmark` — Toggle bookmark on article
- `POST /user/onboard` — Save setup profile (exam, level, daily goal)

### Revision (`/api/revision`)
- `GET /revision` — Get pending revision queue (daily, weekly, monthly)
- `POST /revision/schedule` — Schedule article for revision (default: tomorrow)
- `POST /revision/complete` — Mark revision card as done, award XP

### AI (`/api/ai`)
- `POST /ai/explain` — Send article + action (explain_simply, generate_mcqs, etc.) → Gemini response

### Admin (`/api/admin`)
- `GET /admin/metrics` — System stats (requires ADMIN_EMAIL)

---

## 🔄 Live Scraping Pipeline

### How It Works
Every day at **1:00 AM**, the `backend/cron/pipelineCron.js` triggers:

1. **RSS Fetch**: Pulls feeds from:
   - https://pib.gov.in/RssMain.aspx (PIB)
   - https://economictimes.indiatimes.com/news/rssfeeds/default.cms (Economic Times)
   - https://www.thehindu.com/news/national/feeder/default.rss (The Hindu)
   - https://prsindia.org/billtrack/rss (PRS Legislative)

2. **Article Extraction**: Uses cheerio to parse HTML body and og:image meta tag

3. **Deduplication**: Normalized title matching to avoid duplicates

4. **AI Processing**: Sends top 5 articles to Gemini 2.5 Flash Lite
   - Generates 15-sec bullets, 100-word summary, deep dive
   - Creates 3 MCQs with explanations
   - Scores exam relevance and importance (1-100)
   - Tags by topic

5. **Storage**: Saves enriched article + imageUrl to MongoDB

6. **Email Report**: Sends admin digest via Resend

### Logs
Watch console for:
- `[CRON ALERT]` — Pipeline started
- `[CRON SUCCESS]` — Pipeline completed successfully
- `[CRON FAILURE]` — Error occurred

---

## 🎨 UI Responsiveness

### Mobile (< lg)
- Single-column layout (w-full with px-4)
- `<BottomNav />` sticky at bottom with 5 main navigation buttons
- `<TopBar />` simplified header with logo and profile
- Full-width pages

### Desktop (lg:)
- **12-column grid** layout with 3 areas:
  - **Left** (col-span-2): `<DesktopSidebar />` — Logo, nav links, exam mode
  - **Center** (col-span-7): Page content
  - **Right** (col-span-3): `<RightPanel />` — Streak, XP, bookmarks, upcoming revisions
- `<BottomNav />` hidden (lg:hidden)
- `<TopBar />` also hidden on desktop (redundant with sidebar)

---

## 🎮 MCQ Quiz: Two-Phase Interaction

### Selection Phase
- User clicks an MCQ option
- Option highlights in **neutral blue** (brand-primary border)
- No reveal, no audio, no confetti yet
- "EVALUATE ANSWER" button appears at bottom

### Evaluation Phase
- User clicks "EVALUATE ANSWER"
- Correct option gets **green highlight + checkmark**
- Wrong selection gets **red highlight + shake animation** (animate-shake)
- Audio cue plays (success / error tone)
- Confetti triggers on correct
- Explanation accordion slides open
- Button transforms to "NEXT QUESTION →"

### CSS Addition
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}
.animate-shake {
  animation: shake 0.4s ease-in-out;
}
```

---

## ✅ Verification Checklist

- [ ] **Backend**: `npm run dev` starts server on port 5000
- [ ] **Frontend**: `npm run dev` starts on port 5173
- [ ] **Database**: MongoDB connects successfully
- [ ] **Auth**: Google OAuth login works → redirects to /dashboard
- [ ] **Auth**: Email/password registration works
- [ ] **Articles**: Dashboard loads articles with imageUrl banners
- [ ] **Responsive**: Desktop resize shows 3-column layout; mobile is single column
- [ ] **MCQ**: Quiz page allows select → click EVALUATE → reveal + animation
- [ ] **Cron**: Admin panel shows manual pipeline trigger; new articles appear with imageUrl
- [ ] **API Proxy**: Frontend /api calls route to backend correctly
- [ ] **Session**: Logout clears session; next navigation requires login

---

## 📝 Notes

- **Session Storage**: Uses MongoDB via connect-mongo (survives server restarts)
- **Frontend Build**: `npm run build` in `/frontend` creates optimized Vite bundle for deployment
- **Backend Deployment**: Can deploy to Heroku, Railway, Render, or any Node.js host
- **Frontend Deployment**: Vite builds to `/dist` — deploy to Vercel, Netlify, or CDN

---

## 🔐 Security

✅ MongoDB credentials in `backend/.env` (never exposed to frontend)  
✅ CORS restricted to CLIENT_URL  
✅ Session stored server-side in MongoDB (no sensitive data in JWT)  
✅ Frontend has NO API keys in bundle (all calls proxied through backend)  
✅ Admin routes protected by email verification on backend  

