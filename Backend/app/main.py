from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.Routes.routes import router as api_router

try:
    import static_ffmpeg
    static_ffmpeg.add_paths()
except Exception:
    pass

app = FastAPI(
    title="LangChain Models Backend API",
    description="API for YouTube video ingestion and RAG querying",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {"status": "ok", "message": "FastAPI service is running"}
