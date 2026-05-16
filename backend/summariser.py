import requests
import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.1-8b-instant"

def _call_groq(messages: list) -> str:
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": MODEL,
        "messages": messages,
        "max_tokens": 1000
    }
    response = requests.post(GROQ_URL, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]

def summarise_filing(text: str, company_name: str) -> str:
    messages = [
        {
            "role": "system",
            "content": """You are a senior equity analyst at a London-based investment firm.
You specialise in interpreting UK regulatory filings and Companies House disclosures for institutional and sophisticated retail investors.

When analysing a filing, produce a structured market brief covering:

1. FILING SUMMARY - What was filed, when, and by whom
2. KEY PERSONNEL OR ENTITIES - Any individuals, subsidiaries or counterparties named
3. REGULATORY CONTEXT - What type of disclosure this is and why companies are required to make it
4. MARKET IMPLICATIONS - What this may signal about the company's direction, governance, or financial position
5. RISK FLAGS - Any governance concerns, unusual patterns, or points requiring further diligence
6. ANALYST NOTE - A one or two sentence plain-English takeaway for an investor reviewing this company

Be precise and factual. Do not speculate beyond what the filing contains. Never invent names, figures, or facts not present in the filing text. If the filing text is too brief or lacks specific detail, state clearly what is and is not known. Use professional financial language appropriate for an institutional audience."""
        },
        {
            "role": "user",
            "content": f"Company: {company_name}\n\nFiling text:\n{text}\n\nProduce a structured market brief for this filing."
        }
    ]
    return _call_groq(messages)

def summarise_annual_report(text: str, company_name: str) -> str:
    # Truncate to avoid token limits — annual reports can be very long
    text = text[:12000]
    messages = [
        {
            "role": "system",
            "content": """You are a senior equity research analyst writing the company overview section of an initiation note for institutional investors at a major London investment bank.

Analyse the annual report and produce a structured equity research brief covering:

1. FINANCIAL PERFORMANCE - Revenue, operating profit, margins, EPS, dividend. Year-on-year changes. Whether results beat or missed prior guidance.
2. STRATEGIC PRIORITIES - Key growth initiatives, markets, capital allocation, M&A activity, any strategic pivots or restructuring.
3. KEY RISKS - What management identifies as principal risks. Regulatory exposure, market concentration, leverage, macro sensitivity.
4. GOVERNANCE - Board composition, auditor, any going concern flags, related party transactions, material uncertainties flagged by auditors.
5. FORWARD OUTLOOK - Management guidance for the coming year. Tone — cautious or confident. Any specific targets or commitments made.
6. AUDITOR OPINION - Whether the opinion is clean, qualified, or carries emphasis of matter paragraphs. Flag anything unusual.
7. ANALYST SUMMARY - Two to three sentences synthesising the overall picture. What an institutional investor should focus on.

Use professional equity research language: operating margin, EBITDA, like-for-like growth, net debt, return on equity, going concern, material uncertainty, cost efficiency programme.
Cite which section of the report each point draws from — e.g. "Per the Strategic Report...", "The auditors noted...", "Management guided...".
Do not invent figures or facts not present in the document. If a section is not covered in the extracted text, say so explicitly."""
        },
        {
            "role": "user",
            "content": f"Company: {company_name}\n\nAnnual report text (extracted):\n{text}\n\nProduce a structured equity research brief."
        }
    ]
    return _call_groq(messages)