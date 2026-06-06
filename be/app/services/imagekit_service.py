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
