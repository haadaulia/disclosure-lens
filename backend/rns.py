import requests
from bs4 import BeautifulSoup

def get_rns_announcements(ticker):
    url = f"https://www.lse.co.uk/rss/regulatory-news.html?tidm={ticker}"
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "xml")
    
    announcements = []
    for item in soup.find_all("item")[:10]:
        announcements.append({
            "title": item.find("title").text.strip(),
            "date": item.find("pubDate").text.strip(),
            "url": item.find("link").text.strip()
        })
    return announcements

if __name__ == "__main__":
    results = get_rns_announcements("TSCO")
    for r in results:
        print(r["date"], "-", r["title"])