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
    
    try:
        # New API style
        ytt = YouTubeTranscriptApi()
        transcript_list = ytt.fetch(video_id)
        full_text = " ".join([entry.text for entry in transcript_list])
    except Exception:
        # Fallback to old API style
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        full_text = " ".join([entry["text"] for entry in transcript_list])

    return {
        "title": f"YouTube Video ({video_id})",
        "content": full_text,
        "url": url
    }