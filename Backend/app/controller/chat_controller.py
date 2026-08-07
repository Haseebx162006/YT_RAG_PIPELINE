from fastapi import HTTPException
from app.Pipelines.chatPipeline import chat_pipeline

def process_chat(query: str):
    try:
        result = chat_pipeline(query)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message", "Unknown error occurred"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
