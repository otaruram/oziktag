"""API Keys management router."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import secrets
from app.database import db
from app.dependencies import get_current_user, get_api_user

router = APIRouter(prefix="/api/apikeys", tags=["API Keys"])

class ApiKeyResponse(BaseModel):
    id: str
    key: str
    name: str
    created_at: str

@router.get("/", response_model=list[ApiKeyResponse])
async def list_keys(current_user: dict = Depends(get_api_user)):
    user_id = current_user["id"]
    keys = await db.apikey.find_many(where={"userId": user_id})
    return [
        ApiKeyResponse(
            id=k.id,
            key=k.key,
            name=k.name,
            created_at=k.createdAt.isoformat()
        ) for k in keys
    ]

@router.post("/")
async def create_key(current_user: dict = Depends(get_api_user)):
    user_id = current_user["id"]
    
    # Check limit, max 3 keys per user
    count = await db.apikey.count(where={"userId": user_id})
    if count >= 3:
        raise HTTPException(status_code=400, detail="Maksimal 3 API Key per akun")

    new_key = f"ozk_live_{secrets.token_hex(16)}"
    
    key_db = await db.apikey.create(
        data={
            "userId": user_id,
            "key": new_key,
            "name": f"Key {count + 1}"
        }
    )
    
    return {
        "id": key_db.id,
        "key": key_db.key,
        "name": key_db.name,
        "created_at": key_db.createdAt.isoformat()
    }

@router.delete("/{key_id}")
async def revoke_key(key_id: str, current_user: dict = Depends(get_api_user)):
    user_id = current_user["id"]
    key_db = await db.apikey.find_unique(where={"id": key_id})
    if not key_db or key_db.userId != user_id:
        raise HTTPException(status_code=404, detail="Key tidak ditemukan")
        
    await db.apikey.delete(where={"id": key_id})
    return {"message": "Key revoked"}


@router.post("/request-access")
async def request_api_access(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # Check if already requested
    existing = await db.apiaccessrequest.find_first(
        where={
            "userId": user_id,
            "status": "pending"
        }
    )
    if existing:
        raise HTTPException(status_code=400, detail="Anda sudah memiliki request yang sedang menunggu persetujuan")

    await db.apiaccessrequest.create(
        data={
            "userId": user_id,
            "status": "pending"
        }
    )
    return {"message": "Request berhasil dikirim"}


@router.get("/request-status")
async def get_api_access_status(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    req = await db.apiaccessrequest.find_first(
        where={"userId": user_id},
        order={"createdAt": "desc"}
    )
    
    if not req:
        return {"status": "none"}
        
    return {"status": req.status}
