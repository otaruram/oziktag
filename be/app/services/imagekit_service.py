"""ImageKit upload service."""

from imagekitio import ImageKit
from imagekitio.models.UploadFileRequestOptions import UploadFileRequestOptions
from app.config import get_settings
import base64
import uuid

_ik: ImageKit | None = None


def get_imagekit() -> ImageKit:
    global _ik
    if _ik is None:
        settings = get_settings()
        _ik = ImageKit(
            private_key=settings.imagekit_private_key,
            public_key=settings.imagekit_public_key,
            url_endpoint=settings.imagekit_url_endpoint,
        )
    return _ik


async def upload_image(file_bytes: bytes, filename: str) -> str:
    """
    Upload image bytes to ImageKit and return the URL.
    """
    ik = get_imagekit()

    # Encode to base64 for upload
    b64_data = base64.b64encode(file_bytes).decode("utf-8")

    # Generate unique filename
    unique_name = f"oziktag/{uuid.uuid4().hex}_{filename}"

    options = UploadFileRequestOptions(
        folder="/oziktag/products/",
    )

    result = ik.upload_file(
        file=b64_data,
        file_name=unique_name,
        options=options,
    )

    if result and result.url:
        return result.url

    raise Exception(f"ImageKit upload failed for {filename}")


async def upload_multiple_images(files: list[tuple[bytes, str]]) -> list[str]:
    """
    Upload multiple images and return list of URLs.
    files: list of (file_bytes, filename) tuples
    """
    urls = []
    for file_bytes, filename in files:
        url = await upload_image(file_bytes, filename)
        urls.append(url)
    return urls

from fastapi import UploadFile, HTTPException

async def validate_and_read_images(images: list[UploadFile], max_size_mb: int = 5) -> list[tuple[bytes, str]]:
    """
    Validates content type and size of images, and returns a list of (bytes, filename).
    Throws HTTPException if validation fails.
    """
    valid_types = ["image/jpeg", "image/png", "image/webp"]
    image_files = []
    
    for img in images:
        if img.content_type not in valid_types:
            raise HTTPException(status_code=400, detail=f"File {img.filename} bukan format gambar yang diizinkan (JPG/PNG/WEBP).")
        
        content = await img.read()
        if len(content) > max_size_mb * 1024 * 1024:
            raise HTTPException(status_code=413, detail=f"Ukuran file {img.filename} terlalu besar (Maks {max_size_mb}MB)")
            
        image_files.append((content, img.filename or "image.jpg"))
        
    return image_files
