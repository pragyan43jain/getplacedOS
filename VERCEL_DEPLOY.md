# GetPlacedOS — Vercel Deployment Guide

## Architecture on Vercel

```
Vercel (single project)
├── Frontend (React/Vite) → Static build → frontend/dist/
├── Node.js Backend       → Serverless function → /api/*
└── Python FastAPI        → ⚠️ Deploy SEPARATELY (Railway/Render)
```

## Environment Variables (set in Vercel Dashboard)

Go to: **Vercel Dashboard → Project → Settings → Environment Variables**

### Node Backend Variables (Required)
| Variable | Value | Notes |
|---|---|---|
| `MONGO_URI` | `mongodb+srv://...` | MongoDB Atlas URI (required for prod) |
| `JWT_SECRET` | `your_secret_key` | Strong random string |
| `NODE_ENV` | `production` | |
| `PORT` | `3000` | Optional (Vercel ignores this) |

### Python Backend API Keys (used by Node if proxied)
| Variable | Value |
|---|---|
| `GOOGLE_API_KEY` | Your Gemini API key |
| `RAPIDAPI_KEY` | Your RapidAPI key |
| `ADZUNA_API_ID` | Your Adzuna App ID |
| `ADZUNA_API_KEY` | Your Adzuna API key |

### Frontend Variables (Build Time)
| Variable | Value |
|---|---|
| `VITE_NODE_API_URL` | Leave empty (same domain — Vercel handles routing) |
| `VITE_PY_API_URL` | URL of your deployed Python backend on Railway/Render |

## Python Backend (FastAPI) — Separate Deployment

The Python backend cannot run on Vercel. Deploy it to one of:
- **Railway** (easiest): Connect GitHub repo → select `backend-Py/` folder
- **Render**: New Web Service → Docker or uvicorn start command

After deploying, set `VITE_PY_API_URL` in Vercel to the Railway/Render URL.

## Deployment Steps

1. **Login to Vercel CLI**:
   ```bash
   vercel login
   ```

2. **Deploy from root of project**:
   ```bash
   vercel --prod
   ```
   - Framework Preset: **Other**
   - Root Directory: `.` (root)
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`

3. **Set Environment Variables** in the Vercel dashboard (listed above)

4. **Update CORS** in `backend-Node/index.js` with your actual Vercel domain after first deploy

## Important Notes

- The `vercel.json` at the project root handles all routing
- `/api/*` routes → Node.js serverless function
- All other routes → React SPA (index.html)
- MongoDB must be MongoDB Atlas (not localhost) for production
