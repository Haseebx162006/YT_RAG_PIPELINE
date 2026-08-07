from fastapi import HTTPException
from app.Pipelines.ingest_pipeline import ingest

def process_ingestion(url: str):
    try:
        result = ingest(url)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message", "Unknown error occurred"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
