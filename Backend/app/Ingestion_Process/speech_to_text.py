from huggingface_hub import InferenceClient
from app.config import settings

def transcribe_audio(filePath: str) -> str:
    client = InferenceClient(
        provider="hf-inference",
        token=settings.HF_TOKEN
    )
    
    # List of Hugging Face ASR models to try in sequence
    models = [
        "openai/whisper-large-v3-turbo",
        "openai/whisper-large-v3",
        "openai/whisper-medium",
        "openai/whisper-small",
        "openai/whisper-base"
    ]

    last_exception = None
    for model_name in models:
        try:
            print(f"Attempting transcription with model: {model_name}")
            transcript = client.automatic_speech_recognition(
                audio=filePath,
                model=model_name
            )
            text = transcript.text if hasattr(transcript, "text") else transcript.get("text", str(transcript))
            if text:
                return text
        except Exception as e:
            print(f"Model {model_name} failed with error: {e}. Trying next model...")
            last_exception = e
            continue

    raise RuntimeError(f"All Hugging Face speech-to-text models failed. Last error: {last_exception}")

