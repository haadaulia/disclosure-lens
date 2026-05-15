# DisclosureLens

AI-powered UK company disclosure analyser. Enter a company name, get a structured market brief generated from live Companies House filings.

Built with Python, the Companies House REST API, and Groq (LLaMA 3).

---

## What it does

- Searches the UK Companies House register for any listed or registered company
- Fetches the latest official filings from the live register
- Extracts and parses the filing documents
- Generates a structured analyst-style market brief using an LLM

Output covers: filing summary, key personnel, regulatory context, market implications, risk flags, and an analyst note.

---

## Stack

| Layer | Technology |
|---|---|
| Data | Companies House REST API |
| Document parsing | PyMuPDF (fitz) |
| Summarisation | Groq API (LLaMA 3.1) |
| Language | Python 3.10+ |
| Frontend (in progress) | Next.js + TypeScript |

---

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/haadaulia/disclosure-lens.git
cd disclosure-lens
```

### 2. Install dependencies

```bash
pip install requests python-dotenv pymupdf beautifulsoup4 lxml
```

### 3. Set up environment variables

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

```
COMPANIES_HOUSE_API_KEY=
GROQ_API_KEY=
```

- Companies House API key: [developer.company-information.service.gov.uk](https://developer.company-information.service.gov.uk) — create a live application and generate a REST API key
- Groq API key: [console.groq.com](https://console.groq.com) — free tier available

### 4. Run

```bash
python backend/main.py
```

---

## Project structure

```
disclosure-lens/
├── backend/
│   ├── main.py              # Entry point — orchestrates full pipeline
│   ├── companies_house.py   # Companies House API client
│   ├── summariser.py        # Groq LLM summarisation layer
│   └── rns.py               # RNS announcements (in progress)
├── frontend/                # Next.js UI (in progress)
├── .env.example
├── .gitignore
└── README.md
```

---

## Pipeline

```
User input (company name)
        ↓
Companies House search → resolve company number
        ↓
Fetch filing history → select latest filing
        ↓
Fetch document metadata → download PDF
        ↓
Extract text (PyMuPDF)
        ↓
LLM summarisation (Groq / LLaMA 3.1)
        ↓
Structured market brief
```

---

## Security

- API keys are loaded from environment variables and never committed to the repository
- `.env` is excluded via `.gitignore`
- Users supply their own API keys (BYOK)
- Input is sanitised and length-limited before hitting external APIs

---

## Roadmap

- [ ] Next.js frontend with search UI
- [ ] Multiple filing comparison (last 3–5 filings)
- [ ] Side-by-side company comparison
- [ ] Demo mode with cached sample filings
- [ ] FastAPI backend for frontend integration

---

## Author

Haad Arshad Aulia — [github.com/haadaulia](https://github.com/haadaulia)