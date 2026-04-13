import requests
from bs4 import BeautifulSoup
import random
from urllib.parse import urlparse
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

HEADERS_LIST = [
    {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    },
    {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
    }
]

def normalize_url(url: str) -> str:
    cleaned = url.strip()
    if not cleaned:
        raise Exception("URL is empty")
    parsed = urlparse(cleaned)
    if not parsed.scheme:
        cleaned = f"https://{cleaned}"
    return cleaned


def build_session(headers: dict) -> requests.Session:
    session = requests.Session()
    session.headers.update(headers)
    retries = Retry(
        total=2,
        backoff_factor=0.5,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "HEAD"],
    )
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session


def scrape_with_requests(url: str) -> dict:
    """Primary scraper — direct HTTP request"""
    headers = random.choice(HEADERS_LIST)
    session = build_session(headers)

    response = session.get(url, timeout=15, allow_redirects=True)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    main_content = (
        soup.find("article") or
        soup.find("main") or
        soup.find(id="content") or
        soup.find(id="main") or
        soup.find(class_="content") or
        soup.find(class_="article-body") or
        soup.find(class_="post-content") or
        soup.body
    )

    title = soup.title.string.strip() if soup.title else url
    content = main_content.get_text(separator="\n", strip=True) if main_content else ""

    if not content or len(content) < 100:
        raise Exception("Insufficient content extracted")

    return {"title": title, "content": content, "url": url}


def scrape_with_jina(url: str) -> dict:
    """Fallback scraper — Jina AI Reader"""
    jina_url = f"https://r.jina.ai/{url}"

    headers = {
        "Accept": "text/plain",
        "X-Return-Format": "text",
    }

    session = build_session(headers)
    response = session.get(jina_url, timeout=30)
    response.raise_for_status()

    content = response.text.strip()

    if not content or len(content) < 100:
        raise Exception("Jina AI returned insufficient content")

    # Extract title from first line of Jina response
    lines = content.split("\n")
    title = url  # default
    for line in lines[:10]:
        if line.startswith("Title:"):
            title = line.replace("Title:", "").strip()
            break

    return {"title": title, "content": content, "url": url}


def scrape_url(url: str) -> dict:
    """
    Main scraper with automatic fallback:
    1. Try direct HTTP scraping first
    2. Fall back to Jina AI Reader if that fails
    """
    normalized_url = normalize_url(url)

    # Step 1 — Try direct scraping
    try:
        print(f"[Scraper] Trying direct scrape: {normalized_url}")
        result = scrape_with_requests(normalized_url)
        print(f"[Scraper] ✅ Direct scrape successful: {result['title']}")
        return result
    except Exception as e:
        print(f"[Scraper] ⚠️ Direct scrape failed: {str(e)} — trying Jina AI fallback")

    # Step 2 — Fall back to Jina AI
    try:
        result = scrape_with_jina(normalized_url)
        print(f"[Scraper] ✅ Jina AI scrape successful: {result['title']}")
        return result
    except Exception as e:
        print(f"[Scraper] ❌ Jina AI fallback also failed: {str(e)}")
        raise Exception(
            f"Could not extract content from this URL using any method. "
            f"The site may be fully paywalled or inaccessible. Details: {str(e)}"
        )
