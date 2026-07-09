from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o-mini"
    chroma_path: str = "./chroma_db"
    port: int = 8000
    eureka_server: str = "http://host.docker.internal:8761/eureka/"
    eureka_instance_host: str = "localhost"

    model_config = {"env_file": ".env", "case_sensitive": False}


settings = Settings()