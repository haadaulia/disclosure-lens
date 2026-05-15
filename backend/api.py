import re
from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from companies_house import search_company, get_filing_history, get_document, get_document_text
from summariser import summarise_filing

limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"error": "Too many requests. Please wait and try again."})

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

@app.get("/analyse")
@limiter.limit("10/minute")
async def analyse(request: Request, q: str = Query(..., max_length=100)):
    # Sanitise input
    q = re.sub(r"[^\w\s\-\&\.]", "", q).strip()
    if not q:
        return JSONResponse(status_code=400, content={"error": "Invalid input"})

    # Search
    results = search_company(q)
    if not results.get("items"):
        return {"error": "Company not found"}

    company = results["items"][0]
    company_name = company["title"]
    company_number = company["company_number"]

    # Get last 3 filings
    filings_data = get_filing_history(company_number)
    items = filings_data.get("items", [])[:5]

    filings = []
    for filing in items:
        try:
            doc = get_document(filing)
            if not doc:
                continue
            text = get_document_text(doc)

            # Skip if text too short to summarise reliably
            if len(text.strip()) < 200:
                filings.append({
                    "date": filing.get("date", ""),
                    "description": filing.get("description", ""),
                    "summary": "Insufficient text extracted from this filing to generate a reliable summary.",
                    "warning": True
                })
                continue

            summary = summarise_filing(text, company_name)
            filings.append({
                "date": filing.get("date", ""),
                "description": filing.get("description", ""),
                "summary": summary,
                "warning": False
            })
        except Exception:
            continue

    return {
        "company": company_name,
        "company_number": company_number,
        "filings": filings
    }