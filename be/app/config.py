from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase Auth
    supabase_url: str
    supabase_key: str
    supabase_callback_url: str = ""

    # Database (Prisma)
    database_url: str
    direct_url: str = ""

    # ImageKit
    imagekit_private_key: str
    imagekit_public_key: str
    imagekit_url_endpoint: str

    # Node Microservice
    node_backend_url: str = "http://localhost:3000"

    # Gemini AI
    gemini_api_key: str
    gemini_base_url: str = "https://ai.sumopod.com"
    gemini_model: str = "gemini/gemini-2.5-flash-lite"

    # Admin
    admin_email: str = "okitr52@gmail.com"

    # Pricing
    exchange_rate: float = 17000.0
    price_buffer_percent: float = 25.0

    # App
    frontend_url: str = "http://localhost:5173"
    app_url: str = "http://localhost:8000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
