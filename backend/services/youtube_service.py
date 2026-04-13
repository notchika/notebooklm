from youtube_transcript_api import YouTubeTranscriptApi
import re

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

    ytt = YouTubeTranscriptApi()
    last_error = None

    # Try several language strategies before failing.
    transcript_candidates = [
        ("en",),
        ("en-US", "en-GB", "en"),
        ("en", "fr", "es", "de"),
    ]

    for languages in transcript_candidates:
        try:
            fetched_transcript = ytt.fetch(video_id, languages=languages)
            full_text = " ".join(
                snippet.text.strip()
                for snippet in fetched_transcript
                if getattr(snippet, "text", "").strip()
            ).strip()
            if full_text:
                break
        except Exception as e:
            last_error = e
            full_text = ""
    else:
        raise Exception(
            f"Unable to fetch transcript for video {video_id}. "
            f"The video may not have captions enabled, may be restricted, or may block transcript access. "
            f"Details: {last_error}"
        )

    return {
        "title": f"YouTube Video ({video_id})",
        "content": full_text,
        "url": url
    }