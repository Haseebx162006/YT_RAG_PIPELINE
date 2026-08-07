import os

from app.Ingestion_Process.yt_url import get_video_id
from app.Ingestion_Process.downloadingAudio import download_audio
from app.Ingestion_Process.speech_to_text import transcribe_audio
from app.Ingestion_Process.documentCreation import create_document
from app.processing.splitText import convert_to_chunks
from app.embeddings.embeddings import embedding_model
from app.vectorStore.chroma import store_document


def ingest(url: str):

    audio_path = None

    try:
        # Step 1: Parse YouTube URL to extract video ID
        video_id = get_video_id(url)

        # Step 2: Download audio from the YouTube video
        video = download_audio(url)
        audio_path = video["audio_path"]

        # Step 3: Transcribe the audio using Whisper ASR
        transcription = transcribe_audio(audio_path)

        # Step 4: Create a LangChain Document from the transcript
        document = create_document(
            transcription,
            video_id,
            url,
            video["title"],
            video["channel"],
            video["duration"]
        )

        # Step 5: Split document into semantic chunks
        chunked_documents = convert_to_chunks(document)

        # Step 6: Embed and store chunks in ChromaDB
        store_document(chunked_documents, embedding_model=embedding_model)

        return {
            "status": "success",
            "video_id": video_id,
            "title": video["title"],
            "channel": video["channel"],
            "chunks_count": len(chunked_documents)
        }

    finally:
        # Cleanup: Remove temporary audio file to save disk space
        if audio_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
                print(f"Cleaned up temp audio file: {audio_path}")
            except OSError:
                pass
