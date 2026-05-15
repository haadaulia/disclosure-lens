from companies_house import search_company, get_filing_history, get_document, get_document_text
from summariser import summarise_filing

def analyse_company(query):
    print(f"\nSearching for: {query}")
    results = search_company(query)
    company = results["items"][0]
    print(f"Found: {company['title']} ({company['company_number']})")

    print("\nFetching filing history...")
    filings = get_filing_history(company["company_number"])
    latest = filings["items"][0]
    print(f"Latest filing: {latest['date']} - {latest['description']}")

    print("\nFetching document...")
    doc = get_document(latest)
    if not doc:
        print("No document available")
        return

    text = get_document_text(doc)
    print(f"Extracted {len(text)} characters of text")

    print("\nGenerating summary...")
    summary = summarise_filing(text, company["title"])
    print("\n--- MARKET BRIEF ---")
    print(summary)

if __name__ == "__main__":
    analyse_company("Tesco")