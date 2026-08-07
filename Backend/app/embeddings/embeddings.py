from langchain_huggingface import HuggingFaceEndpointEmbeddings
from app.config import settings

# Uses settings from pydantic config to guarantee HF_TOKEN is loaded from .env
embedding_model = HuggingFaceEndpointEmbeddings(
    model="BAAI/bge-small-en-v1.5",
    huggingfacehub_api_token=settings.HF_TOKEN
)
