from huggingface_hub import InferenceClient
from app.config import settings

def transcribe_audio(filePath: str) -> str:
    client = InferenceClient(
        provider="hf-inference",
        token=settings.HF_TOKEN
    )
    transcript = client.automatic_speech_recognition(
        audio=filePath,
        model="openai/whisper-large-v3"
    )
    return transcript.text if hasattr(transcript, "text") else transcript.get("text", str(transcript))



