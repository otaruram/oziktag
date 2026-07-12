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

class VideoRequest(BaseModel):
    title: str
    youtubeUrl: str
    thumbnail: str
    duration: str
    category: str

@router.get("/videos")
async def get_elite_videos():
    """Fetch Elite Hub videos from database."""
    videos = await db.elitevideo.find_many(
        order={"createdAt": "desc"}
    )
    return [
        {
            "id": v.id,
            "title": v.title,
            "youtubeUrl": v.youtubeUrl,
            "thumbnail": v.thumbnail,
            "duration": v.duration,
            "category": v.category,
            "createdAt": v.createdAt.isoformat()
        }
        for v in videos
    ]

@router.post("/videos")
async def create_video(req: VideoRequest, admin: dict = Depends(get_admin_user)):
    """Create a new video. Only accessible by admins."""
    new_video = await db.elitevideo.create(
        data={
            "title": req.title,
            "youtubeUrl": req.youtubeUrl,
            "thumbnail": req.thumbnail,
            "duration": req.duration,
            "category": req.category
        }
    )
    return {"message": "Video berhasil ditambahkan", "id": new_video.id}

@router.put("/videos/{video_id}")
async def update_video(video_id: str, req: VideoRequest, admin: dict = Depends(get_admin_user)):
    """Update a video. Only accessible by admins."""
    updated = await db.elitevideo.update(
        where={"id": video_id},
        data={
            "title": req.title,
            "youtubeUrl": req.youtubeUrl,
            "thumbnail": req.thumbnail,
            "duration": req.duration,
            "category": req.category
        }
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Video tidak ditemukan")
    return {"message": "Video berhasil diupdate"}

@router.delete("/videos/{video_id}")
async def delete_video(video_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a video. Only accessible by admins."""
    deleted = await db.elitevideo.delete(
        where={"id": video_id}
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Video tidak ditemukan")
    return {"message": "Video berhasil dihapus"}


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

@router.put("/articles/{article_id}")
async def update_article(article_id: str, req: ArticleRequest, admin: dict = Depends(get_admin_user)):
    """Update an article. Only accessible by admins."""
    updated = await db.elitearticle.update(
        where={"id": article_id},
        data={
            "title": req.title,
            "preview": req.preview,
            "content": req.content
        }
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")
    return {"message": "Artikel berhasil diupdate"}

@router.delete("/articles/{article_id}")
async def delete_article(article_id: str, admin: dict = Depends(get_admin_user)):
    """Delete an article. Only accessible by admins."""
    deleted = await db.elitearticle.delete(
        where={"id": article_id}
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")
    return {"message": "Artikel berhasil dihapus"}
