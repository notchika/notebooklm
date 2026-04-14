from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import GenericProxyConfig
import re
import os

def extract_video_id(url: str) -> str:
    patterns = [
        r"(?:v=|\/)([0-9A-Za-z_-]{11}).*",
        r"(?:embed\/)([0-9A-Za-z_-]{11})",
        r"(?:youtu\.be\/)([0-9A-Za-z_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError("Could not extract YouTube video ID from URL")

def get_youtube_transcript(url: str) -> dict:
    video_id = extract_video_id(url)

    def fetch_text(api: YouTubeTranscriptApi) -> str:
        last_error = None
        transcript_candidates = [
            ("en",),
            ("en-US", "en-GB", "en"),
            ("en", "fr", "es", "de"),
        ]
        for languages in transcript_candidates:
            try:
                fetched_transcript = api.fetch(video_id, languages=languages)
                text = " ".join(
                    snippet.text.strip()
                    for snippet in fetched_transcript
                    if getattr(snippet, "text", "").strip()
                ).strip()
                if text:
                    return text
            except Exception as e:
                last_error = e
        raise last_error or Exception("Unknown transcript fetch error")

    # 1) Try without proxy first.
    try:
        full_text = fetch_text(YouTubeTranscriptApi())
    except Exception as direct_error:
        # 2) Optional: retry via proxy if configured.
        proxy_url = os.getenv("YOUTUBE_PROXY_URL") or os.getenv("PROXY_URL")
        if proxy_url:
            proxy_config = GenericProxyConfig(http_url=proxy_url, https_url=proxy_url)
            try:
                full_text = fetch_text(YouTubeTranscriptApi(proxy_config=proxy_config))
            except Exception as proxied_error:
                raise Exception(
                    f"Unable to fetch transcript for video {video_id}. "
                    f"Direct error: {direct_error}. Proxied error: {proxied_error}. "
                    f"If you're running on a cloud host, you may need a working proxy."
                )
        else:
            raise Exception(
                f"Unable to fetch transcript for video {video_id}. "
                f"This is commonly caused by cloud IP blocking or missing captions. "
                f"Details: {direct_error}. "
                f"To retry via proxy, set YOUTUBE_PROXY_URL in the backend environment."
            )

    return {
        "title": f"YouTube Video ({video_id})",
        "content": full_text,
        "url": url
    }