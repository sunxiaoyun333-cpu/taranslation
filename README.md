# Menu Translator

AI-powered Chinese menu translation system with FDA allergen compliance checking for American restaurants.

## Features

- **AI Translation** — Powered by Google Gemini 2.5 Flash for accurate, context-aware Chinese menu translation
- **FDA Allergen Detection** — Automatic scanning against all 9 FDA-recognized major food allergens
- **RAG Semantic Search** — Vector-based search using Gemini embeddings for finding existing translations
- **Marketing Copy** — Bilingual marketing suggestions for each dish
- **Smart Caching** — In-memory cache to reduce API costs

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **AI**: Google Gemini 2.5 Flash
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL + pgvector)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- A [Google Gemini API Key](https://aistudio.google.com/apikey)
- A [Supabase](https://supabase.com) project with pgvector enabled

### Setup

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment file and fill in your keys:
   ```bash
   cp .env.local.example .env.local
   ```

4. Initialize the database:
   ```bash
   npm run db:init
   ```

5. Seed dish data:
   ```bash
   npm run db:seed
   ```

6. Generate embeddings for seeded dishes:
   ```bash
   npm run db:generate-embeddings
   ```

7. Start the dev server:
   ```bash
   npm run dev
   ```

8. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/translate` | POST | Translate a dish name with full analysis |
| `/api/search` | POST | Search for dishes by name or description |
| `/api/allergens/check` | POST | Check ingredients for allergens |
| `/api/allergens/list` | GET | List all FDA-recognized allergens |
| `/api/health` | GET | Health check with cache stats |

## Project Structure

```
├── app/                  # Next.js App Router
│   ├── api/              # API routes
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/           # React components
├── lib/                  # Core business logic
├── data/                 # Static data (allergens, dishes)
├── scripts/              # Development scripts
└── supabase/             # Database schema
```

## Scripts

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run typecheck        # TypeScript type check
npm run db:init          # Initialize database tables
npm run db:seed          # Seed initial dish data
npm run db:generate-embeddings  # Generate vector embeddings
npm run test:allergens   # Run allergen detection tests
npm run validate:allergens # Validate allergen data integrity
```
