import re
from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from companies_house import search_company, get_filing_history, get_document, get_document_text
from summariser import summarise_filing, summarise_annual_report

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

# ── Search ──────────────────────────────────────────
@app.get("/search")
@limiter.limit("20/minute")
async def search(request: Request, q: str = Query(..., max_length=100)):
    q = re.sub(r"[^\w\s\-\&\.]", "", q).strip()
    if not q:
        return JSONResponse(status_code=400, content={"error": "Invalid input"})
    results = search_company(q)
    companies = []
    for item in results.get("items", [])[:5]:
        companies.append({
            "title": item.get("title", ""),
            "company_number": item.get("company_number", ""),
            "company_status": item.get("company_status", ""),
            "company_type": item.get("company_type", ""),
            "date_of_creation": item.get("date_of_creation", ""),
            "address": item.get("registered_office_address", {}).get("locality", ""),
        })
    return {"companies": companies}

# ── Recent filings ───────────────────────────────────
@app.get("/filings")
@limiter.limit("10/minute")
async def filings(
    request: Request,
    company_number: str = Query(..., max_length=20),
    company_name: str = Query(..., max_length=200),
    count: int = Query(default=5, ge=1, le=10)
):
    company_number = re.sub(r"[^\w]", "", company_number).strip()
    if not company_number:
        return JSONResponse(status_code=400, content={"error": "Invalid company number"})

    filings_data = get_filing_history(company_number)
    all_items = [
        f for f in filings_data.get("items", [])
        if f.get("category", "") != "accounts"
    ][:count * 2]

    results = []
    for filing in all_items:
        if len(results) >= count:
            break
        try:
            doc = get_document(filing)
            if not doc:
                continue
            text = get_document_text(doc)
            if len(text.strip()) < 200:
                results.append({
                    "date": filing.get("date", ""),
                    "description": filing.get("description", ""),
                    "category": filing.get("category", ""),
                    "type": filing.get("type", ""),
                    "summary": "",
                    "warning": True
                })
                continue
            summary = summarise_filing(text, company_name)
            results.append({
                "date": filing.get("date", ""),
                "description": filing.get("description", ""),
                "category": filing.get("category", ""),
                "type": filing.get("type", ""),
                "summary": summary,
                "warning": False
            })
        except Exception:
            continue

    return {
        "company": company_name,
        "company_number": company_number,
        "filings": results
    }

# ── Annual report ────────────────────────────────────
@app.get("/annual-report")
@limiter.limit("5/minute")
async def annual_report(
    request: Request,
    company_number: str = Query(..., max_length=20),
    company_name: str = Query(..., max_length=200),
):
    company_number = re.sub(r"[^\w]", "", company_number).strip()
    if not company_number:
        return JSONResponse(status_code=400, content={"error": "Invalid company number"})

    filings_data = get_filing_history(company_number)
    aa_filings = [
        f for f in filings_data.get("items", [])
        if f.get("category", "") == "accounts"
    ][:3]

    if not aa_filings:
        return {"found": False, "message": "No annual accounts filing found on Companies House for this company."}

    for latest_aa in aa_filings:
        try:
            doc = get_document(latest_aa)
            if not doc:
                continue
            text = get_document_text(doc)
            if len(text.strip()) < 300:
                continue
            summary = summarise_annual_report(text, company_name)
            return {
                "found": True,
                "date": latest_aa.get("date", ""),
                "type": latest_aa.get("type", ""),
                "summary": summary,
                "warning": False,
                "company_number": company_number
            }
        except Exception:
            continue

    # None of the account filings had extractable text
    return {
        "found": True,
        "date": aa_filings[0].get("date", "") if aa_filings else "",
        "summary": None,
        "warning": True,
        "message": "Annual accounts found but text could not be extracted, the document may be a scanned or image-based PDF.",
        "company_number": company_number
    }
