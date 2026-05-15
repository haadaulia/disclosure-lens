import requests
import os
import fitz
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("COMPANIES_HOUSE_API_KEY")
BASE_URL = "https://api.company-information.service.gov.uk"

def search_company(query):
    query = query.strip()[:100]
    url = f"{BASE_URL}/search/companies"
    response = requests.get(url, params={"q": query}, auth=(API_KEY, ""))
    response.raise_for_status()
    return response.json()

def get_filing_history(company_number):
    url = f"{BASE_URL}/company/{company_number}/filing-history"
    response = requests.get(url, auth=(API_KEY, ""))
    response.raise_for_status()
    return response.json()

def get_document(filing):
    links = filing.get("links", {})
    doc_url = links.get("document_metadata")
    if not doc_url:
        return None
    response = requests.get(doc_url, auth=(API_KEY, ""))
    response.raise_for_status()
    return response.json()

def get_document_text(doc_metadata):
    doc_url = doc_metadata["links"]["document"]
    response = requests.get(
        doc_url,
        auth=(API_KEY, ""),
        headers={"Accept": "application/pdf"}
    )
    response.raise_for_status()
    pdf = fitz.open(stream=response.content, filetype="pdf")
    text = ""
    for page in pdf:
        text += page.get_text()
    return text

if __name__ == "__main__":
    results = search_company("Tesco")
    company = results["items"][0]
    print(company["title"], "-", company["company_number"])

    filings = get_filing_history(company["company_number"])
    for filing in filings["items"][:5]:
        print(filing["date"], "-", filing["description"])

    first_filing = filings["items"][0]
    doc = get_document(first_filing)
    text = get_document_text(doc)
    print(text)