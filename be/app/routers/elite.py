import os
import httpx
from fastapi import APIRouter, HTTPException, Depends
from app.database import db
from app.dependencies import get_admin_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/elite", tags=["Elite Hub"])

class ArticleRequest(BaseModel):
    title: str
    preview: str
    content: str

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


@router.get("/articles")
async def get_articles():
    """Fetch all Elite Hub articles."""
    articles = await db.elitearticle.find_many(
        order={"createdAt": "desc"}
    )
    return [
        {
            "id": a.id,
            "title": a.title,
            "preview": a.preview,
            "content": a.content,
            "created_at": a.createdAt.isoformat()
        }
        for a in articles
    ]

@router.post("/articles")
async def create_article(req: ArticleRequest, admin: dict = Depends(get_admin_user)):
    """Create a new article. Only accessible by admins."""
    new_article = await db.elitearticle.create(
        data={
            "title": req.title,
            "preview": req.preview,
            "content": req.content
        }
    )
    return {"message": "Artikel berhasil ditambahkan", "id": new_article.id}
