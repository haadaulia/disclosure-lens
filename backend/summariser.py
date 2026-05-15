import requests
import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def summarise_filing(text, company_name):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
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

Be precise and factual. Do not speculate beyond what the filing contains. Use professional financial language appropriate for an institutional audience. Avoid generic statements.
If the filing text is too brief or lacks specific detail, state clearly what is and is not known. Never invent names, figures, or facts not present in the filing text."""

            },
            {
                "role": "user",
                "content": f"""Company: {company_name}

Filing text:
{text}

Produce a structured market brief for this filing."""
            }
        ]
    }
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]

if __name__ == "__main__":
    sample = """
    TM01 - Termination of Director
    Company: Tesco PLC
    Date of termination: 06/05/2026
    Name: THIERRY DOMINIQUE GERARD GARNIER
    """
    result = summarise_filing(sample, "Tesco PLC")
    print(result)