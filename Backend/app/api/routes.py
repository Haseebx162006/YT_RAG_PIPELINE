from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.api.ingest import ingest

router = APIRouter()

class IngestRequest(BaseModel):
    url: str

@router.post("/ingest")
def process_ingest(request: IngestRequest):
    try:
        result = ingest(request.url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
