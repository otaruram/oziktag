import os
import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/elite", tags=["Elite Hub"])

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

@router.get("/videos")
async def get_elite_videos():
    """Fetch realtime YouTube videos for Elite Hub using YouTube API."""
    if not YOUTUBE_API_KEY:
        # Fallback dummy videos if API key is not configured
        return [
            {
                "id": "1",
                "title": "[FALLBACK] 5 Strategi Marketing UMKM di Era Digital",
                "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "duration": "10:05",
                "category": "Marketing"
            },
            {
                "id": "2",
                "title": "[FALLBACK] Cara Menghitung HPP Produk Kerajinan",
                "thumbnail": "https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg",
                "youtubeUrl": "https://www.youtube.com/watch?v=jNQXAC9IVRw",
                "duration": "15:20",
                "category": "Finance"
            }
        ]

    search_url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": "UMKM business tips marketing kerajinan",
        "type": "video",
        "maxResults": 6,
        "key": YOUTUBE_API_KEY,
        "order": "relevance",
        "relevanceLanguage": "id"
    }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(search_url, params=params)
            resp.raise_for_status()
            data = resp.json()
            
            videos = []
            for item in data.get("items", []):
                snippet = item.get("snippet", {})
                video_id = item.get("id", {}).get("videoId")
                
                videos.append({
                    "id": video_id,
                    "title": snippet.get("title", ""),
                    "thumbnail": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
                    "youtubeUrl": f"https://www.youtube.com/watch?v={video_id}",
                    "duration": "New",  # Would need a separate API call for real duration
                    "category": snippet.get("channelTitle", "Business")
                })
            return videos
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch from YouTube API: {str(e)}")
