from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.controller.ingest_controller import process_ingestion
from app.controller.chat_controller import process_chat

router = APIRouter()

class IngestRequest(BaseModel):
    url: str

class ChatRequest(BaseModel):
    query: str
    session_id: str = Field(default="default_session", description="Unique session ID for conversation history")

@router.post("/ingest")
def process_ingest(request: IngestRequest):
    return process_ingestion(request.url)

@router.post("/chat")
def process_chat_route(request: ChatRequest):
    return process_chat(request.query, session_id=request.session_id)
