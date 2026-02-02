# BI Feasibility Study

AI-Powered Feasibility Study Platform that generates professional, comprehensive feasibility reports powered by advanced LLMs.

## Features

- ✨ **Professional Report Generation**: Multi-section feasibility studies with custom word count (1,500-10,000 words)
- 📊 **Comprehensive Analysis**: Executive Summary, Market Analysis, Technical Analysis, Financial Analysis, Risk Assessment, Recommendations
- 📄 **Smart Document Processing**: Upload and extract data from PDF, Word, and Excel documents
- 🎨 **Professional PDF Reports**: Beautiful formatted PDFs with charts, tables, and branding options
- 🔐 **User Authentication**: Email/Password and Google OAuth
- 🌐 **Multi-sector Support**: Real Estate, Healthcare, Technology, Finance, etc.
- ⚡ **Fast Generation**: Parallel processing with advanced AI models

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, TypeScript
- **Database**: Firebase Firestore (real-time, serverless)
- **Authentication**: Firebase Authentication
- **AI**: OpenRouter API (Trinity, Claude, GPT models)
- **PDF Generation**: Puppeteer with custom styling
- **Deployment**: Railway.app

## Prerequisite

- Node.js 18+
- Firebase project with Firestore enabled
- OpenRouter API key (get free tier at https://openrouter.ai)
- Git

## Local Development

### 1. Clone and Setup

```bash
git clone <repository-url>
cd bi-feasibility-study
npm install
```

### 2. Firebase Configuration

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Firestore Database and Authentication (Email/Password + Google)
3. Create a service account:
   - Go to Project Settings → Service Accounts → Generate new private key
   - Save the credentials safely

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
```
# Firebase (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin (from service account JSON)
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_PRIVATE_KEY=...
FIREBASE_ADMIN_CLIENT_EMAIL=...

# OpenRouter (get from https://openrouter.ai)
OPENROUTER_API_KEY=sk-or-v1-...

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Railway Deployment

### Prerequisites on Railway

1. Create a Railway project at [railway.app](https://railway.app)
2. Connect your GitHub repository

### Deployment Steps

1. **Create New Service**
   - Click "New" → Select your GitHub repository

2. **Configure Environment Variables**
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   FIREBASE_ADMIN_PROJECT_ID=...
   FIREBASE_ADMIN_PRIVATE_KEY=...
   FIREBASE_ADMIN_CLIENT_EMAIL=...
   OPENROUTER_API_KEY=...
   NEXT_PUBLIC_APP_URL=https://<your-domain>.railway.app
   NODE_ENV=production
   ```

3. **Build Configuration**
   - Build Command: `npm run build` (auto-detected by Railway)
   - Start Command: `npm run start` (auto-detected by Railway)
   - Health Check Path: `/api/health`

4. **Deploy**
   - Railway will automatically build and deploy on every push to main

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/              # Authentication routes
│   │   ├── generate/          # Report generation
│   │   ├── pdf/               # PDF generation
│   │   ├── projects/          # Project management
│   │   ├── upload/            # Document upload
│   │   └── health/            # Health check
│   ├── auth/                  # Auth pages (signin, signup)
│   ├── dashboard/             # Dashboard pages
│   └── page.tsx               # Landing page
├── components/
│   ├── dashboard/             # Dashboard components
│   ├── project/               # Project components
│   ├── providers/             # Context & Auth providers
│   └── ui/                    # Reusable UI components
├── lib/
│   ├── auth-api.ts            # Firebase auth API
│   ├── firebase.ts            # Firebase client config
│   ├── firebase-admin.ts      # Firebase Admin SDK
│   ├── openrouter.ts          # OpenRouter client
│   ├── pdf-generator.ts       # PDF generation logic
│   ├── report-generator.ts    # AI report generation
│   └── utils/                 # Utilities
├── types/                     # TypeScript types
├── public/                    # Static assets
└── middleware.ts              # Next.js middleware
```

## Key Features Explained

### Report Generation
- **Word Count Options**: Users can select 1,500 to 10,000 words
- **Intelligent Distribution**: Content automatically distributed across sections
  - Executive Summary: 12%
  - Market Analysis: 25%
  - Technical Analysis: 20%
  - Financial Analysis: 25%
  - Risk Assessment: 12%
  - Recommendations: 6%

### AI Models
Currently using **arcee-ai/trinity-large-preview:free** via OpenRouter for optimal balance of quality and cost.

### PDF Generation
- Custom branding with company logos
- Professional styling with tables, headers, footers
- Watermark support
- Multi-page report generation

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/signin` | POST | User sign in |
| `/api/auth/signup` | POST | User registration |
| `/api/auth/signout` | POST | User sign out |
| `/api/projects` | GET/POST | List/create projects |
| `/api/projects/[id]` | GET/PUT/DELETE | Project management |
| `/api/generate` | POST | Generate feasibility report |
| `/api/pdf` | POST | Generate PDF from report |
| `/api/upload` | POST | Upload documents |
| `/api/health` | GET | Health check (Railway) |

## Troubleshooting

### Report Generation Issues

**Word count not matching selected value:**
- Ensure OpenRouter API key is valid
- Check that Trinity model is available (free tier)
- See server logs for detailed word count breakdown

**Firebase Connection Errors:**
- Verify Firebase environment variables are correct
- Check Firebase project has Firestore enabled
- Ensure service account has proper permissions

**PDF Generation Fails:**
- Check Puppeteer dependencies are installed
- Ensure sufficient memory available (min 512MB)
- Verify watermark.png exists in project root (optional)

## Development Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Performance Notes

- Report generation typically takes 30-60 seconds depending on word count and model
- PDF generation adds ~5-10 seconds
- Parallel processing used for faster generation
- Free tier models have rate limits - premium models recommended for high volume

## License

MIT
