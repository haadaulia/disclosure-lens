# DisclosureLens

**Live: [disclosure-lens.vercel.app](https://disclosure-lens.vercel.app)**

AI-powered UK company disclosure analyser. Search any UK registered company, get structured analyst briefs generated from live Companies House filings — including a dedicated annual report brief and recent statutory activity.

Built with Next.js, Python, FastAPI, the Companies House REST API, and Groq (LLaMA 3.1).

---

## What it does

- Searches the UK Companies House live register for any registered company
- Presents matching results with company status, type, and registration date
- Fetches and parses official filing documents from the register
- Generates two separate outputs in parallel:
  - **Annual Report Brief** — equity research-style summary of the most recent annual accounts, covering financial performance, strategic priorities, key risks, governance, and forward outlook
  - **Recent Statutory Filings** — analyst briefs for the latest director changes, capital events, confirmation statements, and other regulatory disclosures
- Category filter to browse filings by type (Officers, Capital, Confirmation, etc.)
- Light and dark theme toggle
- Links to source documents on Companies House for full verification

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 + TypeScript |
| Backend | Python 3.11+ + FastAPI |
| Data | Companies House REST API (live register) |
| Document parsing | PyMuPDF |
| Summarisation | Groq API (LLaMA 3.1 8B) |
| Rate limiting | SlowAPI |
| Hosting (frontend) | Vercel |
| Hosting (backend) | Railway |

---

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/haadaulia/disclosure-lens.git
cd disclosure-lens
```

### 2. Install backend dependencies

```bash
pip install fastapi uvicorn requests python-dotenv pymupdf slowapi
```

### 3. Install frontend dependencies

```bash
cd frontend && npm install
```

### 4. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your keys:

```
COMPANIES_HOUSE_API_KEY=
GROQ_API_KEY=
```

- **Companies House API key** — [developer.company-information.service.gov.uk](https://developer.company-information.service.gov.uk). Create a live application and generate a REST API key.
- **Groq API key** — [console.groq.com](https://console.groq.com). Free tier available, no credit card required.

### 5. Run

Open two terminals.

**Terminal 1 — Backend:**
```bash
cd backend
python -m uvicorn api:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
disclosure-lens/
├── backend/
│   ├── api.py                # FastAPI app — search, filings, annual report endpoints
│   ├── companies_house.py    # Companies House API client
│   ├── summariser.py         # Groq LLM summarisation (filing briefs + annual report)
│   └── main.py               # Standalone pipeline entry point (dev/testing)
├── frontend/
│   ├── app/
│   │   ├── page.tsx          # Main UI — search, company selection, results
│   │   ├── layout.tsx        # Root layout
│   │   ├── globals.css       # Design system + light/dark themes
│   │   └── api/
│   │       ├── search/       # Proxies /search to Python backend
│   │       ├── filings/      # Proxies /filings to Python backend
│   │       └── annual-report/ # Proxies /annual-report to Python backend
│   └── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/search?q=` | Search Companies House register, returns up to 5 matches |
| GET | `/filings?company_number=&company_name=&count=` | Fetch and summarise recent statutory filings |
| GET | `/annual-report?company_number=&company_name=` | Fetch and summarise most recent annual accounts |

---

## Pipeline

```
User enters company name
        ↓
Search Companies House → return candidate matches
        ↓
User selects company
        ↓
        ├── Fetch filing history (100 items)
        │       ↓
        │   Filter annual accounts (category: accounts)
        │       ↓
        │   Download PDF → extract text (PyMuPDF)
        │       ↓
        │   LLM: equity research brief (Groq / LLaMA 3.1)
        │       ↓
        │   Annual Report Brief → UI
        │
        └── Fetch recent filings (excl. accounts)
                ↓
            Download PDFs → extract text
                ↓
            LLM: analyst brief per filing
                ↓
            Recent Statutory Filings → UI
```

Both branches run in parallel. Results appear as they complete.

---

## Features

- Live company search with status, type, and registration year
- Annual report brief — equity research format with section citations
- Recent filings — structured analyst briefs per filing
- Category filter (Officers, Capital, Confirmation, Charges, PSC)
- Handles unextractable PDFs gracefully with Companies House links
- Light / dark theme
- Rate limiting (20 searches/min, 10 filings/min, 5 annual reports/min)
- Input sanitisation on all endpoints
- BYOK — users supply their own API keys, none stored server-side

---

## Security

- API keys loaded from environment variables, never committed
- `.env` excluded via `.gitignore`
- Input sanitised and length-limited before hitting external APIs
- Rate limiting per IP via SlowAPI
- CORS restricted to localhost in development, production domain in deployment
- Raw exception text never returned to the frontend

---

## Known limitations

- Annual accounts for large PLCs (Tesco, HSBC, etc.) are often scanned PDFs — text extraction fails. Companies House links are provided as fallback.
- RNS / regulatory news data (trading updates, profit warnings) is not available via the Companies House API and requires a separate paid data source.
- Groq free tier is rate-limited — heavy usage may hit limits.

---

## Roadmap

- [x] Live company search with candidate selection
- [x] Annual report brief (equity research format)
- [x] Recent statutory filings with category filter
- [x] Light / dark theme
- [x] Rate limiting and input sanitisation
- [ ] Demo mode with cached sample filings (no API keys required)
- [ ] Side-by-side company comparison
- [x] Deploy — [disclosure-lens.vercel.app](https://disclosure-lens.vercel.app) (Vercel + Render)

---

## Author

Haad Arshad Aulia — [github.com/haadaulia](https://github.com/haadaulia)